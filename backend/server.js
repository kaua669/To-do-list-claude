require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const agendaRoutes = require('./routes/agenda');
const profileRoutes = require('./routes/profile');
const toolsRoutes = require('./routes/tools');
const notesRoutes = require('./routes/notes');
const habitsRoutes = require('./routes/habits');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/habits', habitsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TaskFlow API rodando!', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API rodando na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
