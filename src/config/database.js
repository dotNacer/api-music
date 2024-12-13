import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const initializeDatabase = async () => {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database,
    })

    await db.exec(`
    CREATE TABLE IF NOT EXISTS lyrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255) NOT NULL,
      lyrics TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(25) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS beats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path VARCHAR(255) NOT NULL,
      key VARCHAR(7),
      bpm INTEGER,
      lyrics_id INTEGER,
      categorie_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lyrics_id) REFERENCES lyrics(id),
      FOREIGN KEY (categorie_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS covers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255) NOT NULL,
      path VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      beat_id INTEGER,
      cover_id INTEGER,
      FOREIGN KEY (beat_id) REFERENCES beats(id),
      FOREIGN KEY (cover_id) REFERENCES covers(id)
    );
  `)

    return db
}

export default initializeDatabase
