import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Healthcare System API',
      version: '1.0.0',
      description: '',
      contact: {
        name: 'API Support',
        email: 'earl'
      }
    },
    servers: [
      {
        url: process.env.BASE_URL,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      BearerAuth: []
    }]
  },
  apis: ['./src/routes/**/*.ts'], 
};

export const swaggerSpec = swaggerJsdoc(options); 