const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3000;

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
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    // Đổi từ cookieAuth sang bearerAuth
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description:
                        'JWT Access Token sent in Authorization header as Bearer token',
                },
            },
        },
    },
    apis: ['./src/routes/*.js'], // Đường dẫn đến các file chứa Swagger annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
