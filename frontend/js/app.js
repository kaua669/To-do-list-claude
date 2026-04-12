/* ============================================================
   TASKFLOW — MAIN APP CONTROLLER
   ============================================================ */

const App = {
  currentPage: 'dashboard',
  user: null,

  // ── INIT ────────────────────────────────────────
  async init() {
    this.setCurrentDate();
    this.setupModalClose();

    const token = API.getToken();
    const storedUser = localStorage.getItem('tf_user');

    if (token && storedUser) {
      this.user = JSON.parse(storedUser);
      this.showApp();
      await this.navigate('dashboard');
    } else {
      this.showAuth();
    }
  },

  setCurrentDate() {
    const el = document.getElementById('current-date');
    if (el) {
      el.textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }
  },

  setupModalClose() {
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) {
        this.closeModal();
      }
    });
  },

  // ── AUTH ─────────────────────────────────────────
  showAuth() {
    document.getElementById('auth-overlay').classList.add('active');
    document.getElementById('app').classList.add('hidden');
    this.setupAuthTabs();
  },

  showApp() {
    document.getElementById('auth-overlay').classList.remove('active');
    document.getElementById('app').classList.remove('hidden');
    this.updateSidebar();
  },

  setupAuthTabs() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
        document.getElementById('auth-error').textContent = '';
      });
    });
  },

  setAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 500); }
  },

  async login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) { this.setAuthError('Preencha email e senha'); return; }

    try {
      const data = await API.auth.login({ email, password });
      this.onAuthSuccess(data);
    } catch (err) { this.setAuthError(err.message); }
  },

  async register() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) { this.setAuthError('Preencha todos os campos'); return; }
    if (password.length < 6) { this.setAuthError('Senha deve ter pelo menos 6 caracteres'); return; }

    try {
      const data = await API.auth.register({ name, email, password });
      this.onAuthSuccess(data);
    } catch (err) { this.setAuthError(err.message); }
  },

  async loginDemo() {
    try {
      const data = await API.auth.demo();
      this.onAuthSuccess(data);
    } catch (err) { this.setAuthError(err.message); }
  },

  onAuthSuccess(data) {
    this.user = data.user;
    API.setToken(data.token);
    localStorage.setItem('tf_user', JSON.stringify(data.user));
    this.showApp();
    this.navigate('dashboard');
    Utils.toast(`Bem-vindo, ${data.user.name}! 🎉`, 'success');
  },

  logout() {
    if (!confirm('Deseja sair da sua conta?')) return;
    API.clearToken();
    this.user = null;
    // Stop pomodoro if running
    if (typeof PomodoroPage !== 'undefined' && PomodoroPage.running) {
      PomodoroPage.stop();
    }
    this.showAuth();
    Utils.toast('Até logo! 👋', 'info');
  },

  // ── NAVIGATION ────────────────────────────────────
  async navigate(page) {
    this.currentPage = page;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update title
    const titles = {
      dashboard: '🏠 Dashboard',
      tasks: '📋 Tarefas',
      agenda: '📅 Agenda',
      notes: '📝 Notas',
      habits: '🔥 Hábitos',
      pomodoro: '🍅 Pomodoro',
      tools: '🔧 Ferramentas',
      profile: '👤 Perfil'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Stop pomodoro if leaving
    if (page !== 'pomodoro' && typeof PomodoroPage !== 'undefined' && PomodoroPage.running) {
      PomodoroPage.stop();
    }

    // Render page
    const pages = {
      dashboard: DashboardPage,
      tasks: TasksPage,
      agenda: AgendaPage,
      notes: NotesPage,
      habits: HabitsPage,
      pomodoro: PomodoroPage,
      tools: ToolsPage,
      profile: ProfilePage
    };

    const pageObj = pages[page];
    if (pageObj && pageObj.render) {
      await pageObj.render();
    }
  },

  // ── SIDEBAR ───────────────────────────────────────
  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
  },

  updateSidebar() {
    if (!this.user) return;
    const nameEl = document.getElementById('sidebar-name');
    const avatarEl = document.getElementById('sidebar-avatar');
    const pointsEl = document.getElementById('sidebar-points');

    if (nameEl) nameEl.textContent = this.user.name;
    if (avatarEl) {
      if (this.user.avatar) {
        avatarEl.innerHTML = `<img src="${this.user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />`;
      } else {
        avatarEl.textContent = Utils.initials(this.user.name);
      }
    }
    if (pointsEl) pointsEl.textContent = (this.user.stats?.points || 0) + ' pts';
  },

  // ── SEARCH ────────────────────────────────────────
  globalSearch: Utils.debounce(async function(val) {
    if (!val.trim()) return;
    if (App.currentPage === 'tasks') {
      TasksPage.filters.search = val;
      await TasksPage.loadTasks();
      TasksPage.renderPage();
    }
  }, 400),

  // ── MODAL ─────────────────────────────────────────
  closeModal(event) {
    if (event && event.target !== document.getElementById('modal-overlay')) return;
    Utils.closeModal();
  },

  // ── NOTIFICATIONS ────────────────────────────────
  toggleNotifications() {
    Utils.openModal('🔔 Notificações', `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="activity-item">
          <div class="activity-dot" style="background:var(--accent)"></div>
          <div class="activity-text">
            <strong>Bem-vindo ao TaskFlow!</strong>
            <span>Explore todas as funcionalidades disponíveis</span>
          </div>
          <span class="activity-time">agora</span>
        </div>
        <div class="activity-item">
          <div class="activity-dot" style="background:var(--accent-3)"></div>
          <div class="activity-text">
            <strong>Dica: Use o Pomodoro</strong>
            <span>Aumente sua produtividade com sessões focadas</span>
          </div>
          <span class="activity-time">hoje</span>
        </div>
        <div class="activity-item">
          <div class="activity-dot" style="background:var(--accent-2)"></div>
          <div class="activity-text">
            <strong>Crie seus hábitos</strong>
            <span>Registre hábitos diários para acompanhar seu progresso</span>
          </div>
          <span class="activity-time">ontem</span>
        </div>
      </div>
    `);
  }
};

// ── KEYBOARD SHORTCUTS ──────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    const shortcuts = {
      '1': 'dashboard', '2': 'tasks', '3': 'agenda',
      '4': 'notes', '5': 'habits', '6': 'pomodoro',
      '7': 'tools', '8': 'profile'
    };
    if (shortcuts[e.key]) { e.preventDefault(); App.navigate(shortcuts[e.key]); }
  }
  if (e.key === 'Escape') { Utils.closeModal(); }
});

// ── START ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
