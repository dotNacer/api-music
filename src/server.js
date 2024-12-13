import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { specs } from './config/swagger.js'
import initializeDatabase from './config/database.js'
import beatsRouter from './routes/beats.js'
import lyricsRouter from './routes/lyrics.js'
import categoriesRouter from './routes/categories.js'
import projectsRouter from './routes/projects.js'
import coversRouter from './routes/covers.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import logger from './middleware/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

app.use(logger)
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))
app.use('/downloads', express.static(path.join(__dirname, '../uploads')))

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// Initialiser la base de données
const db = await initializeDatabase()
app.locals.db = db

// Routes
app.use('/api/beats', beatsRouter)
app.use('/api/lyrics', lyricsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/covers', coversRouter)

app.get('/download/beats/:id', async (req, res) => {
    const db = app.locals.db
    try {
        const beat = await db.get(
            'SELECT path FROM beats WHERE id = ?',
            req.params.id
        )
        if (!beat) {
            return res.status(404).send('Beat non trouvé')
        }

        const filePath = path.join(__dirname, '..', beat.path)
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Fichier non trouvé')
        }

        res.download(filePath, (err) => {
            if (err) {
                console.error('Erreur de téléchargement:', err)
                res.status(500).send('Erreur lors du téléchargement')
            }
        })
    } catch (error) {
        console.error('Erreur:', error)
        res.status(500).send('Erreur serveur')
    }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(
        `Swagger documentation available at http://localhost:${port}/api-docs`
    )
})
