# TaskFlow — Guia de Implementação PWA + Fix Backend

## 📱 Tornando o App Instalável pelo Chrome (PWA)

### Arquivos para adicionar ao projeto

Copie os seguintes arquivos para a pasta `frontend/`:

```
frontend/
├── index.html          ← SUBSTITUIR pelo novo (com PWA + nav mobile)
├── manifest.json       ← NOVO
├── sw.js               ← NOVO (Service Worker)
├── css/
│   └── mobile.css      ← NOVO (layout mobile + bottom nav)
└── icons/
    ├── icon-192.png    ← NOVO (ícone 192×192)
    └── icon-512.png    ← NOVO (ícone 512×512)
```

### Como funciona

1. O `manifest.json` declara o app como instalável
2. O `sw.js` (Service Worker) faz cache dos arquivos para uso offline
3. O `mobile.css` adapta o layout: esconde a sidebar e adiciona bottom navigation no mobile
4. O `index.html` atualizado inclui as meta tags PWA e a barra de navegação inferior

### Como instalar pelo Chrome (usuário)

1. Acesse o site pelo Chrome no Android ou Chrome desktop
2. Chrome mostrará um banner "Adicionar à tela inicial" ou ícone de instalação (⊕) na barra de endereço
3. Toque em "Instalar" — o app abre em tela cheia como um aplicativo nativo

---

## 🔴 Por que os dados somem no Render? — Explicação e solução

### O problema

O backend usa **SQLite** (`better-sqlite3`) com arquivo `taskflow.db` salvo em disco. 
O Render, no **plano gratuito**, usa um **sistema de arquivos efêmero** — 
ou seja, **toda vez que o serviço reinicia ou hiberna (após 15 min inativo), 
o disco é zerado e o arquivo `.db` é apagado**.

### Por que o Render faz isso

No free tier do Render, os servidores "dormem" após 15 minutos sem requisição 
e reiniciam ao receber uma nova request. Ao reiniciar, tudo que foi escrito 
no disco (fora do repositório) se perde.

### Soluções (escolha uma)

---

#### ✅ Solução 1 — PostgreSQL no Render (RECOMENDADO, gratuito)

O Render oferece um **PostgreSQL gratuito** que persiste os dados.

**Passo 1:** No Render, crie um novo "PostgreSQL" database  
**Passo 2:** Copie a connection string (DATABASE_URL)  
**Passo 3:** No backend, substitua o SQLite pelo PostgreSQL:

```bash
npm install pg
npm uninstall better-sqlite3
```

**Passo 4:** Substitua `backend/db/database.js`:

```js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      bio TEXT,
      avatar_color TEXT DEFAULT '#6366f1',
      avatar_emoji TEXT DEFAULT '✨',
      theme TEXT DEFAULT 'dark',
      accent_color TEXT DEFAULT '#6366f1',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    -- (repita para as outras tabelas)
  `);
  console.log('✅ PostgreSQL inicializado');
}

module.exports = { query, initDatabase };
```

**Passo 5:** Adicione `DATABASE_URL` nas variáveis de ambiente do Render.

---

#### ✅ Solução 2 — MongoDB Atlas (gratuito, 512MB)

1. Crie conta em https://mongodb.com/atlas
2. Crie um cluster gratuito (M0)
3. Obtenha a connection string
4. `npm install mongoose`
5. Use `MONGODB_URI` como variável de ambiente no Render

---

#### ✅ Solução 3 — Render Disk (pago, $1/mês)

No Render, adicione um **Persistent Disk** ao seu serviço:
- Tamanho: 1GB (~$0.25/mês)
- Mount path: `/data`
- Mude o DB_PATH para `/data/taskflow.db`

Isso mantém o SQLite funcionando sem trocar de banco.

---

#### ⚡ Solução rápida temporária — Uptime Robot

Para evitar que o Render durma (causando perda de dados pelo restart):
1. Acesse https://uptimerobot.com (gratuito)
2. Crie um monitor HTTP para `https://seu-app.onrender.com/api/health`
3. Intervalo: 14 minutos
4. Isso mantém o servidor acordado e os dados no disco mais tempo

**Atenção:** Isso não é uma solução permanente — reinicializações ainda podem ocorrer.
A solução correta é usar PostgreSQL (Solução 1).

---

## 📋 Resumo dos arquivos

| Arquivo | Ação |
|---|---|
| `frontend/index.html` | Substituir pelo novo |
| `frontend/manifest.json` | Criar novo |
| `frontend/sw.js` | Criar novo |
| `frontend/css/mobile.css` | Criar novo |
| `frontend/icons/icon-192.png` | Criar (incluído) |
| `frontend/icons/icon-512.png` | Criar (incluído) |
| `backend/db/database.js` | Migrar para PostgreSQL |
