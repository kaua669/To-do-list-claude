/* ============================================================
   TASKFLOW — POMODORO PAGE
   ============================================================ */

const PomodoroPage = {
  modes: { work: 25*60, short: 5*60, long: 15*60 },
  mode: 'work',
  timeLeft: 25 * 60,
  running: false,
  interval: null,
  sessionsToday: 0,
  currentSession: 0,
  totalSessions: 4,
  stats: { total: 0, today: 0, totalMinutes: 0, todayMinutes: 0 },

  async render() {
    await this.loadStats();
    this.renderPage();
  },

  async loadStats() {
    try {
      this.stats = await API.tools.pomodoroStats();
      this.sessionsToday = this.stats.today;
    } catch {}
  },

  renderPage() {
    const content = document.getElementById('page-content');
    this.timeLeft = this.modes[this.mode];

    content.innerHTML = `
      <div class="pomodoro-wrap fade-in-up">
        <!-- TYPE TABS -->
        <div class="pomodoro-type-tabs">
          <button class="pomo-tab ${this.mode==='work'?'active':''}" onclick="PomodoroPage.setMode('work')">🍅 Foco</button>
          <button class="pomo-tab ${this.mode==='short'?'active':''}" onclick="PomodoroPage.setMode('short')">☕ Pausa Curta</button>
          <button class="pomo-tab ${this.mode==='long'?'active':''}" onclick="PomodoroPage.setMode('long')">🌴 Pausa Longa</button>
        </div>

        <!-- TIMER RING -->
        <div class="pomodoro-timer" id="pomo-timer">
          <svg viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
            <circle cx="140" cy="140" r="120" fill="none"
              stroke="${this.mode==='work'?'var(--accent)':this.mode==='short'?'var(--accent-2)':'var(--accent-3)'}"
              stroke-width="12" stroke-linecap="round"
              stroke-dasharray="${2*Math.PI*120}"
              stroke-dashoffset="0"
              id="pomo-ring" style="transition:stroke-dashoffset 1s linear"/>
          </svg>
          <div class="pomo-time" id="pomo-display">${Utils.formatSeconds(this.timeLeft)}</div>
          <div class="pomo-phase" id="pomo-phase">${this.phaseLabel()}</div>
        </div>

        <!-- CONTROLS -->
        <div class="pomodoro-controls">
          <button class="pomo-btn" onclick="PomodoroPage.reset()" title="Reiniciar">↺</button>
          <button class="pomo-btn pomo-main" id="pomo-start-btn" onclick="PomodoroPage.toggle()">▶</button>
          <button class="pomo-btn" onclick="PomodoroPage.skip()" title="Pular">⏭</button>
        </div>

        <!-- SESSION DOTS -->
        <div class="pomo-sessions" id="pomo-dots">
          ${Array.from({length:this.totalSessions}).map((_,i) => `
            <div class="pomo-dot ${i < this.currentSession?'done':i===this.currentSession?'current':''}"></div>`).join('')}
        </div>

        <!-- STATS -->
        <div class="pomo-stats">
          <div class="pomo-stat">
            <div class="pomo-stat-val" id="pomo-stat-today">${this.stats.today}</div>
            <div class="pomo-stat-lbl">Hoje</div>
          </div>
          <div class="pomo-stat">
            <div class="pomo-stat-val">${this.stats.total}</div>
            <div class="pomo-stat-lbl">Total</div>
          </div>
          <div class="pomo-stat">
            <div class="pomo-stat-val">${Math.round(this.stats.totalMinutes/60)}h</div>
            <div class="pomo-stat-lbl">Focado</div>
          </div>
        </div>

        <!-- TIP -->
        <div class="card" style="margin-top:20px;text-align:center;border-style:dashed">
          <div style="font-size:20px;margin-bottom:6px">💡</div>
          <div style="font-size:13px;color:var(--text-secondary)">${this.getTip()}</div>
        </div>
      </div>
    `;

    this.updateRing();
  },

  phaseLabel() {
    return { work: 'Tempo de Foco', short: 'Pausa Curta', long: 'Pausa Longa' }[this.mode];
  },

  getTip() {
    const tips = [
      'Durante o foco, feche redes sociais e notificações.',
      'Nas pausas, levante e se movimente um pouco.',
      'Após 4 sessões, tire uma pausa longa de 15-30 min.',
      'Uma coisa por vez: concentre-se numa única tarefa.',
      'Hidrate-se! Beba água durante as pausas.'
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  },

  setMode(mode) {
    if (this.running) this.stop();
    this.mode = mode;
    this.timeLeft = this.modes[mode];
    this.renderPage();
  },

  toggle() {
    this.running ? this.stop() : this.start();
  },

  start() {
    this.running = true;
    document.getElementById('pomo-start-btn').textContent = '⏸';
    this.interval = setInterval(() => this.tick(), 1000);
  },

  stop() {
    this.running = false;
    const btn = document.getElementById('pomo-start-btn');
    if (btn) btn.textContent = '▶';
    clearInterval(this.interval);
  },

  async tick() {
    this.timeLeft--;
    this.updateDisplay();
    this.updateRing();

    if (this.timeLeft <= 0) {
      this.stop();
      this.onComplete();
    }
  },

  async onComplete() {
    // Save session
    try {
      await API.tools.savePomodoro({ duration: this.modes[this.mode] / 60, type: this.mode });
      this.stats.today++;
      const el = document.getElementById('pomo-stat-today');
      if (el) el.textContent = this.stats.today;
    } catch {}

    if (this.mode === 'work') {
      this.currentSession = (this.currentSession + 1) % (this.totalSessions + 1);
      Utils.toast('🍅 Sessão de foco concluída! Descanse um pouco.', 'success', 5000);
      this.updateDots();
      // Auto switch to break
      if (this.currentSession % this.totalSessions === 0) {
        this.setMode('long');
      } else {
        this.setMode('short');
      }
    } else {
      Utils.toast('☕ Pausa concluída! Hora de focar!', 'info', 4000);
      this.setMode('work');
    }
  },

  reset() {
    this.stop();
    this.timeLeft = this.modes[this.mode];
    this.updateDisplay();
    this.updateRing();
  },

  skip() {
    this.stop();
    this.onComplete();
  },

  updateDisplay() {
    const el = document.getElementById('pomo-display');
    if (el) el.textContent = Utils.formatSeconds(this.timeLeft);
  },

  updateRing() {
    const ring = document.getElementById('pomo-ring');
    if (!ring) return;
    const total = this.modes[this.mode];
    const pct = this.timeLeft / total;
    const circumference = 2 * Math.PI * 120;
    ring.style.strokeDashoffset = circumference * (1 - pct);
  },

  updateDots() {
    const dots = document.querySelectorAll('.pomo-dot');
    dots.forEach((dot, i) => {
      dot.className = `pomo-dot ${i < this.currentSession ? 'done' : i === this.currentSession ? 'current' : ''}`;
    });
  }
};
