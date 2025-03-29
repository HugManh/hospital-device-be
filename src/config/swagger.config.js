const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3000;
const DOMAIN_API = process.env.DOMAIN_API;

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hospital Device API',
            version: '1.0.0',
            description: 'Hospital Device API',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server1',
            },
            {
                url: DOMAIN_API,
                description: 'Development server2',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description:
                        'JWT Access Token sent in Authorization header as Bearer token',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
