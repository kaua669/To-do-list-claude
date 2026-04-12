const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/habits
router.get('/', (req, res) => {
  const habits = db.habits.filter(h => h.userId === req.user.id);
  const today = new Date().toISOString().split('T')[0];

  const habitsWithStatus = habits.map(h => ({
    ...h,
    completedToday: h.completedDates.includes(today)
  }));

  res.json({ habits: habitsWithStatus });
});

// POST /api/habits
router.post('/', (req, res) => {
  const { title, icon, color, frequency, target } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  const newHabit = {
    id: uuidv4(),
    userId: req.user.id,
    title,
    icon: icon || '⭐',
    color: color || '#6366f1',
    frequency: frequency || 'daily',
    target: target || 1,
    completedDates: [],
    streak: 0,
    createdAt: new Date().toISOString()
  };

  db.habits.push(newHabit);
  res.status(201).json({ habit: newHabit, message: 'Hábito criado!' });
});

// PATCH /api/habits/:id/complete
router.patch('/:id/complete', (req, res) => {
  const habit = db.habits.find(h => h.id === req.params.id && h.userId === req.user.id);
  if (!habit) return res.status(404).json({ error: 'Hábito não encontrado' });

  const today = new Date().toISOString().split('T')[0];
  const alreadyDone = habit.completedDates.includes(today);

  if (alreadyDone) {
    habit.completedDates = habit.completedDates.filter(d => d !== today);
    habit.streak = Math.max(0, habit.streak - 1);
  } else {
    habit.completedDates.push(today);
    habit.streak++;
    // Update user points
    const user = db.users.find(u => u.id === req.user.id);
    if (user) user.stats.points += 5;
  }

  res.json({ habit: { ...habit, completedToday: !alreadyDone }, message: alreadyDone ? 'Desmarcado!' : 'Hábito concluído!' });
});

// DELETE /api/habits/:id
router.delete('/:id', (req, res) => {
  const habitIndex = db.habits.findIndex(h => h.id === req.params.id && h.userId === req.user.id);
  if (habitIndex === -1) return res.status(404).json({ error: 'Hábito não encontrado' });

  db.habits.splice(habitIndex, 1);
  res.json({ message: 'Hábito excluído!' });
});

module.exports = router;
