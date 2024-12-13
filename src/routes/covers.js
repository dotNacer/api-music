import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs/promises'
import { unlink } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads/covers'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    },
})

const upload = multer({ storage })

/**
 * @swagger
 * components:
 *   schemas:
 *     Cover:
 *       type: object
 *       required:
 *         - title
 *         - path
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré de la cover
 *         title:
 *           type: string
 *           description: Titre de la cover
 *         path:
 *           type: string
 *           description: Chemin du fichier audio de la cover
 */

/**
 * @swagger
 * /api/covers:
 *   get:
 *     summary: Récupère toutes les covers
 *     tags: [Covers]
 *     responses:
 *       200:
 *         description: Liste des covers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cover'
 */
router.get('/', async (req, res) => {
    const db = req.app.locals.db
    try {
        const covers = await db.all('SELECT * FROM covers')
        const coversWithUrls = covers.map((cover) => ({
            ...cover,
            imageUrl: `/api/covers/${cover.id}/image`,
        }))
        res.json(coversWithUrls)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/covers/{id}:
 *   get:
 *     summary: Récupère une cover par son ID
 *     tags: [Covers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la cover
 *     responses:
 *       200:
 *         description: Cover trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cover'
 *       404:
 *         description: Cover non trouvée
 */
router.get('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        const cover = await db.get(
            'SELECT * FROM covers WHERE id = ?',
            req.params.id
        )
        if (!cover) return res.status(404).json({ error: 'Cover not found' })
        res.json(cover)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/covers:
 *   post:
 *     summary: Crée une nouvelle cover
 *     tags: [Covers]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - file
 *             properties:
 *               title:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Cover créée avec succès
 */
router.post('/', upload.single('file'), async (req, res) => {
    const db = req.app.locals.db
    const { title } = req.body

    try {
        const result = await db.run(
            'INSERT INTO covers (title, path) VALUES (?, ?)',
            [title, req.file.path]
        )
        res.status(201).json({ id: result.lastID })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/covers/{id}:
 *   put:
 *     summary: Met à jour une cover
 *     tags: [Covers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la cover
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cover mise à jour avec succès
 */
router.put('/:id', async (req, res) => {
    const db = req.app.locals.db
    const { title } = req.body

    try {
        await db.run('UPDATE covers SET title = ? WHERE id = ?', [
            title,
            req.params.id,
        ])
        res.json({ message: 'Cover updated successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/covers/{id}:
 *   delete:
 *     summary: Supprime une cover
 *     tags: [Covers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la cover
 *     responses:
 *       200:
 *         description: Cover supprimée avec succès
 */
router.delete('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        // 1. Récupérer la cover
        const cover = await db.get(
            'SELECT path FROM covers WHERE id = ?',
            req.params.id
        )
        if (!cover) {
            return res.status(404).json({ error: 'Cover not found' })
        }

        // 2. Supprimer les projets associés
        await db.run('DELETE FROM projects WHERE cover_id = ?', req.params.id)

        // 3. Supprimer le fichier de la cover
        try {
            await unlink(cover.path)
        } catch (err) {
            console.error('Erreur lors de la suppression du fichier:', err)
            // Continue même si le fichier n'existe pas
        }

        // 4. Supprimer la cover de la base de données
        await db.run('DELETE FROM covers WHERE id = ?', req.params.id)

        res.json({ message: 'Cover et dépendances supprimées avec succès' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/:id/image', async (req, res) => {
    const db = req.app.locals.db
    try {
        const cover = await db.get(
            'SELECT path FROM covers WHERE id = ?',
            req.params.id
        )
        if (!cover) {
            return res.status(404).json({ error: 'Cover not found' })
        }

        const fileName = path.basename(cover.path)
        const filePath = path.join(__dirname, '../../uploads/covers', fileName)

        res.sendFile(filePath)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
