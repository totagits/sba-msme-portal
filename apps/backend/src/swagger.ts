import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SBA MSMEs Online Database and Reporting Portal API',
      version: '1.0.0',
      description: `
REST API for Liberia's National MSME and BDSP Online Database and Reporting Portal.

**Bureau of Small Business Administration (SBA)**
Ministry of Commerce and Industry, Republic of Liberia

Built under the Program for Advancing Youth Entrepreneurship and Investment (PAYEI),
Sub-Project A: Liberian Youth Entrepreneurship and Investment Bank (YEIB).

## Authentication
Use Bearer token authentication. Obtain tokens from \`/api/auth/login\`.

\`\`\`
Authorization: Bearer <access_token>
\`\`\`
      `,
      contact: {
        name: 'SBA IT Department',
        email: 'it@sba.gov.lr',
      },
      license: {
        name: 'Government of Liberia',
      },
    },
    servers: [
      { url: `http://localhost:${config.port}`, description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication and session management' },
      { name: 'Users', description: 'User management and profiles' },
      { name: 'MSMEs', description: 'MSME registry operations' },
      { name: 'BDSPs', description: 'BDSP registry operations' },
      { name: 'Products', description: 'MSME product/service catalog' },
      { name: 'Opportunities', description: 'Business opportunities management' },
      { name: 'Verifications', description: 'Verification visits and workflow' },
      { name: 'Reports', description: 'Report generation and history' },
      { name: 'Analytics', description: 'Dashboard analytics and metrics' },
      { name: 'Imports', description: 'Data import and deduplication' },
      { name: 'Files', description: 'File upload and management' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Audit Logs', description: 'System audit trail' },
      { name: 'Settings', description: 'System configuration and master data' },
      { name: 'Sync', description: 'Offline data synchronization' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
