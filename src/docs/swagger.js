const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hospital Device Management API',
            version: '1.0.0',
            description:
                'API documentation for Hospital Device Management System',
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:8000',
                description: 'Development server',
            },
            {
                url: process.env.STAGING_API || 'http://localhost:8000',
                description: 'Staging server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/docs/routes/*.yaml'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
