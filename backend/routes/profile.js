const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/profile
router.get('/', (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { password, ...userSafe } = user;

  // Compute stats
  const tasks = db.tasks.filter(t => t.userId === req.user.id);
  const completedTasks = tasks.filter(t => t.status === 'concluida').length;
  const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
  const habits = db.habits.filter(h => h.userId === req.user.id);
  const notes = db.notes.filter(n => n.userId === req.user.id);
  const events = db.agenda.filter(e => e.userId === req.user.id);

  res.json({
    user: userSafe,
    stats: {
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      totalHabits: habits.length,
      totalNotes: notes.length,
      totalEvents: events.length,
      points: user.stats?.points || 0,
      streak: user.stats?.streak || 0
    }
  });
});

// PUT /api/profile
router.put('/', (req, res) => {
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

  const allowedFields = ['name', 'bio', 'phone', 'location', 'avatar'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      db.users[userIndex][field] = req.body[field];
    }
  });

  const { password, ...userSafe } = db.users[userIndex];
  res.json({ user: userSafe, message: 'Perfil atualizado!' });
});

// PUT /api/profile/password
router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }

  const user = db.users.find(u => u.id === req.user.id);
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  res.json({ message: 'Senha atualizada com sucesso!' });
});

module.exports = router;
