const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/agenda
router.get('/', (req, res) => {
  const { month, year, date } = req.query;
  let events = db.agenda.filter(e => e.userId === req.user.id);

  if (date) {
    events = events.filter(e => e.date === date);
  } else if (month && year) {
    events = events.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    });
  }

  events.sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));
  res.json({ events });
});

// POST /api/agenda
router.post('/', (req, res) => {
  const { title, description, date, startTime, endTime, color, type, recurring, reminder } = req.body;

  if (!title || !date) return res.status(400).json({ error: 'Título e data são obrigatórios' });

  const newEvent = {
    id: uuidv4(),
    userId: req.user.id,
    title,
    description: description || '',
    date,
    startTime: startTime || '00:00',
    endTime: endTime || '01:00',
    color: color || '#6366f1',
    type: type || 'pessoal',
    recurring: recurring || 'none',
    reminder: reminder || 0,
    createdAt: new Date().toISOString()
  };

  db.agenda.push(newEvent);
  res.status(201).json({ event: newEvent, message: 'Evento criado!' });
});

// PUT /api/agenda/:id
router.put('/:id', (req, res) => {
  const eventIndex = db.agenda.findIndex(e => e.id === req.params.id && e.userId === req.user.id);
  if (eventIndex === -1) return res.status(404).json({ error: 'Evento não encontrado' });

  db.agenda[eventIndex] = { ...db.agenda[eventIndex], ...req.body, id: req.params.id, userId: req.user.id };
  res.json({ event: db.agenda[eventIndex], message: 'Evento atualizado!' });
});

// DELETE /api/agenda/:id
router.delete('/:id', (req, res) => {
  const eventIndex = db.agenda.findIndex(e => e.id === req.params.id && e.userId === req.user.id);
  if (eventIndex === -1) return res.status(404).json({ error: 'Evento não encontrado' });

  db.agenda.splice(eventIndex, 1);
  res.json({ message: 'Evento excluído!' });
});

module.exports = router;
