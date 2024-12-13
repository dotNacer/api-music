import express from 'express'
const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Lyrics:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré des paroles
 *         title:
 *           type: string
 *           description: Titre des paroles
 *         lyrics:
 *           type: string
 *           description: Contenu des paroles
 */

/**
 * @swagger
 * /api/lyrics:
 *   get:
 *     summary: Récupère toutes les paroles
 *     tags: [Lyrics]
 *     responses:
 *       200:
 *         description: Liste des paroles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lyrics'
 */
router.get('/', async (req, res) => {
    const db = req.app.locals.db
    try {
        const lyrics = await db.all('SELECT * FROM lyrics')
        res.json(lyrics)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/lyrics/{id}:
 *   get:
 *     summary: Récupère des paroles par leur ID
 *     tags: [Lyrics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID des paroles
 *     responses:
 *       200:
 *         description: Paroles trouvées
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lyrics'
 *       404:
 *         description: Paroles non trouvées
 */
router.get('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        const lyrics = await db.get(
            'SELECT * FROM lyrics WHERE id = ?',
            req.params.id
        )
        if (!lyrics) return res.status(404).json({ error: 'Lyrics not found' })
        res.json(lyrics)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/lyrics:
 *   post:
 *     summary: Crée de nouvelles paroles
 *     tags: [Lyrics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               lyrics:
 *                 type: string
 *     responses:
 *       201:
 *         description: Paroles créées avec succès
 */
router.post('/', async (req, res) => {
    const db = req.app.locals.db
    const { title, lyrics } = req.body

    try {
        const result = await db.run(
            'INSERT INTO lyrics (title, lyrics) VALUES (?, ?)',
            [title, lyrics]
        )
        res.status(201).json({ id: result.lastID })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/lyrics/{id}:
 *   put:
 *     summary: Met à jour des paroles
 *     tags: [Lyrics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID des paroles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               lyrics:
 *                 type: string
 *     responses:
 *       200:
 *         description: Paroles mises à jour avec succès
 */
router.put('/:id', async (req, res) => {
    const db = req.app.locals.db
    const { title, lyrics } = req.body

    try {
        await db.run('UPDATE lyrics SET title = ?, lyrics = ? WHERE id = ?', [
            title,
            lyrics,
            req.params.id,
        ])
        res.json({ message: 'Lyrics updated successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/lyrics/{id}:
 *   delete:
 *     summary: Supprime des paroles
 *     tags: [Lyrics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID des paroles
 *     responses:
 *       200:
 *         description: Paroles supprimées avec succès
 */
router.delete('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        await db.run(
            'UPDATE beats SET lyrics_id = NULL WHERE lyrics_id = ?',
            req.params.id
        )

        await db.run('DELETE FROM lyrics WHERE id = ?', req.params.id)

        res.json({ message: 'Paroles supprimées avec succès' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
