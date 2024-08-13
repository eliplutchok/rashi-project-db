const pool = require('./db');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        hashed_password TEXT NOT NULL,
        name VARCHAR(255),
        privilege_level VARCHAR(50) CHECK (privilege_level IN ('standard', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        session_info TEXT
      );
    `);

    await client.query(`
        CREATE TABLE refresh_tokens (
            id SERIAL PRIMARY KEY,
            token TEXT NOT NULL,
            username TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL
        );
    `);

    await client.query(`
      CREATE TABLE sections (
        section_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE books (
        book_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        section_id INT REFERENCES sections(section_id),
        categories VARCHAR(255)[],  -- Array of categories
        length INT,                 -- Number of pages
        titles JSONB,               -- Array of titles in JSONB format
        description TEXT,           -- Description text
        short_description TEXT,     -- Short description text
        publication_date DATE,      -- Publication date
        number_of_chapters INT,     -- Number of chapters
        chapter_titles JSONB        -- Array of chapter titles in JSONB format
      );
    `);

    await client.query(`
      CREATE TABLE chapters (
        chapter_id SERIAL PRIMARY KEY,
        chapter_number INT NOT NULL,
        book_id INT REFERENCES books(book_id),
        titles JSONB,
        length INT,
        description TEXT,
        start_ref VARCHAR(50),  -- Start reference for the chapter
        end_ref VARCHAR(50)     -- End reference for the chapter
      );
    `);

    await client.query(`
      CREATE TABLE pages (
        page_id SERIAL PRIMARY KEY,
        page_number VARCHAR(10) NOT NULL,
        book_id INT REFERENCES books(book_id),
        chapter_id INT REFERENCES chapters(chapter_id)
      );
    `);

    await client.query(`
      CREATE TABLE passages (
        passage_id SERIAL PRIMARY KEY,
        hebrew_text TEXT NOT NULL,
        passage_number INT,
        page_id INT REFERENCES pages(page_id),
        book_id INT REFERENCES books(book_id)
      );
    `);

    await client.query(`
      CREATE TABLE translations (
        translation_id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        version_name VARCHAR(255),
        status VARCHAR(50) CHECK (status IN ('published', 'proposed', 'rejected', 'approved', 'redacted')),
        user_id INT REFERENCES users(user_id),
        passage_id INT REFERENCES passages(passage_id),
        creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE ratings (
        rating_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        translation_id INT REFERENCES translations(translation_id) ON DELETE CASCADE,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        feedback TEXT,
        creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) CHECK (status IN ('viewed', 'not viewed', 'dismissed')) DEFAULT 'not viewed'
      );
    `);

    await client.query('COMMIT');
    console.log('Tables created successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

createTables().catch((e) => console.error(e.stack));