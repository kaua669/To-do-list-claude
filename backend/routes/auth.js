const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      avatar: null,
      bio: '',
      phone: '',
      location: '',
      createdAt: new Date(),
      stats: { tasksCompleted: 0, streak: 0, points: 0 }
    };

    db.users.push(newUser);

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({ user: userSafe, token, message: 'Conta criada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar conta', message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userSafe } = user;
    res.json({ user: userSafe, token, message: 'Login realizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login', message: err.message });
  }
});

// POST /api/auth/demo
router.post('/demo', (req, res) => {
  const demoUser = db.users.find(u => u.email === 'demo@taskflow.com');
  if (!demoUser) {
    return res.status(404).json({ error: 'Usuário demo não encontrado' });
  }

  const token = jwt.sign({ userId: demoUser.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userSafe } = demoUser;
  res.json({ user: userSafe, token, message: 'Acesso demo iniciado!' });
});

module.exports = router;
