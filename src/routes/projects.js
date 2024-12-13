import express from 'express'
const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré du projet
 *         beat_id:
 *           type: integer
 *           description: ID du beat associé
 *         cover_id:
 *           type: integer
 *           description: ID de la cover associée
 *         beat_path:
 *           type: string
 *           description: Chemin du fichier beat
 *         cover_title:
 *           type: string
 *           description: Titre de la cover
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Récupère tous les projets
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Liste des projets avec leurs beats et covers associés
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
router.get('/', async (req, res) => {
    const db = req.app.locals.db
    try {
        const projects = await db.all(`
            SELECT p.*, b.path as beat_path, c.title as cover_title 
            FROM projects p 
            LEFT JOIN beats b ON p.beat_id = b.id 
            LEFT JOIN covers c ON p.cover_id = c.id
        `)
        res.json(projects)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Récupère un projet par son ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du projet
 *     responses:
 *       200:
 *         description: Projet trouvé avec ses beats et covers associés
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Projet non trouvé
 */
router.get('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        const project = await db.get(
            `
            SELECT p.*, b.path as beat_path, c.title as cover_title 
            FROM projects p 
            LEFT JOIN beats b ON p.beat_id = b.id 
            LEFT JOIN covers c ON p.cover_id = c.id 
            WHERE p.id = ?
        `,
            req.params.id
        )
        if (!project)
            return res.status(404).json({ error: 'Project not found' })
        res.json(project)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Crée un nouveau projet
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               beat_id:
 *                 type: integer
 *                 description: ID du beat à associer
 *               cover_id:
 *                 type: integer
 *                 description: ID de la cover à associer
 *     responses:
 *       201:
 *         description: Projet créé avec succès
 *       400:
 *         description: Données invalides
 */
router.post('/', async (req, res) => {
    const db = req.app.locals.db
    const { beat_id, cover_id } = req.body

    try {
        const result = await db.run(
            'INSERT INTO projects (beat_id, cover_id) VALUES (?, ?)',
            [beat_id, cover_id]
        )
        res.status(201).json({ id: result.lastID })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Met à jour un projet
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du projet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               beat_id:
 *                 type: integer
 *                 description: Nouvel ID du beat
 *               cover_id:
 *                 type: integer
 *                 description: Nouvel ID de la cover
 *     responses:
 *       200:
 *         description: Projet mis à jour avec succès
 *       404:
 *         description: Projet non trouvé
 */
router.put('/:id', async (req, res) => {
    const db = req.app.locals.db
    const { beat_id, cover_id } = req.body

    try {
        await db.run(
            'UPDATE projects SET beat_id = ?, cover_id = ? WHERE id = ?',
            [beat_id, cover_id, req.params.id]
        )
        res.json({ message: 'Project updated successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Supprime un projet
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du projet
 *     responses:
 *       200:
 *         description: Projet supprimé avec succès
 *       404:
 *         description: Projet non trouvé
 */
router.delete('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        await db.run('DELETE FROM projects WHERE id = ?', req.params.id)
        res.json({ message: 'Projet supprimé avec succès' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
