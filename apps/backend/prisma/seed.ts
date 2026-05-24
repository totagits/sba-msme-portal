import { PrismaClient, RoleName, WorkflowStatus, MSMECategory, BusinessType, FormalityStatus, BusinessStage, BDSPType, AvailabilityStatus, OpportunityType, OpportunityStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─────────────────────────────────────────
  // ROLES
  // ─────────────────────────────────────────
  console.log('Creating roles...');
  const rolesData = [
    { name: RoleName.SUPER_ADMIN, displayName: 'Super Administrator', description: 'Full system control' },
    { name: RoleName.SBA_ADMIN, displayName: 'SBA Administrator', description: 'Manages MSMEs, BDSPs, users, and reports' },
    { name: RoleName.COUNTY_SUPERVISOR, displayName: 'County Supervisor', description: 'Reviews and validates records from assigned county' },
    { name: RoleName.DATA_ENTRY_OFFICER, displayName: 'Data Entry Officer', description: 'Registers MSMEs and BDSPs, performs field updates' },
    { name: RoleName.INSPECTOR, displayName: 'Inspector / Verification Officer', description: 'Verifies business existence, ownership, and data' },
    { name: RoleName.DATA_ANALYST, displayName: 'Data Analyst', description: 'Accesses analytics, dashboards, exports' },
    { name: RoleName.PARTNER_VIEWER, displayName: 'Development Partner Viewer', description: 'Read-only access to approved aggregated data' },
    { name: RoleName.FINANCIAL_INSTITUTION_VIEWER, displayName: 'Financial Institution Viewer', description: 'Read-only access to verified MSMEs' },
    { name: RoleName.MSME_OWNER, displayName: 'MSME Owner', description: 'Business owner portal access' },
    { name: RoleName.AUDITOR, displayName: 'Auditor', description: 'Read-only access to audit logs and compliance records' },
  ];

  const roles: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { ...r, isSystem: true },
    });
    roles[r.name] = role.id;
  }

  // ─────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────
  console.log('Creating permissions...');
  const permissionsData = [
    // MSME permissions
    { name: 'msme:read', resource: 'msme', action: 'read', description: 'View MSME records' },
    { name: 'msme:create', resource: 'msme', action: 'create', description: 'Create MSME records' },
    { name: 'msme:update', resource: 'msme', action: 'update', description: 'Update MSME records' },
    { name: 'msme:delete', resource: 'msme', action: 'delete', description: 'Delete MSME records' },
    { name: 'msme:export', resource: 'msme', action: 'export', description: 'Export MSME data' },
    { name: 'msme:import', resource: 'msme', action: 'import', description: 'Import MSME data' },
    { name: 'msme:approve', resource: 'msme', action: 'approve', description: 'Approve MSME records' },
    { name: 'msme:verify', resource: 'msme', action: 'verify', description: 'Verify MSME records' },
    // BDSP permissions
    { name: 'bdsp:read', resource: 'bdsp', action: 'read', description: 'View BDSP records' },
    { name: 'bdsp:create', resource: 'bdsp', action: 'create', description: 'Create BDSP records' },
    { name: 'bdsp:update', resource: 'bdsp', action: 'update', description: 'Update BDSP records' },
    { name: 'bdsp:delete', resource: 'bdsp', action: 'delete', description: 'Delete BDSP records' },
    { name: 'bdsp:approve', resource: 'bdsp', action: 'approve', description: 'Approve BDSP records' },
    // User management
    { name: 'user:read', resource: 'user', action: 'read', description: 'View users' },
    { name: 'user:create', resource: 'user', action: 'create', description: 'Create users' },
    { name: 'user:update', resource: 'user', action: 'update', description: 'Update users' },
    { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },
    // Reports
    { name: 'report:read', resource: 'report', action: 'read', description: 'View reports' },
    { name: 'report:generate', resource: 'report', action: 'generate', description: 'Generate reports' },
    { name: 'report:export', resource: 'report', action: 'export', description: 'Export reports' },
    // Analytics
    { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics dashboards' },
    // Audit
    { name: 'audit:read', resource: 'audit', action: 'read', description: 'View audit logs' },
    // Settings
    { name: 'settings:read', resource: 'settings', action: 'read', description: 'View settings' },
    { name: 'settings:update', resource: 'settings', action: 'update', description: 'Update settings' },
    // Roles & Permissions
    { name: 'role:manage', resource: 'role', action: 'manage', description: 'Manage roles and permissions' },
  ];

  const perms: Record<string, string> = {};
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    perms[p.name] = perm.id;
  }

  // Assign permissions to roles
  const rolePermMap: Record<string, string[]> = {
    [RoleName.SUPER_ADMIN]: Object.keys(perms),
    [RoleName.SBA_ADMIN]: ['msme:read','msme:create','msme:update','msme:delete','msme:export','msme:import','msme:approve','msme:verify','bdsp:read','bdsp:create','bdsp:update','bdsp:delete','bdsp:approve','user:read','user:create','user:update','report:read','report:generate','report:export','analytics:read','audit:read','settings:read'],
    [RoleName.COUNTY_SUPERVISOR]: ['msme:read','msme:update','msme:approve','msme:verify','bdsp:read','bdsp:update','bdsp:approve','report:read','analytics:read'],
    [RoleName.DATA_ENTRY_OFFICER]: ['msme:read','msme:create','msme:update','msme:import','bdsp:read','bdsp:create','bdsp:update'],
    [RoleName.INSPECTOR]: ['msme:read','msme:verify','msme:update','bdsp:read','bdsp:verify'],
    [RoleName.DATA_ANALYST]: ['msme:read','msme:export','bdsp:read','report:read','report:generate','report:export','analytics:read'],
    [RoleName.PARTNER_VIEWER]: ['msme:read','bdsp:read','report:read','analytics:read'],
    [RoleName.FINANCIAL_INSTITUTION_VIEWER]: ['msme:read'],
    [RoleName.MSME_OWNER]: ['msme:read','msme:update'],
    [RoleName.AUDITOR]: ['msme:read','bdsp:read','audit:read','report:read'],
  };

  for (const [roleName, permNames] of Object.entries(rolePermMap)) {
    const roleId = roles[roleName];
    for (const permName of permNames) {
      const permId = perms[permName];
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: permId } },
          update: {},
          create: { roleId, permissionId: permId },
        });
      }
    }
  }

  // ─────────────────────────────────────────
  // COUNTIES OF LIBERIA
  // ─────────────────────────────────────────
  console.log('Creating counties...');
  const countiesData = [
    { name: 'Bomi', code: 'BOM', capital: 'Tubmanburg', latitude: 6.8667, longitude: -10.8333 },
    { name: 'Bong', code: 'BON', capital: 'Gbarnga', latitude: 6.9969, longitude: -9.4717 },
    { name: 'Gbarpolu', code: 'GBP', capital: 'Bopolu', latitude: 7.0667, longitude: -10.4833 },
    { name: 'Grand Bassa', code: 'GBA', capital: 'Buchanan', latitude: 5.8808, longitude: -10.0467 },
    { name: 'Grand Cape Mount', code: 'GCM', capital: 'Robertsport', latitude: 6.7333, longitude: -11.3667 },
    { name: 'Grand Gedeh', code: 'GGE', capital: 'Zwedru', latitude: 6.0614, longitude: -8.1297 },
    { name: 'Grand Kru', code: 'GKR', capital: 'Barclayville', latitude: 4.6908, longitude: -8.2272 },
    { name: 'Lofa', code: 'LOF', capital: 'Voinjama', latitude: 8.4219, longitude: -9.7476 },
    { name: 'Margibi', code: 'MAR', capital: 'Kakata', latitude: 6.5342, longitude: -10.3506 },
    { name: 'Maryland', code: 'MRY', capital: 'Harper', latitude: 4.3756, longitude: -7.7169 },
    { name: 'Montserrado', code: 'MON', capital: 'Bensonville', latitude: 6.4281, longitude: -10.7969 },
    { name: 'Nimba', code: 'NIM', capital: 'Sanniquellie', latitude: 7.3589, longitude: -8.7064 },
    { name: 'River Cess', code: 'RCE', capital: 'Cestos City', latitude: 5.4667, longitude: -9.5833 },
    { name: 'River Gee', code: 'RGE', capital: 'Fish Town', latitude: 5.2000, longitude: -7.8667 },
    { name: 'Sinoe', code: 'SIN', capital: 'Greenville', latitude: 5.0106, longitude: -9.0411 },
  ];

  const counties: Record<string, string> = {};
  for (const c of countiesData) {
    const county = await prisma.county.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    counties[c.name] = county.id;
  }

  // ─────────────────────────────────────────
  // SECTORS
  // ─────────────────────────────────────────
  console.log('Creating sectors...');
  const sectorsData = [
    { name: 'Agriculture', code: 'AGR', description: 'Farming, livestock, and agro-processing' },
    { name: 'Manufacturing', code: 'MFG', description: 'Production and processing industries' },
    { name: 'Trade & Commerce', code: 'TRD', description: 'Retail, wholesale, and trading activities' },
    { name: 'Services', code: 'SVC', description: 'Professional and general services' },
    { name: 'ICT', code: 'ICT', description: 'Information and communication technology' },
    { name: 'Transport & Logistics', code: 'TRN', description: 'Transportation and logistics services' },
    { name: 'Construction', code: 'CON', description: 'Building and construction sector' },
    { name: 'Creative Industry', code: 'CRE', description: 'Arts, culture, fashion, and creative services' },
    { name: 'Hospitality & Tourism', code: 'HOS', description: 'Hotels, restaurants, and tourism' },
    { name: 'Mining Support', code: 'MIN', description: 'Services supporting mining operations' },
    { name: 'Fisheries & Aquaculture', code: 'FSH', description: 'Fishing and aquaculture activities' },
    { name: 'Healthcare', code: 'HLT', description: 'Health services and pharmaceutical' },
    { name: 'Education & Training', code: 'EDU', description: 'Education and skills training' },
    { name: 'Financial Services', code: 'FIN', description: 'Financial services excluding banking' },
    { name: 'Other', code: 'OTH', description: 'Other sectors not listed' },
  ];

  const sectors: Record<string, string> = {};
  for (const s of sectorsData) {
    const sector = await prisma.sector.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    sectors[s.name] = sector.id;
  }

  // Sample subsectors
  const subsectorsData = [
    { name: 'Crop Production', sectorId: sectors['Agriculture'] },
    { name: 'Livestock & Poultry', sectorId: sectors['Agriculture'] },
    { name: 'Agro-processing', sectorId: sectors['Agriculture'] },
    { name: 'Food Processing', sectorId: sectors['Manufacturing'] },
    { name: 'Textile & Garment', sectorId: sectors['Manufacturing'] },
    { name: 'Retail Trade', sectorId: sectors['Trade & Commerce'] },
    { name: 'Wholesale Trade', sectorId: sectors['Trade & Commerce'] },
    { name: 'Software & Apps', sectorId: sectors['ICT'] },
    { name: 'Mobile Money', sectorId: sectors['ICT'] },
    { name: 'Marine Fisheries', sectorId: sectors['Fisheries & Aquaculture'] },
  ];
  for (const sub of subsectorsData) {
    await prisma.subsector.upsert({
      where: { name_sectorId: { name: sub.name, sectorId: sub.sectorId } },
      update: {},
      create: sub,
    });
  }

  // ─────────────────────────────────────────
  // DISTRICTS (sample)
  // ─────────────────────────────────────────
  const districtsData = [
    { name: 'Greater Monrovia', countyId: counties['Montserrado'] },
    { name: 'Careysburg', countyId: counties['Montserrado'] },
    { name: 'Gbarnga', countyId: counties['Bong'] },
    { name: 'Suakoko', countyId: counties['Bong'] },
    { name: 'Buchanan', countyId: counties['Grand Bassa'] },
    { name: 'Sanniquellie', countyId: counties['Nimba'] },
    { name: 'Ganta', countyId: counties['Nimba'] },
  ];
  for (const d of districtsData) {
    await prisma.district.upsert({
      where: { name_countyId: { name: d.name, countyId: d.countyId } },
      update: {},
      create: d,
    });
  }

  // ─────────────────────────────────────────
  // SEED USERS
  // ─────────────────────────────────────────
  console.log('Creating seed users...');
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  const usersData = [
    {
      email: 'admin@sba.gov.lr',
      firstName: 'System',
      lastName: 'Administrator',
      title: 'System Administrator',
      phone: '+231770000000',
      role: RoleName.SUPER_ADMIN,
      countyId: null as string | null,
    },
    {
      email: 'sba.admin@sba.gov.lr',
      firstName: 'SBA',
      lastName: 'Administrator',
      title: 'SBA Administrator',
      phone: '+231770000001',
      role: RoleName.SBA_ADMIN,
      countyId: null as string | null,
    },
    {
      email: 'supervisor@sba.gov.lr',
      firstName: 'County',
      lastName: 'Supervisor',
      title: 'County Supervisor',
      phone: '+231770000002',
      role: RoleName.COUNTY_SUPERVISOR,
      countyId: counties['Montserrado'] as string | null,
    },
    {
      email: 'data.officer@sba.gov.lr',
      firstName: 'Data Entry',
      lastName: 'Officer',
      title: 'Data Entry Officer',
      phone: '+231770000003',
      role: RoleName.DATA_ENTRY_OFFICER,
      countyId: counties['Montserrado'] as string | null,
    },
    {
      email: 'inspector@sba.gov.lr',
      firstName: 'Field',
      lastName: 'Inspector',
      title: 'Verification Inspector',
      phone: '+231880000004',
      role: RoleName.INSPECTOR,
      countyId: counties['Montserrado'] as string | null,
    },
    {
      email: 'analyst@sba.gov.lr',
      firstName: 'Data',
      lastName: 'Analyst',
      title: 'Senior Data Analyst',
      phone: '+231770000005',
      role: RoleName.DATA_ANALYST,
      countyId: null as string | null,
    },
    {
      email: 'partner@sba.gov.lr',
      firstName: 'Development',
      lastName: 'Partner',
      title: 'UNDP Programme Officer',
      phone: '+231880000006',
      role: RoleName.PARTNER_VIEWER,
      countyId: null as string | null,
    },
    {
      email: 'finance.viewer@sba.gov.lr',
      firstName: 'Finance',
      lastName: 'Viewer',
      title: 'Financial Institution Officer',
      phone: '+231770000007',
      role: RoleName.FINANCIAL_INSTITUTION_VIEWER,
      countyId: null as string | null,
    },
    {
      email: 'owner@sba.gov.lr',
      firstName: 'MSME',
      lastName: 'Owner',
      title: 'Business Owner',
      phone: '+231880000008',
      role: RoleName.MSME_OWNER,
      countyId: counties['Montserrado'] as string | null,
    },
    {
      email: 'auditor@sba.gov.lr',
      firstName: 'Internal',
      lastName: 'Auditor',
      title: 'Internal Auditor',
      phone: '+231770000009',
      role: RoleName.AUDITOR,
      countyId: null as string | null,
    },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of usersData) {
    const { role, countyId, ...userData } = u;
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash,
        status: 'ACTIVE',
        countyId: countyId || null,
      },
    });
    createdUsers[userData.email] = user.id;

    const roleId = roles[role];
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
  }

  // ─────────────────────────────────────────
  // SAMPLE MSMEs
  // ─────────────────────────────────────────
  console.log('Creating sample MSMEs...');
  const sampleMSMEs = [
    {
      businessName: 'Monrovia Fresh Produce Market',
      registrationNumber: 'BUS-2024-001',
      businessType: BusinessType.SOLE_PROPRIETORSHIP,
      msmeCategory: MSMECategory.MICRO,
      formalityStatus: FormalityStatus.REGISTERED,
      sectorId: sectors['Agriculture'],
      countyId: counties['Montserrado'],
      cityTownCommunity: 'Monrovia',
      physicalAddress: 'Red Light Market, Paynesville',
      phone: '+231770000001',
      email: 'freshmkt@email.lr',
      ownerName: 'Mary Johnson',
      ownerGender: 'Female',
      ownerAge: 32,
      isYouthLed: false,
      isWomenLed: true,
      numberOfEmployees: 4,
      numberOfFemaleEmployees: 3,
      numberOfYouthEmployees: 1,
      businessStage: BusinessStage.GROWTH,
      workflowStatus: WorkflowStatus.APPROVED,
      gpsLatitude: 6.3536,
      gpsLongitude: -10.7892,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Nimba Youth Tech Solutions',
      registrationNumber: 'BUS-2024-002',
      businessType: BusinessType.PARTNERSHIP,
      msmeCategory: MSMECategory.SMALL,
      formalityStatus: FormalityStatus.REGISTERED,
      sectorId: sectors['ICT'],
      countyId: counties['Nimba'],
      cityTownCommunity: 'Sanniquellie',
      physicalAddress: 'Main Street, Sanniquellie',
      phone: '+231880000002',
      email: 'nimbatechsol@email.lr',
      ownerName: 'James Kollie',
      ownerGender: 'Male',
      ownerAge: 25,
      isYouthLed: true,
      isWomenLed: false,
      numberOfEmployees: 8,
      numberOfFemaleEmployees: 3,
      numberOfYouthEmployees: 7,
      businessStage: BusinessStage.EARLY_GROWTH,
      workflowStatus: WorkflowStatus.VERIFIED,
      gpsLatitude: 7.3589,
      gpsLongitude: -8.7064,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Bong County Cassava Processors Cooperative',
      registrationNumber: 'BUS-2024-003',
      businessType: BusinessType.COOPERATIVE,
      msmeCategory: MSMECategory.SMALL,
      formalityStatus: FormalityStatus.REGISTERED,
      sectorId: sectors['Agriculture'],
      countyId: counties['Bong'],
      cityTownCommunity: 'Gbarnga',
      physicalAddress: 'Gbarnga Junction Area',
      phone: '+231770000003',
      ownerName: 'Grace Flomo',
      ownerGender: 'Female',
      ownerAge: 45,
      isYouthLed: false,
      isWomenLed: true,
      numberOfEmployees: 22,
      numberOfFemaleEmployees: 18,
      numberOfYouthEmployees: 5,
      businessStage: BusinessStage.GROWTH,
      workflowStatus: WorkflowStatus.APPROVED,
      gpsLatitude: 6.9969,
      gpsLongitude: -9.4717,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Lofa Timber & Wood Works',
      businessType: BusinessType.SOLE_PROPRIETORSHIP,
      msmeCategory: MSMECategory.MICRO,
      formalityStatus: FormalityStatus.UNREGISTERED,
      sectorId: sectors['Manufacturing'],
      countyId: counties['Lofa'],
      cityTownCommunity: 'Voinjama',
      phone: '+231880000004',
      ownerName: 'Thomas Kpeh',
      ownerGender: 'Male',
      ownerAge: 38,
      isYouthLed: false,
      isWomenLed: false,
      numberOfEmployees: 6,
      numberOfFemaleEmployees: 1,
      numberOfYouthEmployees: 2,
      businessStage: BusinessStage.EARLY_GROWTH,
      workflowStatus: WorkflowStatus.SUBMITTED,
      gpsLatitude: 8.4219,
      gpsLongitude: -9.7476,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Grand Bassa Fisheries Ltd',
      registrationNumber: 'BUS-2024-005',
      businessType: BusinessType.CORPORATION,
      msmeCategory: MSMECategory.MEDIUM,
      formalityStatus: FormalityStatus.REGISTERED,
      sectorId: sectors['Fisheries & Aquaculture'],
      countyId: counties['Grand Bassa'],
      cityTownCommunity: 'Buchanan',
      physicalAddress: 'Buchanan Port Area',
      phone: '+231770000005',
      email: 'gbbassafisheries@email.lr',
      ownerName: 'Samuel Freeman',
      ownerGender: 'Male',
      ownerAge: 52,
      isYouthLed: false,
      isWomenLed: false,
      numberOfEmployees: 45,
      numberOfFemaleEmployees: 12,
      numberOfYouthEmployees: 10,
      businessStage: BusinessStage.MATURE,
      workflowStatus: WorkflowStatus.APPROVED,
      gpsLatitude: 5.8808,
      gpsLongitude: -10.0467,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Margibi Youth Tailoring Center',
      businessType: BusinessType.ASSOCIATION,
      msmeCategory: MSMECategory.MICRO,
      formalityStatus: FormalityStatus.PENDING_REGISTRATION,
      sectorId: sectors['Creative Industry'],
      countyId: counties['Margibi'],
      cityTownCommunity: 'Kakata',
      phone: '+231880000006',
      ownerName: 'Rose Sumo',
      ownerGender: 'Female',
      ownerAge: 22,
      isYouthLed: true,
      isWomenLed: true,
      numberOfEmployees: 12,
      numberOfFemaleEmployees: 10,
      numberOfYouthEmployees: 12,
      businessStage: BusinessStage.STARTUP,
      workflowStatus: WorkflowStatus.UNDER_REVIEW,
      gpsLatitude: 6.5342,
      gpsLongitude: -10.3506,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Sinoe County Rice Millers',
      businessType: BusinessType.COOPERATIVE,
      msmeCategory: MSMECategory.SMALL,
      formalityStatus: FormalityStatus.REGISTERED,
      sectorId: sectors['Agriculture'],
      countyId: counties['Sinoe'],
      cityTownCommunity: 'Greenville',
      phone: '+231770000007',
      ownerName: 'Emmanuel Brown',
      ownerGender: 'Male',
      ownerAge: 41,
      isYouthLed: false,
      isWomenLed: false,
      numberOfEmployees: 18,
      numberOfFemaleEmployees: 8,
      numberOfYouthEmployees: 4,
      businessStage: BusinessStage.GROWTH,
      workflowStatus: WorkflowStatus.APPROVED,
      gpsLatitude: 5.0106,
      gpsLongitude: -9.0411,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Kakata Mobile Phone & Repair',
      businessType: BusinessType.SOLE_PROPRIETORSHIP,
      msmeCategory: MSMECategory.MICRO,
      formalityStatus: FormalityStatus.UNREGISTERED,
      sectorId: sectors['ICT'],
      countyId: counties['Margibi'],
      cityTownCommunity: 'Kakata',
      phone: '+231880000008',
      ownerName: 'John Saydee',
      ownerGender: 'Male',
      ownerAge: 27,
      isYouthLed: true,
      isWomenLed: false,
      numberOfEmployees: 2,
      numberOfFemaleEmployees: 0,
      numberOfYouthEmployees: 2,
      businessStage: BusinessStage.STARTUP,
      workflowStatus: WorkflowStatus.DRAFT,
      gpsLatitude: 6.5342,
      gpsLongitude: -10.3506,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Cape Mount Women Soap Makers',
      businessType: BusinessType.COOPERATIVE,
      msmeCategory: MSMECategory.MICRO,
      formalityStatus: FormalityStatus.REGISTERED,
      sectorId: sectors['Manufacturing'],
      countyId: counties['Grand Cape Mount'],
      cityTownCommunity: 'Robertsport',
      phone: '+231770000009',
      ownerName: 'Martha Wleh',
      ownerGender: 'Female',
      ownerAge: 35,
      isYouthLed: false,
      isWomenLed: true,
      numberOfEmployees: 15,
      numberOfFemaleEmployees: 15,
      numberOfYouthEmployees: 3,
      businessStage: BusinessStage.GROWTH,
      workflowStatus: WorkflowStatus.VERIFIED,
      gpsLatitude: 6.7333,
      gpsLongitude: -11.3667,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
    {
      businessName: 'Monrovia Catering & Events',
      registrationNumber: 'BUS-2024-010',
      businessType: BusinessType.SOLE_PROPRIETORSHIP,
      msmeCategory: MSMECategory.SMALL,
      formalityStatus: FormalityStatus.REGISTERED,
      sectorId: sectors['Hospitality & Tourism'],
      countyId: counties['Montserrado'],
      cityTownCommunity: 'Monrovia',
      physicalAddress: 'Congo Town, Monrovia',
      phone: '+231880000010',
      email: 'moncatering@email.lr',
      ownerName: 'Patricia Gbee',
      ownerGender: 'Female',
      ownerAge: 39,
      isYouthLed: false,
      isWomenLed: true,
      numberOfEmployees: 14,
      numberOfFemaleEmployees: 9,
      numberOfYouthEmployees: 6,
      businessStage: BusinessStage.GROWTH,
      workflowStatus: WorkflowStatus.APPROVED,
      gpsLatitude: 6.3236,
      gpsLongitude: -10.8002,
      createdById: createdUsers['data.officer@sba.gov.lr'],
    },
  ];

  for (const msme of sampleMSMEs) {
    await prisma.mSME.create({ data: msme as any });
  }

  // ─────────────────────────────────────────
  // SAMPLE BDSPs
  // ─────────────────────────────────────────
  console.log('Creating sample BDSPs...');
  const sampleBDSPs = [
    {
      providerName: 'Liberia Enterprise Development Finance',
      providerType: BDSPType.FINANCIAL_INSTITUTION,
      registrationStatus: FormalityStatus.REGISTERED,
      servicesOffered: ['Microfinance', 'Business Loans', 'Savings Groups'],
      countiesServed: ['Montserrado', 'Margibi', 'Bong'],
      contactPerson: 'Robert Kpoto',
      phone: '+231770100001',
      email: 'info@ledf.lr',
      website: 'www.ledf.lr',
      physicalAddress: 'Broad Street, Monrovia',
      countyId: counties['Montserrado'],
      yearsOfExperience: 12,
      staffCapacity: 35,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      workflowStatus: WorkflowStatus.APPROVED,
      createdById: createdUsers['sba.admin@sba.gov.lr'],
    },
    {
      providerName: 'MSME Training Academy Liberia',
      providerType: BDSPType.TRAINING_INSTITUTION,
      registrationStatus: FormalityStatus.REGISTERED,
      servicesOffered: ['Business Management Training', 'Financial Literacy', 'Marketing Skills'],
      countiesServed: ['Montserrado', 'Nimba', 'Lofa', 'Bong'],
      contactPerson: 'Dr. Alice Gaye',
      phone: '+231880100002',
      email: 'info@msme-academy.lr',
      physicalAddress: 'Sinkor, Monrovia',
      countyId: counties['Montserrado'],
      yearsOfExperience: 8,
      staffCapacity: 20,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      workflowStatus: WorkflowStatus.APPROVED,
      createdById: createdUsers['sba.admin@sba.gov.lr'],
    },
    {
      providerName: 'Liberia Youth Business Incubator',
      providerType: BDSPType.INCUBATOR,
      registrationStatus: FormalityStatus.REGISTERED,
      servicesOffered: ['Business Incubation', 'Mentorship', 'Workspace Access', 'Pitch Coaching'],
      countiesServed: ['Montserrado'],
      contactPerson: 'Michael Tokpah',
      phone: '+231770100003',
      email: 'info@lybi.lr',
      website: 'www.lybi.lr',
      physicalAddress: 'Mamba Point, Monrovia',
      countyId: counties['Montserrado'],
      yearsOfExperience: 5,
      staffCapacity: 10,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      workflowStatus: WorkflowStatus.VERIFIED,
      createdById: createdUsers['sba.admin@sba.gov.lr'],
    },
    {
      providerName: 'Rural Business Consultants Network',
      providerType: BDSPType.CONSULTANT,
      registrationStatus: FormalityStatus.REGISTERED,
      servicesOffered: ['Business Planning', 'Grant Writing', 'Market Linkage', 'Agricultural Advisory'],
      countiesServed: ['Nimba', 'Bong', 'Lofa', 'Grand Gedeh', 'Sinoe'],
      contactPerson: 'Francis Yarkeh',
      phone: '+231880100004',
      email: 'rbcn@email.lr',
      countyId: counties['Nimba'],
      yearsOfExperience: 15,
      staffCapacity: 8,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      workflowStatus: WorkflowStatus.APPROVED,
      createdById: createdUsers['sba.admin@sba.gov.lr'],
    },
    {
      providerName: 'Women Entrepreneurs Support NGO',
      providerType: BDSPType.NGO,
      registrationStatus: FormalityStatus.REGISTERED,
      servicesOffered: ['Women Business Training', 'Savings Groups', 'Legal Support', 'Market Access'],
      countiesServed: ['Montserrado', 'Margibi', 'Grand Bassa', 'Bomi'],
      contactPerson: 'Christine Mulbah',
      phone: '+231770100005',
      email: 'info@wesn.lr',
      physicalAddress: 'Old Road, Monrovia',
      countyId: counties['Montserrado'],
      yearsOfExperience: 10,
      staffCapacity: 18,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      workflowStatus: WorkflowStatus.APPROVED,
      createdById: createdUsers['sba.admin@sba.gov.lr'],
    },
  ];

  for (const bdsp of sampleBDSPs) {
    await prisma.bDSP.create({ data: bdsp as any });
  }

  // ─────────────────────────────────────────
  // SAMPLE OPPORTUNITIES
  // ─────────────────────────────────────────
  console.log('Creating sample opportunities...');
  await prisma.opportunity.createMany({
    data: [
      {
        title: 'YEIB Youth Entrepreneurship Grant Round 1',
        description: 'Grants available to youth-led MSMEs across all 15 counties under the PAYEI program.',
        type: OpportunityType.GRANT,
        status: OpportunityStatus.OPEN,
        amount: 5000,
        currency: 'USD',
        providedBy: 'SBA / AfDB YEIB Program',
        contactEmail: 'yeib@sba.gov.lr',
        requirements: 'Must be youth-led (owner under 35), registered MSME, operating for at least 6 months.',
        createdById: createdUsers['sba.admin@sba.gov.lr'],
      },
      {
        title: 'Women Agri-Business Scale-Up Financing',
        description: 'Concessional loans for women-led agricultural MSMEs to scale production.',
        type: OpportunityType.FINANCING,
        status: OpportunityStatus.OPEN,
        countyId: counties['Bong'],
        amount: 15000,
        currency: 'USD',
        providedBy: 'Liberia Enterprise Development Finance',
        contactEmail: 'agri@ledf.lr',
        requirements: 'Women-led, agricultural sector, minimum 5 employees.',
        createdById: createdUsers['sba.admin@sba.gov.lr'],
      },
      {
        title: 'Digital Skills Training for MSMEs',
        description: 'Free 3-week digital literacy and e-commerce training program.',
        type: OpportunityType.TRAINING,
        status: OpportunityStatus.OPEN,
        countyId: counties['Montserrado'],
        providedBy: 'MSME Training Academy Liberia',
        contactEmail: 'training@msme-academy.lr',
        requirements: 'Registered MSME, owner or manager must attend, smartphone required.',
        createdById: createdUsers['sba.admin@sba.gov.lr'],
      },
    ],
  });

  // ─────────────────────────────────────────
  // SYSTEM SETTINGS
  // ─────────────────────────────────────────
  console.log('Creating system settings...');
  const settings = [
    { key: 'site_name', value: 'SBA MSMEs Online Database and Reporting Portal', type: 'string', category: 'general', label: 'Site Name' },
    { key: 'site_description', value: 'National MSME and BDSP Database for Liberia', type: 'string', category: 'general', label: 'Site Description' },
    { key: 'ministry_name', value: 'Ministry of Commerce and Industry', type: 'string', category: 'general', label: 'Ministry Name' },
    { key: 'sba_contact_email', value: 'info@sba.gov.lr', type: 'string', category: 'general', label: 'SBA Contact Email' },
    { key: 'max_file_size_mb', value: '10', type: 'number', category: 'upload', label: 'Max File Size (MB)' },
    { key: 'allowed_file_types', value: 'pdf,jpg,jpeg,png,xlsx,csv,docx', type: 'string', category: 'upload', label: 'Allowed File Types' },
    { key: 'msme_micro_max_employees', value: '5', type: 'number', category: 'msme', label: 'Micro MSME Max Employees' },
    { key: 'msme_small_max_employees', value: '50', type: 'number', category: 'msme', label: 'Small MSME Max Employees' },
    { key: 'msme_medium_max_employees', value: '200', type: 'number', category: 'msme', label: 'Medium MSME Max Employees' },
    { key: 'payei_program_active', value: 'true', type: 'boolean', category: 'program', label: 'PAYEI Program Active' },
    { key: 'yeib_program_active', value: 'true', type: 'boolean', category: 'program', label: 'YEIB Program Active' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  // ─────────────────────────────────────────
  // SAMPLE NOTIFICATIONS
  // ─────────────────────────────────────────
  console.log('Creating sample notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: createdUsers['sba.admin@sba.gov.lr'],
        type: NotificationType.RECORD_SUBMITTED,
        title: 'New MSME Record Submitted',
        message: 'Lofa Timber & Wood Works has been submitted for review.',
        entityType: 'MSME',
      },
      {
        userId: createdUsers['supervisor@sba.gov.lr'],
        type: NotificationType.RECORD_ASSIGNED,
        title: 'Record Assigned for Review',
        message: 'Margibi Youth Tailoring Center has been assigned to you for review.',
        entityType: 'MSME',
      },
      {
        userId: createdUsers['data.officer@sba.gov.lr'],
        type: NotificationType.RECORD_APPROVED,
        title: 'MSME Record Approved',
        message: 'Monrovia Fresh Produce Market has been approved.',
        entityType: 'MSME',
      },
    ],
  });

  console.log('✅ Database seed completed successfully!');
  console.log('\n📋 Default Login Credentials (Password for all: ChangeMe123!):');
  console.log('  admin@sba.gov.lr          → Super Administrator');
  console.log('  sba.admin@sba.gov.lr      → SBA Administrator');
  console.log('  supervisor@sba.gov.lr     → County Supervisor (Montserrado)');
  console.log('  data.officer@sba.gov.lr   → Data Entry Officer');
  console.log('  inspector@sba.gov.lr      → Field Inspector');
  console.log('  analyst@sba.gov.lr        → Data Analyst');
  console.log('  partner@sba.gov.lr        → Development Partner Viewer');
  console.log('  finance.viewer@sba.gov.lr → Financial Institution Viewer');
  console.log('  owner@sba.gov.lr          → MSME Owner');
  console.log('  auditor@sba.gov.lr        → Internal Auditor');
  console.log('\n⚠️  IMPORTANT: Change all passwords before production deployment!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
