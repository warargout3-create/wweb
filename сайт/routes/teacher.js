const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../database');
const { authMiddleware, teacherOnly } = require('../middleware/auth');
const { sanitizeHtml } = require('../middleware/sanitize');
const upload = require('../middleware/upload');

// Teacher dashboard
router.get('/', authMiddleware, teacherOnly, async (req, res) => {
  const db = await getDb();

  // Get all students
  const students = db.exec(
    'SELECT id, email, name, phone, photo FROM users WHERE role = ? ORDER BY name',
    ['student']
  );
  const studentList = students.length > 0 ? students[0].values.map(row => ({
    id: row[0], email: row[1], name: row[2], phone: row[3], photo: row[4]
  })) : [];

  // Get paid students
  const paid = db.exec('SELECT student_id FROM paid_students');
  const paidIds = paid.length > 0 ? paid[0].values.map(row => row[0]) : [];

  // Mark students as paid
  const studentListWithPayment = studentList.map(s => ({
    ...s,
    isPaid: paidIds.includes(s.id)
  }));

  // Get all articles
  const articles = db.exec(
    'SELECT id, title, subject, created_at FROM articles ORDER BY created_at DESC'
  );
  const articleList = articles.length > 0 ? articles[0].values.map(row => ({
    id: row[0], title: row[1], subject: row[2], created_at: row[3]
  })) : [];

  // Get all homework
  const hw = db.exec(
    `SELECT h.id, h.title, h.description, h.status, h.grade, h.created_at, u.name as student_name, h.student_id, h.task_file_path, h.solution_file_path, h.teacher_comment
     FROM homework h JOIN users u ON h.student_id = u.id
     ORDER BY h.created_at DESC`
  );
  const homeworkList = hw.length > 0 ? hw[0].values.map(row => ({
    id: row[0], title: row[1], description: row[2],
    status: row[3], grade: row[4], created_at: row[5],
    student_name: row[6], student_id: row[7],
    task_file_path: row[8], solution_file_path: row[9],
    teacher_comment: row[10]
  })) : [];

  // Get messages
  const msgs = db.exec(
    `SELECT m.id, m.sender_id, m.content, m.file_path, m.created_at, m.is_read, u.name as sender_name, u.id as sender_id
     FROM messages m JOIN users u ON m.sender_id = u.id
     ORDER BY m.created_at DESC LIMIT 100`
  );
  const messages = msgs.length > 0 ? msgs[0].values.map(row => ({
    id: row[0], sender_id: row[1], content: row[2],
    file_path: row[3], created_at: row[4], is_read: row[5],
    sender_name: row[6], sender_id_num: row[7]
  })) : [];

  // Get videos
  const vids = db.exec(
    `SELECT v.id, v.title, v.video_url, v.description, v.created_at, u.name as student_name
     FROM video_lessons v JOIN users u ON v.student_id = u.id
     ORDER BY v.created_at DESC`
  );
  const videoList = vids.length > 0 ? vids[0].values.map(row => ({
    id: row[0], title: row[1], video_url: row[2],
    description: row[3], created_at: row[4], student_name: row[5]
  })) : [];

  res.render('teacher', {
    title: 'Панель преподавателя',
    students: studentListWithPayment,
    articles: articleList,
    homework: homeworkList,
    messages,
    videos: videoList
  });
});

// Toggle paid status
router.post('/toggle-paid', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const { student_id } = req.body;
    const db = await getDb();

    const exists = db.exec(
      'SELECT id FROM paid_students WHERE student_id = ?',
      [student_id]
    );

    if (exists.length > 0 && exists[0].values.length > 0) {
      db.run('DELETE FROM paid_students WHERE student_id = ?', [student_id]);
    } else {
      db.run(
        'INSERT INTO paid_students (student_id, teacher_id) VALUES (?, ?)',
        [student_id, req.user.id]
      );
    }
    saveDb();
    res.redirect('/teacher');
  } catch (err) {
    console.error(err);
    res.redirect('/teacher');
  }
});

// Create article
router.post('/create-article', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const { title, content, subject } = req.body;
    const db = await getDb();
    const sanitizedContent = sanitizeHtml(content);
    db.run(
      'INSERT INTO articles (title, content, subject, author_id) VALUES (?, ?, ?, ?)',
      [title, sanitizedContent, subject, req.user.id]
    );
    saveDb();
    res.redirect('/teacher');
  } catch (err) {
    console.error(err);
    res.redirect('/teacher');
  }
});

// Delete article
router.post('/delete-article/:id', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM articles WHERE id = ?', [req.params.id]);
    saveDb();
    res.redirect('/teacher');
  } catch (err) {
    console.error(err);
    res.redirect('/teacher');
  }
});

// Create homework
router.post('/create-homework', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const { student_id, title, description } = req.body;
    const db = await getDb();
    db.run(
      'INSERT INTO homework (teacher_id, student_id, title, description) VALUES (?, ?, ?, ?)',
      [req.user.id, student_id, title, description || '']
    );
    saveDb();
    res.redirect('/teacher');
  } catch (err) {
    console.error(err);
    res.redirect('/teacher');
  }
});

// Check homework (add grade and comment)
router.post('/check-homework/:id', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const { grade, teacher_comment } = req.body;
    const db = await getDb();
    db.run(
      'UPDATE homework SET grade = ?, teacher_comment = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [grade, teacher_comment || '', 'checked', req.params.id]
    );
    saveDb();
    res.redirect('/teacher');
  } catch (err) {
    console.error(err);
    res.redirect('/teacher');
  }
});

// Send message as teacher
router.post('/send-message', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const { content, student_id } = req.body;
    const db = await getDb();
    db.run(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, student_id, content || '']
    );
    saveDb();
    res.redirect('/teacher');
  } catch (err) {
    console.error(err);
    res.redirect('/teacher');
  }
});

// Add video lesson (file upload)
router.post('/add-video', authMiddleware, teacherOnly, upload.single('video'), async (req, res) => {
  try {
    const { student_id, title, description } = req.body;
    const db = await getDb();

    let videoPath = '';
    if (req.file) {
      videoPath = '/uploads/videos/' + req.file.filename;
    }

    db.run(
      'INSERT INTO video_lessons (teacher_id, student_id, title, video_url, description) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, student_id, title, videoPath, description || '']
    );
    saveDb();
    res.redirect('/teacher');
  } catch (err) {
    console.error(err);
    res.redirect('/teacher');
  }
});

// Delete video
router.post('/delete-video/:id', authMiddleware, teacherOnly, async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM video_lessons WHERE id = ?', [req.params.id]);
    saveDb();
    res.redirect('/teacher');
  } catch (err) {
    console.error(err);
    res.redirect('/teacher');
  }
});

module.exports = router;
