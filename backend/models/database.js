// Banco de dados em memória (simula um banco real)
// Em produção, substitua por MongoDB, PostgreSQL, etc.

const { v4: uuidv4 } = require('uuid');

const db = {
  users: [
    {
      id: 'user-demo-1',
      name: 'João Silva',
      email: 'demo@taskflow.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
      avatar: null,
      bio: 'Desenvolvedor apaixonado por produtividade',
      phone: '(11) 99999-9999',
      location: 'São Paulo, SP',
      createdAt: new Date('2024-01-01'),
      stats: { tasksCompleted: 42, streak: 7, points: 1250 }
    }
  ],
  tasks: [
    {
      id: uuidv4(),
      userId: 'user-demo-1',
      title: 'Revisar relatório mensal',
      description: 'Verificar todos os dados e gráficos antes de enviar',
      category: 'trabalho',
      priority: 'alta',
      status: 'pendente',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      tags: ['relatório', 'urgente'],
      subtasks: [
        { id: uuidv4(), title: 'Verificar dados', done: false },
        { id: uuidv4(), title: 'Revisar gráficos', done: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      userId: 'user-demo-1',
      title: 'Academia - treino de força',
      description: 'Treino de pernas e costas',
      category: 'saude',
      priority: 'media',
      status: 'pendente',
      dueDate: new Date().toISOString(),
      tags: ['exercício', 'saúde'],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      userId: 'user-demo-1',
      title: 'Estudar Node.js avançado',
      description: 'Módulo de streams e workers',
      category: 'estudo',
      priority: 'media',
      status: 'em_progresso',
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      tags: ['programação', 'backend'],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  agenda: [
    {
      id: uuidv4(),
      userId: 'user-demo-1',
      title: 'Reunião de equipe',
      description: 'Alinhamento semanal do time',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      color: '#6366f1',
      type: 'reuniao',
      recurring: 'weekly',
      reminder: 15,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      userId: 'user-demo-1',
      title: 'Consulta médica',
      description: 'Check-up anual',
      date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '15:00',
      color: '#10b981',
      type: 'pessoal',
      recurring: 'none',
      reminder: 60,
      createdAt: new Date().toISOString()
    }
  ],
  notes: [
    {
      id: uuidv4(),
      userId: 'user-demo-1',
      title: 'Ideias para o projeto',
      content: 'Sistema de notificações push\nIntegração com Google Calendar\nThema dark/light',
      color: '#fbbf24',
      pinned: true,
      tags: ['projeto', 'ideias'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  habits: [
    {
      id: uuidv4(),
      userId: 'user-demo-1',
      title: 'Beber 2L de água',
      icon: '💧',
      color: '#3b82f6',
      frequency: 'daily',
      target: 1,
      completedDates: [],
      streak: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      userId: 'user-demo-1',
      title: 'Meditação 10 min',
      icon: '🧘',
      color: '#8b5cf6',
      frequency: 'daily',
      target: 1,
      completedDates: [],
      streak: 3,
      createdAt: new Date().toISOString()
    }
  ],
  pomodoros: [],
  timers: []
};

module.exports = db;
