const jwt = require('jsonwebtoken');
const db = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = { authMiddleware, JWT_SECRET };
