const jwt = require('jsonwebtoken');

// JWT_SECRET загружается из .env через dotenv (в server.js)
const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.redirect('/login');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.clearCookie('token');
    return res.redirect('/login');
  }

  req.user = decoded;
  next();
}

function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

function teacherOnly(req, res, next) {
  if (req.user?.role !== 'teacher') {
    return res.status(403).send('Доступ запрещён. Только для преподавателя.');
  }
  next();
}

module.exports = { generateToken, verifyToken, authMiddleware, optionalAuth, teacherOnly, JWT_SECRET };
