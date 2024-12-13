import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import audioAnalyzer from '../services/audioAnalyzer.js'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const getAllBeats = async (db) => {
    return await db.all('SELECT * FROM beats')
}

export const getBeatById = async (db, id) => {
    const beat = await db.get('SELECT * FROM beats WHERE id = ?', id)
    if (!beat) throw new Error('Beat not found')
    return beat
}

export const createBeat = async (
    db,
    file,
    { key, bpm, lyrics_id, categorie_id }
) => {
    const relativePath = path.relative(path.join(__dirname, '../..'), file.path)

    // Analyser le BPM si non fourni
    let finalBpm = bpm
    if (!finalBpm) {
        const analysis = await audioAnalyzer.analyzeBPM(file.path)
        finalBpm = analysis.bpm
    }

    const result = await db.run(
        'INSERT INTO beats (path, key, bpm, lyrics_id, categorie_id) VALUES (?, ?, ?, ?, ?)',
        [relativePath, key || 'C', finalBpm, lyrics_id, categorie_id]
    )
    return {
        id: result.lastID,
        bpm: finalBpm,
        key: key || 'C',
    }
}

export const updateBeat = async (
    db,
    id,
    { key, bpm, lyrics_id, categorie_id }
) => {
    await db.run(
        'UPDATE beats SET key = ?, bpm = ?, lyrics_id = ?, categorie_id = ? WHERE id = ?',
        [key, bpm, lyrics_id, categorie_id, id]
    )
}

export const deleteBeat = async (db, id) => {
    // Récupérer le chemin du fichier avant la suppression
    const beat = await db.get('SELECT path FROM beats WHERE id = ?', id)
    if (!beat) {
        throw new Error('Beat not found')
    }

    // Supprimer le fichier
    await fs.unlink(beat.path)

    // Supprimer l'enregistrement de la base de données
    await db.run('DELETE FROM beats WHERE id = ?', id)
}

export const analyzeBeatFromYoutube = async (db, { url, categorie_id }) => {
    try {
        const { filePath, key, bpm } = await audioAnalyzer.analyzeYouTubeVideo(
            url
        )
        const relativePath = path.relative(
            path.join(__dirname, '../..'),
            filePath
        )

        const result = await db.run(
            'INSERT INTO beats (path, key, bpm, categorie_id) VALUES (?, ?, ?, ?)',
            [relativePath, key, bpm, categorie_id]
        )

        return {
            id: result.lastID,
            key,
            bpm,
            path: relativePath,
        }
    } catch (error) {
        throw new Error(`Failed to analyze YouTube video: ${error.message}`)
    }
}
