const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getDb, saveDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

function findUserDir(userId) {
  const usersDir = path.join(__dirname, '..', 'Пользователи');
  if (!fs.existsSync(usersDir)) return null;

  const items = fs.readdirSync(usersDir);
  for (const item of items) {
    const itemPath = path.join(usersDir, item);
    if (!fs.statSync(itemPath).isDirectory()) continue;
    const parts = item.split('_');
    const idStr = parts[parts.length - 1];
    if (idStr === String(userId)) {
      return itemPath;
    }
  }
  return null;
}

function updateProfileInFile(userDir, field, value) {
  const profilePath = path.join(userDir, 'profile.txt');
  if (!fs.existsSync(profilePath)) return;
  let content = fs.readFileSync(profilePath, 'utf8');
  const lines = content.split('\n');
  const updated = lines.map(line => {
    if (line.startsWith(field + ': ')) {
      return field + ': ' + value;
    }
    return line;
  });
  fs.writeFileSync(profilePath, updated.join('\n'), 'utf8');
}

function appendChangeLog(userDir, message) {
  const now = new Date().toISOString();
  fs.appendFileSync(path.join(userDir, 'changes.log'), '[' + now + '] ' + message + '\n', 'utf8');
}

router.get('/', authMiddleware, async (req, res) => {
  const db = await getDb();

  const users = db.exec('SELECT id, email, name, phone, photo, role FROM users WHERE id = ?', [req.user.id]);
  if (users.length === 0) return res.redirect('/login');
  const row = users[0].values[0];
  const userData = {
    id: row[0], email: row[1], name: row[2],
    phone: row[3], photo: row[4], role: row[5]
  };

  const paid = db.exec(
    'SELECT id FROM paid_students WHERE student_id = ?',
    [req.user.id]
  );
  const isPaid = paid.length > 0 && paid[0].values.length > 0;

  let homework = [];
  if (isPaid) {
    const hw = db.exec(
      'SELECT id, title, description, status, grade, created_at FROM homework WHERE student_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    if (hw.length > 0) {
      homework = hw[0].values.map(row => ({
        id: row[0], title: row[1], description: row[2],
        status: row[3], grade: row[4], created_at: row[5]
      }));
    }
  }

  const msgs = db.exec(
    `SELECT m.id, m.sender_id, m.content, m.file_path, m.created_at, m.is_read, u.name as sender_name
     FROM messages m JOIN users u ON m.sender_id = u.id
     WHERE m.receiver_id = ? OR m.sender_id = ?
     ORDER BY m.created_at DESC LIMIT 50`,
    [req.user.id, req.user.id]
  );
  const messages = msgs.length > 0 ? msgs[0].values.map(row => ({
    id: row[0], sender_id: row[1], content: row[2],
    file_path: row[3], created_at: row[4], is_read: row[5], sender_name: row[6]
  })) : [];

  let videos = [];
  if (isPaid) {
    const vids = db.exec(
      'SELECT id, title, video_url, description, created_at FROM video_lessons WHERE student_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    if (vids.length > 0) {
      videos = vids[0].values.map(row => ({
        id: row[0], title: row[1], video_url: row[2],
        description: row[3], created_at: row[4]
      }));
    }
  }

  const teachers = db.exec('SELECT id, name, email, phone FROM users WHERE role = ? LIMIT 1', ['teacher']);
  const teacher = teachers.length > 0 && teachers[0].values.length > 0 ? {
    id: teachers[0].values[0][0], name: teachers[0].values[0][1],
    email: teachers[0].values[0][2], phone: teachers[0].values[0][3]
  } : null;

  res.render('cabinet', {
    title: 'Личный кабинет',
    userData,
    isPaid,
    homework,
    messages,
    videos,
    teacher
  });
});

