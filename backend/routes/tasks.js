const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tasks
router.get('/', (req, res) => {
  const { status, category, priority, search } = req.query;
  let tasks = db.tasks.filter(t => t.userId === req.user.id);

  if (status) tasks = tasks.filter(t => t.status === status);
  if (category) tasks = tasks.filter(t => t.category === category);
  if (priority) tasks = tasks.filter(t => t.priority === priority);
  if (search) tasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: db.tasks.filter(t => t.userId === req.user.id).length,
    pendente: db.tasks.filter(t => t.userId === req.user.id && t.status === 'pendente').length,
    em_progresso: db.tasks.filter(t => t.userId === req.user.id && t.status === 'em_progresso').length,
    concluida: db.tasks.filter(t => t.userId === req.user.id && t.status === 'concluida').length
  };

  res.json({ tasks, stats });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, category, priority, dueDate, tags, subtasks } = req.body;

  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  const newTask = {
    id: uuidv4(),
    userId: req.user.id,
    title,
    description: description || '',
    category: category || 'pessoal',
    priority: priority || 'media',
    status: 'pendente',
    dueDate: dueDate || null,
    tags: tags || [],
    subtasks: (subtasks || []).map(s => ({ id: uuidv4(), title: s.title || s, done: false })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.tasks.push(newTask);
  res.status(201).json({ task: newTask, message: 'Tarefa criada!' });
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const taskIndex = db.tasks.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
  if (taskIndex === -1) return res.status(404).json({ error: 'Tarefa não encontrada' });

  const updatedTask = {
    ...db.tasks[taskIndex],
    ...req.body,
    id: req.params.id,
    userId: req.user.id,
    updatedAt: new Date().toISOString()
  };

  db.tasks[taskIndex] = updatedTask;

  // Update user stats if completed
  if (req.body.status === 'concluida' && db.tasks[taskIndex].status !== 'concluida') {
    const user = db.users.find(u => u.id === req.user.id);
    if (user) {
      user.stats.tasksCompleted++;
      user.stats.points += 10;
    }
  }

  res.json({ task: updatedTask, message: 'Tarefa atualizada!' });
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.id && t.userId === req.user.id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

  const wasCompleted = task.status === 'concluida';
  task.status = req.body.status;
  task.updatedAt = new Date().toISOString();

  if (req.body.status === 'concluida' && !wasCompleted) {
    const user = db.users.find(u => u.id === req.user.id);
    if (user) {
      user.stats.tasksCompleted++;
      user.stats.points += 10;
    }
  }

  res.json({ task, message: 'Status atualizado!' });
});

// PATCH /api/tasks/:id/subtask/:subtaskId
router.patch('/:id/subtask/:subtaskId', (req, res) => {
  const task = db.tasks.find(t => t.id === req.params.id && t.userId === req.user.id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

  const subtask = task.subtasks.find(s => s.id === req.params.subtaskId);
  if (!subtask) return res.status(404).json({ error: 'Subtarefa não encontrada' });

  subtask.done = req.body.done;
  task.updatedAt = new Date().toISOString();

  res.json({ task, message: 'Subtarefa atualizada!' });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const taskIndex = db.tasks.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
  if (taskIndex === -1) return res.status(404).json({ error: 'Tarefa não encontrada' });

  db.tasks.splice(taskIndex, 1);
  res.json({ message: 'Tarefa excluída!' });
});

module.exports = router;
