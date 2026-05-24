#!/usr/bin/env pwsh
# ─────────────────────────────────────────────────────────────
# SBA MSME Portal — Cloud Run Deployment Script
# Project: sba-msme-portal-lr | Region: us-central1
# ─────────────────────────────────────────────────────────────

$PROJECT_ID = "sba-msme-portal-lr"
$REGION     = "us-central1"
$REPO_NAME  = "sba-registry"
$DB_INSTANCE= "sba-postgres"
$DB_NAME    = "sba_msme_db"
$DB_USER    = "sba_app"
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
$JWT_REFRESH= -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
$DB_PASSWORD= -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 20 | ForEach-Object { [char]$_ })

Write-Host "🚀 SBA MSME Portal — Cloud Run Deployment" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID | Region: $REGION" -ForegroundColor Gray

# ── 1. Set project ──────────────────────────────────────────
gcloud config set project $PROJECT_ID

# ── 2. Create Artifact Registry ────────────────────────────
Write-Host "`n📦 Creating Artifact Registry..." -ForegroundColor Yellow
gcloud artifacts repositories create $REPO_NAME `
  --repository-format=docker `
  --location=$REGION `
  --description="SBA MSME Portal Docker Images" `
  --project=$PROJECT_ID

# ── 3. Store secrets in Secret Manager ─────────────────────
Write-Host "`n🔐 Storing secrets..." -ForegroundColor Yellow
$JWT_SECRET    | gcloud secrets create jwt-secret     --data-file=- --project=$PROJECT_ID
$JWT_REFRESH   | gcloud secrets create jwt-refresh    --data-file=- --project=$PROJECT_ID
$DB_PASSWORD   | gcloud secrets create db-password    --data-file=- --project=$PROJECT_ID

# ── 4. Create Cloud SQL (PostgreSQL 16) ─────────────────────
Write-Host "`n🗄️  Creating Cloud SQL instance (this takes ~5 minutes)..." -ForegroundColor Yellow
gcloud sql instances create $DB_INSTANCE `
  --database-version=POSTGRES_16 `
  --tier=db-f1-micro `
  --region=$REGION `
  --storage-type=SSD `
  --storage-size=10GB `
  --storage-auto-increase `
  --no-backup `
  --project=$PROJECT_ID

# Create database and user
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE --project=$PROJECT_ID
gcloud sql users create $DB_USER --instance=$DB_INSTANCE --password="$DB_PASSWORD" --project=$PROJECT_ID

Write-Host "✅ Cloud SQL ready" -ForegroundColor Green

# ── 5. Configure Docker auth ────────────────────────────────
Write-Host "`n🔧 Configuring Docker auth..." -ForegroundColor Yellow
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# ── 6. Build & Push Backend ─────────────────────────────────
Write-Host "`n🏗️  Building Backend image..." -ForegroundColor Yellow
$BACKEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend:latest"
docker build -t $BACKEND_IMAGE -f apps/backend/Dockerfile .
docker push $BACKEND_IMAGE

# Get Cloud SQL connection name
$CONNECTION_NAME = (gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID --format="value(connectionName)")
$DATABASE_URL = "postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"

# Grant Cloud Run SA access to Secret Manager
$PROJECT_NUMBER = (gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
$SA = "serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT_ID --member=$SA --role="roles/secretmanager.secretAccessor" --quiet
gcloud projects add-iam-policy-binding $PROJECT_ID --member=$SA --role="roles/cloudsql.client" --quiet

# ── 7. Deploy Backend to Cloud Run ─────────────────────────
Write-Host "`n🚀 Deploying Backend to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy sba-backend `
  --image=$BACKEND_IMAGE `
  --platform=managed `
  --region=$REGION `
  --allow-unauthenticated `
  --port=3001 `
  --memory=512Mi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=5 `
  --add-cloudsql-instances=$CONNECTION_NAME `
  --set-env-vars="NODE_ENV=production,DATABASE_URL=$DATABASE_URL,PORT=3001,JWT_EXPIRES_IN=15m,JWT_REFRESH_EXPIRES_IN=7d,BCRYPT_ROUNDS=12,UPLOAD_DIR=/tmp/uploads,MAX_FILE_SIZE=10485760" `
  --set-secrets="JWT_SECRET=jwt-secret:latest,JWT_REFRESH_SECRET=jwt-refresh:latest" `
  --project=$PROJECT_ID

$BACKEND_URL = (gcloud run services describe sba-backend --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
Write-Host "✅ Backend deployed: $BACKEND_URL" -ForegroundColor Green

# ── 8. Run DB migrations inside Cloud Run Job ───────────────
Write-Host "`n🗃️  Running database migrations..." -ForegroundColor Yellow
gcloud run jobs create sba-migrate `
  --image=$BACKEND_IMAGE `
  --region=$REGION `
  --add-cloudsql-instances=$CONNECTION_NAME `
  --set-env-vars="DATABASE_URL=$DATABASE_URL" `
  --command="npx","prisma","migrate","deploy" `
  --project=$PROJECT_ID

gcloud run jobs execute sba-migrate --region=$REGION --project=$PROJECT_ID --wait

# Run seed
gcloud run jobs create sba-seed `
  --image=$BACKEND_IMAGE `
  --region=$REGION `
  --add-cloudsql-instances=$CONNECTION_NAME `
  --set-env-vars="DATABASE_URL=$DATABASE_URL" `
  --command="npx","prisma","db","seed" `
  --project=$PROJECT_ID

gcloud run jobs execute sba-seed --region=$REGION --project=$PROJECT_ID --wait

Write-Host "✅ Database migrations and seed complete" -ForegroundColor Green

# ── 9. Build & Push Frontend ────────────────────────────────
Write-Host "`n🏗️  Building Frontend image..." -ForegroundColor Yellow
$FRONTEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/frontend:latest"

# Inject backend URL into frontend build
$env:VITE_API_URL = "$BACKEND_URL/api"
docker build -t $FRONTEND_IMAGE -f apps/frontend/Dockerfile --build-arg VITE_API_URL="$BACKEND_URL/api" .
docker push $FRONTEND_IMAGE

# ── 10. Deploy Frontend to Cloud Run ───────────────────────
Write-Host "`n🚀 Deploying Frontend to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy sba-frontend `
  --image=$FRONTEND_IMAGE `
  --platform=managed `
  --region=$REGION `
  --allow-unauthenticated `
  --port=80 `
  --memory=256Mi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=5 `
  --project=$PROJECT_ID

$FRONTEND_URL = (gcloud run services describe sba-frontend --region=$REGION --project=$PROJECT_ID --format="value(status.url)")

# Update backend CORS to allow frontend URL
gcloud run services update sba-backend `
  --region=$REGION `
  --update-env-vars="CORS_ORIGINS=$FRONTEND_URL" `
  --project=$PROJECT_ID

Write-Host "`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅  SBA MSME Portal Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🌐 Frontend:  $FRONTEND_URL" -ForegroundColor White
Write-Host "🔌 Backend:   $BACKEND_URL" -ForegroundColor White
Write-Host "📚 API Docs:  $BACKEND_URL/api/docs" -ForegroundColor White
Write-Host "🗄️  Database:  Cloud SQL → $DB_INSTANCE ($REGION)" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT: Change default passwords at $FRONTEND_URL" -ForegroundColor Yellow