router.post('/update-profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const db = await getDb();

    const oldRows = db.exec('SELECT name, phone FROM users WHERE id = ?', [req.user.id]);
    const oldData = oldRows.length > 0 && oldRows[0].values.length > 0
      ? { name: oldRows[0].values[0][0], phone: oldRows[0].values[0][1] }
      : { name: '', phone: '' };

    db.run(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name, phone, req.user.id]
    );
    saveDb();

    let userDir = findUserDir(req.user.id);
    if (!userDir) {
      const usersRootDir = path.join(__dirname, '..', 'Пользователи');
      if (!fs.existsSync(usersRootDir)) fs.mkdirSync(usersRootDir, { recursive: true });
      const safeName = name.replace(/[<>:"\\\/|?*]/g, '_').trim();
      userDir = path.join(usersRootDir, safeName + '_' + req.user.id);
      fs.mkdirSync(userDir, { recursive: true });
      const now = new Date().toISOString();
      const profileContent = [
        'ID: ' + req.user.id,
        'ФИО: ' + name,
        'Телефон: ' + (phone || ''),
        'Почта: ' + req.user.email,
        'Пароль: ',
        'Фото профиля: ',
        'Роль: ' + req.user.role,
        'Дата регистрации: ' + now
      ].join('\n') + '\n';
      fs.writeFileSync(path.join(userDir, 'profile.txt'), profileContent, 'utf8');
      fs.writeFileSync(path.join(userDir, 'changes.log'), '[' + now + '] Создание папки пользователя\n', 'utf8');
    }

    const changes = [];
    if (oldData.name !== name) {
      changes.push('ФИО: ' + oldData.name + ' -> ' + name);
      updateProfileInFile(userDir, 'ФИО', name);

      const usersRootDir = path.join(__dirname, '..', 'Пользователи');
      const safeName = name.replace(/[<>:"\\\/|?*]/g, '_').trim();
      const newDirName = safeName + '_' + req.user.id;
      const newDirPath = path.join(usersRootDir, newDirName);
      if (newDirPath !== userDir) {
        fs.renameSync(userDir, newDirPath);
        userDir = newDirPath;
      }
    }
    if (oldData.phone !== phone) {
      changes.push('Телефон: ' + (oldData.phone || '(не указан)') + ' -> ' + (phone || '(не указан)'));
      updateProfileInFile(userDir, 'Телефон', phone || '');
    }

    if (changes.length > 0) {
      appendChangeLog(userDir, 'Изменение профиля: ' + changes.join('; '));
    }

    res.redirect('/cabinet');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.redirect('/cabinet');
  }
});

router.post('/send-message', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();

    const paid = db.exec('SELECT id FROM paid_students WHERE student_id = ?', [req.user.id]);
    const isPaid = paid.length > 0 && paid[0].values.length > 0;
    if (!isPaid) {
      return res.redirect('/cabinet');
    }

    const { content } = req.body;

    const teachers = db.exec('SELECT id FROM users WHERE role = ? LIMIT 1', ['teacher']);
    if (teachers.length === 0 || teachers[0].values.length === 0) {
      return res.redirect('/cabinet');
    }
    const teacherId = teachers[0].values[0][0];

    db.run(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, teacherId, content || '']
    );
    saveDb();
    res.redirect('/cabinet');
  } catch (err) {
    console.error(err);
    res.redirect('/cabinet');
  }
});

router.post('/upload-photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const db = await getDb();

    let photoPath = '';
    if (req.file) {
      photoPath = '/uploads/images/' + req.file.filename;
    }

    db.run(
      'UPDATE users SET photo = ? WHERE id = ?',
      [photoPath, req.user.id]
    );
    saveDb();

    const userDir = findUserDir(req.user.id);
    if (userDir) {
      updateProfileInFile(userDir, 'Фото профиля', photoPath);
      appendChangeLog(userDir, 'Загружено фото профиля: ' + photoPath);
    }

    res.redirect('/cabinet');
  } catch (err) {
    console.error(err);
    res.redirect('/cabinet');
  }
});

router.post('/submit-homework/:id', authMiddleware, upload.single('solution'), async (req, res) => {
  try {
    const db = await getDb();

    let filePath = '';
    if (req.file) {
      filePath = '/uploads/homework/' + req.file.filename;
    }

    db.run(
      'UPDATE homework SET solution_file_path = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND student_id = ?',
      [filePath, 'submitted', req.params.id, req.user.id]
    );
    saveDb();
    res.redirect('/cabinet');
  } catch (err) {
    console.error(err);
    res.redirect('/cabinet');
  }
});

module.exports = router;
