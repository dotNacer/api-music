export const getAllCategories = async (db) => {
    return await db.all('SELECT * FROM categories')
}

export const getCategoryById = async (db, id) => {
    const category = await db.get('SELECT * FROM categories WHERE id = ?', id)
    if (!category) throw new Error('Category not found')
    return category
}

export const createCategory = async (db, { name }) => {
    const result = await db.run('INSERT INTO categories (name) VALUES (?)', [
        name,
    ])
    return { id: result.lastID }
}

export const updateCategory = async (db, id, { name }) => {
    await db.run('UPDATE categories SET name = ? WHERE id = ?', [name, id])
}

export const deleteCategory = async (db, id) => {
    await db.run('DELETE FROM categories WHERE id = ?', id)
}
