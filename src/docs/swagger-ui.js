const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');

const swaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Hospital Device Management API Documentation',
    customfavIcon: '/favicon.ico',
};

module.exports = (app) => {
    // Swagger UI
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(specs, swaggerUiOptions)
    );

    // Serve Swagger JSON
    app.get('/swagger.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
};
