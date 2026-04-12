<<<<<<< HEAD
# ⚡ TaskFlow — Produtividade Inteligente

Sistema completo de produtividade com **Node.js backend** e **frontend HTML/CSS/JS** puro.

---

## 📁 Estrutura do Projeto

```
taskflow/
├── backend/                  ← API Node.js
│   ├── server.js             ← Servidor Express principal
│   ├── package.json
│   ├── .env
│   ├── models/
│   │   └── database.js       ← Banco de dados em memória
│   ├── middleware/
│   │   └── auth.js           ← Autenticação JWT
│   └── routes/
│       ├── auth.js           ← Login / Registro
│       ├── tasks.js          ← Tarefas
│       ├── agenda.js         ← Eventos do calendário
│       ├── notes.js          ← Notas
│       ├── habits.js         ← Hábitos
│       ├── profile.js        ← Perfil do usuário
│       └── tools.js          ← Pomodoro / Estatísticas
└── frontend/                 ← Interface Web
    ├── index.html            ← Página principal
    ├── css/
    │   ├── main.css          ← Design system
    │   ├── components.css    ← Componentes
    │   └── animations.css    ← Animações
    └── js/
        ├── api.js            ← Cliente HTTP
        ├── utils.js          ← Utilitários
        ├── app.js            ← Controlador principal
        └── pages/
            ├── dashboard.js
            ├── tasks.js
            ├── agenda.js
            ├── notes.js
            ├── habits.js
            ├── pomodoro.js
            ├── tools.js
            └── profile.js
```

---

## 🚀 Como Rodar

### 1. Instalar dependências do backend

```bash
cd backend
npm install
```

### 2. Iniciar o backend

```bash
# Modo desenvolvimento (com auto-reload):
npm run dev

# Modo produção:
npm start
```

O servidor rodará em: **http://localhost:3001**

### 3. Abrir o frontend

Abra o arquivo `frontend/index.html` diretamente no navegador.

> 💡 **Dica:** Para evitar problemas de CORS ao abrir o HTML diretamente, use uma extensão como **Live Server** no VS Code.

---

## 🔑 Acesso Demo

Use o botão **"Entrar como Demo"** na tela de login para acessar sem cadastro.

- **Email:** demo@taskflow.com
- **Senha:** password

---

## ✨ Funcionalidades

| Área | Recursos |
|------|----------|
| **Dashboard** | Estatísticas, gráficos, atividade diária |
| **Tarefas** | Criar, editar, filtrar, Kanban, subtarefas, prioridades |
| **Agenda** | Calendário mensal, eventos coloridos, tipos |
| **Notas** | Notas coloridas, fixar, busca, tags |
| **Hábitos** | Streak diário, progresso, conquistas |
| **Pomodoro** | Timer focado, pausas, sessões, histórico |
| **Ferramentas** | Matriz Eisenhower, Análise, Metas SMART, Cronômetro, Calculadora |
| **Perfil** | Editar dados, senha, avatar, conquistas, XP/Level |

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Ctrl + 1` | Dashboard |
| `Ctrl + 2` | Tarefas |
| `Ctrl + 3` | Agenda |
| `Ctrl + 4` | Notas |
| `Ctrl + 5` | Hábitos |
| `Ctrl + 6` | Pomodoro |
| `Ctrl + 7` | Ferramentas |
| `Ctrl + 8` | Perfil |
| `Esc` | Fechar modal |

---

## 🔧 Tecnologias

**Backend:**
- Node.js + Express
- JWT (autenticação)
- bcryptjs (hash de senhas)
- uuid (IDs únicos)
- cors, dotenv

**Frontend:**
- HTML5 + CSS3 + JavaScript puro
- Fontes: Syne + DM Sans (Google Fonts)
- Design: Dark theme glassmorphism

---

## 📦 Para Produção

Para usar em produção, substitua o banco de dados em memória (`models/database.js`) por:
- **MongoDB** com Mongoose
- **PostgreSQL** com Prisma ou pg
- **SQLite** com better-sqlite3

---

Feito com ⚡ por TaskFlow
=======
# To-do-list-claude
CLaude to do list
>>>>>>> e8c9bd01915a3e63c8af394373ec82e2235dfbe3
