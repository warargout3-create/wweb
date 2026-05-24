// Загружаем переменные окружения из .env (ДО всех require)
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const cabinetRoutes = require('./routes/cabinet');
const teacherRoutes = require('./routes/teacher');
const { optionalAuth } = require('./middleware/auth');
const { csrfProtection } = require('./middleware/csrf');

const app = express();
const PORT = process.env.PORT || 3000;


// Проверка JWT_SECRET при запуске
if (!process.env.JWT_SECRET) {
  console.error('❌ Ошибка: JWT_SECRET не задан! Создайте файл .env на основе .env.example');
  process.exit(1);
}

// ============================================
// Security Middleware
// ============================================

// Helmet — защитные HTTP-заголовки
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // отключаем CSP, т.к. используем inline-стили из FontAwesome
}));

// Rate limiting — защита от брутфорса
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // максимум 20 запросов с одного IP
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Применяем rate limit только к POST-запросам на авторизацию
app.use('/login', (req, res, next) => {
  if (req.method === 'POST') return authLimiter(req, res, next);
  next();
});
app.use('/register', (req, res, next) => {
  if (req.method === 'POST') return authLimiter(req, res, next);
  next();
});
app.use(generalLimiter);

// ============================================
// View engine
// ============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// CSRF protection for state-changing requests
app.use(csrfProtection);

// Make user available to all templates
app.use(optionalAuth);
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/articles', articleRoutes);
app.use('/cabinet', cabinetRoutes);
app.use('/teacher', teacherRoutes);

// Main page
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Главная',
    description: 'Репетитор по математике и физике — студент ВМК МГУ. Подготовка к ЕГЭ, ОГЭ, ДВИ МГУ и поступлению в СУНЦ МГУ. Индивидуальные занятия и консультации.',
    keywords: 'математика, физика, репетитор, МГУ, ВМК, ДВИ, ЕГЭ, ОГЭ, подготовка, СУНЦ, лицей Лобачевского'
  });
});

// Materials page
app.get('/materials/:subject', async (req, res) => {
  const { getDb } = require('./database');
  const db = await getDb();
  const subject = req.params.subject;

  if (!['math', 'physics'].includes(subject)) {
    return res.redirect('/');
  }

  const articles = db.exec(
    'SELECT id, title, created_at FROM articles WHERE subject = ? ORDER BY created_at DESC',
    [subject]
  );

  const articleList = articles.length > 0 ? articles[0].values.map(row => ({
    id: row[0],
    title: row[1],
    created_at: row[2]
  })) : [];

  const subjectNames = { math: 'Математика', physics: 'Физика' };
  const seoDescs = {
    math: 'Учебные материалы по математике: статьи, теоремы, формулы, задачи. Подготовка к ЕГЭ и ОГЭ по математике с преподавателем.',
    physics: 'Учебные материалы по физике: статьи, законы, формулы, задачи. Подготовка к ЕГЭ и ОГЭ по физике с преподавателем.'
  };

  res.render('materials', {
    title: subjectNames[subject],
    description: seoDescs[subject],
    keywords: `${subjectNames[subject].toLowerCase()}, статьи, учебные материалы, ЕГЭ, ОГЭ`,
    subject,
    subjectName: subjectNames[subject],
    articles: articleList
  });
});

// Article page
app.get('/article/:id', async (req, res) => {
  const { getDb } = require('./database');
  const db = await getDb();
  const id = req.params.id;

  const articles = db.exec(
    'SELECT a.id, a.title, a.content, a.subject, a.created_at, a.image_path, u.name FROM articles a JOIN users u ON a.author_id = u.id WHERE a.id = ?',
    [id]
  );

  if (articles.length === 0) {
    return res.redirect('/');
  }

  const row = articles[0].values[0];
  const article = {
    id: row[0],
    title: row[1],
    content: row[2],
    subject: row[3],
    created_at: row[4],
    image_path: row[5],
    author_name: row[6]
  };

  const subjectNames = { math: 'Математика', physics: 'Физика' };
  res.render('article', {
    title: article.title,
    description: `Статья по ${subjectNames[article.subject].toLowerCase()}: ${article.title}. Учебные материалы для подготовки к экзаменам.`,
    keywords: `${subjectNames[article.subject].toLowerCase()}, ${article.title}, статья, учебные материалы`,
    article,
    subjectName: subjectNames[article.subject]
  });
});

// Start server
async function start() {
  // Создаём директории для загрузки файлов, если их нет
  const uploadDirs = [
    'public/uploads/images',
    'public/uploads/homework',
    'public/uploads/videos'
  ];
  uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Создана директория: ${dir}`);
    }
  });

  await initDatabase();
  console.log('Database initialized');

   app.listen(PORT, () => {
     console.log(`Сервер запущен на http://localhost:${PORT}`);
   }).on('error', (err) => {
     if (err.code === 'EADDRINUSE') {
       console.error(`\n❌ Ошибка: порт ${PORT} уже занят!`);
       console.error(`   Запустите stop_server.bat (или stop_website.vbs) и попробуйте снова.\n`);
       process.exit(1);
     } else {
       throw err;
     }
   });
}

start();
