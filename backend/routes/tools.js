const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tools/stats - Dashboard stats
router.get('/stats', (req, res) => {
  const userId = req.user.id;
  const tasks = db.tasks.filter(t => t.userId === userId);
  const habits = db.habits.filter(h => h.userId === userId);
  const events = db.agenda.filter(e => e.userId === userId);
  const notes = db.notes.filter(n => n.userId === userId);
  const user = db.users.find(u => u.id === userId);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(today));
  const todayEvents = events.filter(e => e.date === today);

  // Tasks by category
  const tasksByCategory = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  // Tasks by priority
  const tasksByPriority = {
    alta: tasks.filter(t => t.priority === 'alta').length,
    media: tasks.filter(t => t.priority === 'media').length,
    baixa: tasks.filter(t => t.priority === 'baixa').length
  };

  // Completion rate
  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === 'concluida').length / tasks.length) * 100)
    : 0;

  // Last 7 days activity
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    last7Days.push({
      date: dateStr,
      day: dayName,
      completed: tasks.filter(t => t.status === 'concluida' && t.updatedAt?.startsWith(dateStr)).length,
      created: tasks.filter(t => t.createdAt?.startsWith(dateStr)).length
    });
  }

  res.json({
    overview: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'concluida').length,
      pendingTasks: tasks.filter(t => t.status === 'pendente').length,
      inProgressTasks: tasks.filter(t => t.status === 'em_progresso').length,
      totalHabits: habits.length,
      completedHabitsToday: habits.filter(h => h.completedDates.includes(today)).length,
      totalEvents: events.length,
      todayEvents: todayEvents.length,
      totalNotes: notes.length,
      points: user?.stats?.points || 0,
      streak: user?.stats?.streak || 0,
      completionRate
    },
    today: {
      tasks: todayTasks,
      events: todayEvents
    },
    charts: {
      tasksByCategory,
      tasksByPriority,
      last7Days
    }
  });
});

// POST /api/tools/pomodoro - Save pomodoro session
router.post('/pomodoro', (req, res) => {
  const { taskId, duration, type } = req.body;

  const session = {
    id: uuidv4(),
    userId: req.user.id,
    taskId: taskId || null,
    duration: duration || 25,
    type: type || 'work',
    completedAt: new Date().toISOString()
  };

  db.pomodoros.push(session);

  // Award points for completing pomodoro
  const user = db.users.find(u => u.id === req.user.id);
  if (user && type === 'work') {
    user.stats.points += 15;
  }

  res.status(201).json({ session, message: 'Sessão Pomodoro salva!' });
});

// GET /api/tools/pomodoro/stats
router.get('/pomodoro/stats', (req, res) => {
  const sessions = db.pomodoros.filter(p => p.userId === req.user.id);
  const today = new Date().toISOString().split('T')[0];

  res.json({
    total: sessions.length,
    today: sessions.filter(s => s.completedAt.startsWith(today)).length,
    totalMinutes: sessions.filter(s => s.type === 'work').reduce((sum, s) => sum + s.duration, 0),
    todayMinutes: sessions
      .filter(s => s.completedAt.startsWith(today) && s.type === 'work')
      .reduce((sum, s) => sum + s.duration, 0)
  });
});

module.exports = router;
