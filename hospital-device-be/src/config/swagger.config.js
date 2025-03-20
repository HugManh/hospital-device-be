const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'JWT Auth API',
            version: '1.0.0',
            description: 'A Node.js API with JWT authentication and MongoDB',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
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
    apis: ['./src/routes/*.js'], // Đường dẫn đến các file chứa comment JSDoc
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;