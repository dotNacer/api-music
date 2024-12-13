import express from 'express'
import { unlink } from 'fs/promises'
const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré de la catégorie
 *         name:
 *           type: string
 *           description: Nom de la catégorie
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Récupère toutes les catégories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Liste des catégories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/', async (req, res) => {
    const db = req.app.locals.db
    try {
        const categories = await db.all('SELECT * FROM categories')
        res.json(categories)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Récupère une catégorie par son ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Catégorie non trouvée
 */
router.get('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        const category = await db.get(
            'SELECT * FROM categories WHERE id = ?',
            req.params.id
        )
        if (!category)
            return res.status(404).json({ error: 'Category not found' })
        res.json(category)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crée une nouvelle catégorie
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 25
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *       400:
 *         description: Nom de catégorie invalide ou déjà existant
 */
router.post('/', async (req, res) => {
    const db = req.app.locals.db
    const { name } = req.body

    try {
        const result = await db.run(
            'INSERT INTO categories (name) VALUES (?)',
            [name]
        )
        res.status(201).json({ id: result.lastID })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Met à jour une catégorie
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 25
 *     responses:
 *       200:
 *         description: Catégorie mise à jour avec succès
 *       404:
 *         description: Catégorie non trouvée
 */
router.put('/:id', async (req, res) => {
    const db = req.app.locals.db
    const { name } = req.body

    try {
        await db.run('UPDATE categories SET name = ? WHERE id = ?', [
            name,
            req.params.id,
        ])
        res.json({ message: 'Category updated successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Supprime une catégorie
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie supprimée avec succès
 *       404:
 *         description: Catégorie non trouvée
 */
router.delete('/:id', async (req, res) => {
    const db = req.app.locals.db
    try {
        const beats = await db.all(
            'SELECT id, path FROM beats WHERE categorie_id = ?',
            req.params.id
        )

        for (const beat of beats) {
            await db.run('DELETE FROM projects WHERE beat_id = ?', beat.id)
            try {
                await unlink(beat.path)
            } catch (err) {
                console.error('Erreur lors de la suppression du fichier:', err)
            }
        }

        await db.run('DELETE FROM beats WHERE categorie_id = ?', req.params.id)

        await db.run('DELETE FROM categories WHERE id = ?', req.params.id)

        res.json({ message: 'Catégorie et dépendances supprimées avec succès' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
