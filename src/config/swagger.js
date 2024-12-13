import swaggerJsdoc from 'swagger-jsdoc'

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Projet Musical',
            version: '1.0.0',
            description: 'API REST pour la gestion de projets musicaux',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Serveur de développement',
            },
        ],
    },
    apis: ['./src/routes/*.js'],
}

export const specs = swaggerJsdoc(options)
