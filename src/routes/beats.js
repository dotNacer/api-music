import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import {
    getAllBeats,
    getBeatById,
    createBeat,
    updateBeat,
    deleteBeat,
    analyzeBeatFromYoutube,
} from '../controllers/beatController.js'
import { unlink } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads/beats'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    },
})

const upload = multer({ storage })

/**
 * @swagger
 * components:
 *   schemas:
 *     Beat:
 *       type: object
 *       required:
 *         - path
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré du beat
 *         path:
 *           type: string
 *           description: Chemin du fichier audio
 *         key:
 *           type: string
 *           description: Tonalité du morceau
 *         bpm:
 *           type: integer
 *           description: Tempo du morceau
 *         lyrics_id:
 *           type: integer
 *           description: ID des paroles associées
 *         categorie_id:
 *           type: integer
 *           description: ID de la catégorie
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date de création
 */

/**
 * @swagger
 * /api/beats:
 *   get:
 *     summary: Récupère tous les beats
 *     tags: [Beats]
 *     responses:
 *       200:
 *         description: Liste des beats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Beat'
 */
router.get('/', async (req, res) => {
    try {
        const beats = await getAllBeats(req.app.locals.db)
        res.json(beats)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/beats/{id}:
 *   get:
 *     summary: Récupère un beat par son ID
 *     tags: [Beats]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du beat
 *     responses:
 *       200:
 *         description: Beat trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Beat'
 *       404:
 *         description: Beat non trouvé
 */
router.get('/:id', async (req, res) => {
    try {
        const beat = await getBeatById(req.app.locals.db, req.params.id)
        res.json(beat)
    } catch (error) {
        if (error.message === 'Beat not found') {
            res.status(404).json({ error: error.message })
        } else {
            res.status(500).json({ error: error.message })
        }
    }
})

/**
 * @swagger
 * /api/beats:
 *   post:
 *     summary: Crée un nouveau beat
 *     tags: [Beats]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               key:
 *                 type: string
 *               bpm:
 *                 type: integer
 *               lyrics_id:
 *                 type: integer
 *               categorie_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Beat créé avec succès
 */
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const result = await createBeat(req.app.locals.db, req.file, req.body)
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/beats/{id}:
 *   put:
 *     summary: Met à jour un beat
 *     tags: [Beats]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du beat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               bpm:
 *                 type: integer
 *               lyrics_id:
 *                 type: integer
 *               categorie_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Beat mis à jour avec succès
 */
router.put('/:id', async (req, res) => {
    try {
        await updateBeat(req.app.locals.db, req.params.id, req.body)
        res.json({ message: 'Beat updated successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/beats/{id}:
 *   delete:
 *     summary: Supprime un beat
 *     tags: [Beats]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du beat
 *     responses:
 *       200:
 *         description: Beat supprimé avec succès
 */
router.delete('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        // 1. Récupérer le beat
        const beat = await db.get(
            'SELECT path FROM beats WHERE id = ?',
            req.params.id
        )
        if (!beat) {
            return res.status(404).json({ error: 'Beat not found' })
        }

        // 2. Supprimer les projets associés
        await db.run('DELETE FROM projects WHERE beat_id = ?', req.params.id)

        // 3. Supprimer le fichier du beat
        try {
            await unlink(beat.path)
        } catch (err) {
            console.error('Erreur lors de la suppression du fichier:', err)
            // Continue même si le fichier n'existe pas
        }

        // 4. Supprimer le beat de la base de données
        await db.run('DELETE FROM beats WHERE id = ?', req.params.id)

        res.json({ message: 'Beat et dépendances supprimés avec succès' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/beats/youtube:
 *   post:
 *     summary: Télécharge et analyse une vidéo YouTube
 *     tags: [Beats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL de la vidéo YouTube
 *               lyrics_id:
 *                 type: integer
 *               categorie_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Beat créé avec succès
 *       400:
 *         description: URL invalide
 */
router.post('/youtube', async (req, res) => {
    try {
        const result = await analyzeBeatFromYoutube(req.app.locals.db, req.body)
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/beats/analyze/{id}:
 *   post:
 *     summary: Analyse un beat existant pour détecter BPM et tonalité
 *     tags: [Beats]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du beat à analyser
 *     responses:
 *       200:
 *         description: Analyse réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bpm:
 *                   type: integer
 *                 key:
 *                   type: string
 */
router.post('/analyze/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        const beat = await db.get(
            'SELECT path FROM beats WHERE id = ?',
            req.params.id
        )
        if (!beat) {
            return res.status(404).json({ error: 'Beat not found' })
        }

        const { bpm, key } = await audioAnalyzer.analyzeBPM(beat.path)

        await db.run('UPDATE beats SET bpm = ?, key = ? WHERE id = ?', [
            bpm,
            key,
            req.params.id,
        ])

        res.json({ bpm, key })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
