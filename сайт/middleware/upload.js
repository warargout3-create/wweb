const multer = require('multer');
const path = require('path');

// Разрешённые MIME-типы для каждого типа загрузки
const ALLOWED_MIME_TYPES = {
  solution: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  video: [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ],
  image: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
  ]
};

// Функция валидации файлов
function fileFilter(req, file, cb) {
  const field = file.fieldname;
  const allowedTypes = ALLOWED_MIME_TYPES[field] || ALLOWED_MIME_TYPES.image;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Недопустимый тип файла: ${file.mimetype}. Разрешённые форматы: ${allowedTypes.join(', ')}`), false);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'public/uploads/';
    if (file.fieldname === 'solution') uploadPath += 'homework/';
    else if (file.fieldname === 'video') uploadPath += 'videos/';
    else uploadPath += 'images/';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Удаляем потенциально опасные символы из оригинального имени
    const safeName = file.originalname.replace(/[^a-zA-Zа-яА-Я0-9._-]/g, '_');
    cb(null, uniqueSuffix + path.extname(safeName));
  }
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1 // только 1 файл за раз
  }
});

module.exports = upload;
