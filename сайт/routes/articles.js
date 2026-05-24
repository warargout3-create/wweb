const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../database');
const { sanitizeHtml } = require('../middleware/sanitize');

// Get all articles (API)
router.get('/api', async (req, res) => {
  const db = await getDb();
  const articles = db.exec(
    'SELECT id, title, subject, created_at FROM articles ORDER BY created_at DESC'
  );
  const list = articles.length > 0 ? articles[0].values.map(row => ({
    id: row[0], title: row[1], subject: row[2], created_at: row[3]
  })) : [];
  res.json(list);
});

// Create article (teacher only, via API)
router.post('/api/create', async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    const { title, content, subject } = req.body;
    if (!title || !content || !subject) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const db = await getDb();
    const sanitizedContent = sanitizeHtml(content);
    db.run(
      'INSERT INTO articles (title, content, subject, author_id) VALUES (?, ?, ?, ?)',
      [title, sanitizedContent, subject, req.user.id]
    );
    saveDb();

    res.json({ success: true });
  } catch (err) {
    console.error('Create article error:', err);
    res.status(500).json({ error: 'Ошибка при создании статьи' });
  }
});

// Update article
router.post('/api/update/:id', async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    const { title, content } = req.body;
    const db = await getDb();
    const sanitizedContent = sanitizeHtml(content);
    db.run(
      'UPDATE articles SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, sanitizedContent, req.params.id]
    );
    saveDb();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении' });
  }
});

// Delete article
router.post('/api/delete/:id', async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    const db = await getDb();
    db.run('DELETE FROM articles WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении' });
  }
});

module.exports = router;
