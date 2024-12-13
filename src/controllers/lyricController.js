export const getAllLyrics = async (db) => {
    return await db.all('SELECT * FROM lyrics')
}

export const getLyricById = async (db, id) => {
    const lyric = await db.get('SELECT * FROM lyrics WHERE id = ?', id)
    if (!lyric) throw new Error('Lyric not found')
    return lyric
}

export const createLyric = async (db, { title, lyrics }) => {
    const result = await db.run(
        'INSERT INTO lyrics (title, lyrics) VALUES (?, ?)',
        [title, lyrics]
    )
    return { id: result.lastID }
}

export const updateLyric = async (db, id, { title, lyrics }) => {
    await db.run('UPDATE lyrics SET title = ?, lyrics = ? WHERE id = ?', [
        title,
        lyrics,
        id,
    ])
}

export const deleteLyric = async (db, id) => {
    await db.run('DELETE FROM lyrics WHERE id = ?', id)
}
