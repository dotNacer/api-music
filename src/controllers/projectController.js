export const getAllProjects = async (db) => {
    return await db.all('SELECT * FROM projects')
}

export const getProjectById = async (db, id) => {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', id)
    if (!project) throw new Error('Project not found')
    return project
}

export const createProject = async (db, { beat_id, cover_id }) => {
    const result = await db.run(
        'INSERT INTO projects (beat_id, cover_id) VALUES (?, ?)',
        [beat_id, cover_id]
    )
    return { id: result.lastID }
}

export const updateProject = async (db, id, { beat_id, cover_id }) => {
    await db.run('UPDATE projects SET beat_id = ?, cover_id = ? WHERE id = ?', [
        beat_id,
        cover_id,
        id,
    ])
}

export const deleteProject = async (db, id) => {
    await db.run('DELETE FROM projects WHERE id = ?', id)
}

export const getProjectDetails = async (db, id) => {
    const project = await db.get(
        `
        SELECT 
            p.*,
            b.path as beat_path,
            b.key as beat_key,
            b.bpm as beat_bpm,
            c.title as cover_title,
            c.path as cover_path
        FROM projects p
        LEFT JOIN beats b ON p.beat_id = b.id
        LEFT JOIN covers c ON p.cover_id = c.id
        WHERE p.id = ?
    `,
        id
    )

    if (!project) throw new Error('Project not found')
    return project
}
