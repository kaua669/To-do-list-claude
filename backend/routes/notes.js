const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/notes
router.get('/', (req, res) => {
  const { search, pinned } = req.query;
  let notes = db.notes.filter(n => n.userId === req.user.id);

  if (search) notes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );
  if (pinned !== undefined) notes = notes.filter(n => n.pinned === (pinned === 'true'));

  notes.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  res.json({ notes });
});

// POST /api/notes
router.post('/', (req, res) => {
  const { title, content, color, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  const newNote = {
    id: uuidv4(),
    userId: req.user.id,
    title,
    content: content || '',
    color: color || '#fbbf24',
    pinned: false,
    tags: tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.notes.push(newNote);
  res.status(201).json({ note: newNote, message: 'Nota criada!' });
});

// PUT /api/notes/:id
router.put('/:id', (req, res) => {
  const noteIndex = db.notes.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
  if (noteIndex === -1) return res.status(404).json({ error: 'Nota não encontrada' });

  db.notes[noteIndex] = {
    ...db.notes[noteIndex],
    ...req.body,
    id: req.params.id,
    userId: req.user.id,
    updatedAt: new Date().toISOString()
  };

  res.json({ note: db.notes[noteIndex], message: 'Nota atualizada!' });
});

// PATCH /api/notes/:id/pin
router.patch('/:id/pin', (req, res) => {
  const note = db.notes.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (!note) return res.status(404).json({ error: 'Nota não encontrada' });

  note.pinned = !note.pinned;
  res.json({ note, message: note.pinned ? 'Nota fixada!' : 'Nota desafixada!' });
});

// DELETE /api/notes/:id
router.delete('/:id', (req, res) => {
  const noteIndex = db.notes.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
  if (noteIndex === -1) return res.status(404).json({ error: 'Nota não encontrada' });

  db.notes.splice(noteIndex, 1);
  res.json({ message: 'Nota excluída!' });
});

module.exports = router;
