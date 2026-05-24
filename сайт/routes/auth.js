const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { getDb, saveDb } = require('../database');
const { generateToken } = require('../middleware/auth');

router.get('/login', (req, res) => {
  if (req.user) {
    return req.user.role === 'teacher' ? res.redirect('/teacher') : res.redirect('/cabinet');
  }
  res.render('login', { title: 'Вход / Регистрация', error: null });
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.render('login', { title: 'Вход / Регистрация', error: 'Заполните все обязательные поля' });
    }

    if (password.length < 6) {
      return res.render('login', { title: 'Вход / Регистрация', error: 'Пароль должен быть минимум 6 символов' });
    }

    const db = await getDb();

    const existing = db.exec('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.render('login', { title: 'Вход / Регистрация', error: 'Пользователь с таким email уже существует' });
    }

    const role = 'student';
    const hash = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [email, hash, name, phone || '', role]
    );
    saveDb();

    const users = db.exec('SELECT id, email, role, name, phone, photo FROM users WHERE email = ?', [email]);
    const row = users[0].values[0];
    const userId = row[0];

    const now = new Date().toISOString();
    const safeName = name.replace(/[<>:"\\\/|?*]/g, '_').trim();
    const usersRootDir = path.join(__dirname, '..', 'Пользователи');

    if (!fs.existsSync(usersRootDir)) {
      fs.mkdirSync(usersRootDir, { recursive: true });
    }

    const userDirName = `${safeName}_${userId}`;
    const userDir = path.join(usersRootDir, userDirName);
    fs.mkdirSync(userDir, { recursive: true });

    const profileContent = [
      'ID: ' + userId,
      'ФИО: ' + name,
      'Телефон: ' + (phone || ''),
      'Почта: ' + email,
      'Пароль: ' + password,
      'Фото профиля: ',
      'Роль: ' + role,
      'Дата регистрации: ' + now
    ].join('\n') + '\n';

    fs.writeFileSync(path.join(userDir, 'profile.txt'), profileContent, 'utf8');
    fs.writeFileSync(path.join(userDir, 'changes.log'), '[' + now + '] Регистрация пользователя\n', 'utf8');

    const token = generateToken({
      id: row[0],
      email: row[1],
      role: row[2],
      name: row[3]
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.redirect('/cabinet');
  } catch (err) {
    console.error('Register error:', err);
    res.render('login', { title: 'Вход / Регистрация', error: 'Ошибка при регистрации' });
  }
});

function ensureUserFolder(userId, name, email, phone, role) {
  const usersRootDir = path.join(__dirname, '..', 'Пользователи');
  if (!fs.existsSync(usersRootDir)) {
    fs.mkdirSync(usersRootDir, { recursive: true });
  }

  const safeName = name.replace(/[<>:"\\\/|?*]/g, '_').trim();
  const userDirName = safeName + '_' + userId;
  const userDir = path.join(usersRootDir, userDirName);

  if (fs.existsSync(userDir)) return userDir;

  fs.mkdirSync(userDir, { recursive: true });
  const now = new Date().toISOString();
  const profileContent = [
    'ID: ' + userId,
    'ФИО: ' + name,
    'Телефон: ' + (phone || ''),
    'Почта: ' + email,
    'Пароль: ',
    'Фото профиля: ',
    'Роль: ' + role,
    'Дата регистрации: ' + now
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(userDir, 'profile.txt'), profileContent, 'utf8');
  fs.writeFileSync(path.join(userDir, 'changes.log'), '[' + now + '] Автоматическое создание папки при входе\n', 'utf8');
  return userDir;
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('login', { title: 'Вход / Регистрация', error: 'Введите email и пароль' });
    }

    const db = await getDb();
    const users = db.exec('SELECT id, email, password_hash, role, name, phone FROM users WHERE email = ?', [email]);

    if (users.length === 0 || users[0].values.length === 0) {
      return res.render('login', { title: 'Вход / Регистрация', error: 'Неверный email или пароль' });
    }

    const row = users[0].values[0];
    const valid = await bcrypt.compare(password, row[2]);

    if (!valid) {
      return res.render('login', { title: 'Вход / Регистрация', error: 'Неверный email или пароль' });
    }

    ensureUserFolder(row[0], row[4], row[1], row[5] || '', row[3]);

    const token = generateToken({
      id: row[0],
      email: row[1],
      role: row[3],
      name: row[4]
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    if (row[3] === 'teacher') {
      return res.redirect('/teacher');
    }
    res.redirect('/cabinet');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { title: 'Вход / Регистрация', error: 'Ошибка при входе' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
