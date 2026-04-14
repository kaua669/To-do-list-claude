/* ============================================================
   TASKFLOW — DASHBOARD PAGE
   ============================================================ */

const DashboardPage = {
  data: null,

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    try {
      this.data = await API.tools.stats();
      const { overview, charts } = this.data;

      content.innerHTML = `
        <!-- STAT CARDS -->
        <div class="dashboard-grid stagger">
          ${this.statCard('Tarefas', 'Total de Tarefas', overview.totalTasks, '#6366f1', '99,102,241', `${overview.completionRate}% concluídas`)}
          ${this.statCard('Tarefas concluídas', 'Concluídas', overview.completedTasks, '#06d6a0', '6,214,160', 'Parabéns!')}
          ${this.statCard('Cronograma', 'Eventos Hoje', overview.todayEvents, '#f59e0b', '245,158,11', `${overview.totalEvents} no total`)}
          ${this.statCard('Nível', 'Pontos', overview.points, '#f43f5e', '244,63,94', `${overview.streak} dias seguidos`)}
        </div>

        <!-- HABITS & TASKS TODAY -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:24px">
          ${this.habitsWidget(overview)}
          ${this.activityWidget(charts.last7Days)}
          ${this.donutWidget(overview)}
        </div>

        <!-- TODAY + PRIORITY -->
        <div class="dashboard-bottom">
          ${this.todayWidget()}
          ${this.priorityWidget(charts.tasksByCategory)}
        </div>
      `;

      this.renderBarChart(charts.last7Days);
      this.animateStats();
    } catch (err) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Erro ao carregar</h3><p>${err.message}</p></div>`;
    }
  },

  statCard(icon, label, value, color, rgb, change) {
    return `
      <div class="stat-card" style="--stat-color:${color};--stat-rgb:${rgb}">
        <div class="stat-icon">${icon}</div>
        <div class="stat-value count-num" data-target="${value}">0</div>
        <div class="stat-label">${label}</div>
        <div class="stat-change">${change}</div>
      </div>`;
  },

  habitsWidget(overview) {
    const pct = overview.totalHabits > 0
      ? Math.round((overview.completedHabitsToday / overview.totalHabits) * 100) : 0;
    return `
      <div class="card">
        <div class="section-header">
          <span class="section-title">Hábitos Hoje</span>
          <button class="btn-secondary btn-sm" onclick="App.navigate('habits')">Ver todos</button>
        </div>
        <div style="text-align:center;padding:16px 0">
          <div style="font-family:var(--font-display);font-size:40px;font-weight:800;color:var(--accent-3)">${overview.completedHabitsToday}/${overview.totalHabits}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">hábitos completados</div>
          <div class="progress-bar" style="margin-top:16px">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:8px">${pct}% do dia concluído</div>
        </div>
      </div>`;
  },

  activityWidget(last7Days) {
    return `
      <div class="card" id="bar-chart-card">
        <div class="section-header">
          <span class="section-title">Atividade (7 dias)</span>
        </div>
        <div class="bar-chart" id="bar-chart-container">
          ${last7Days.map(d => `
            <div class="bar-item">
              <div class="bar-fill" data-val="${d.completed}" style="height:4px"></div>
              <div class="bar-label">${d.day}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  donutWidget(overview) {
    const total = overview.totalTasks || 1;
    const pct = Math.round((overview.completedTasks / total) * 100);
    const r = 54, c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    return `
      <div class="card">
        <div class="section-header">
          <span class="section-title">Progresso</span>
        </div>
        <div class="donut-wrap">
          <div class="donut-chart">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="10"/>
              <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--accent)" stroke-width="10"
                stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
                class="pomo-circle" style="transition:stroke-dashoffset 1.5s ease"/>
            </svg>
            <div class="donut-center">
              <div class="donut-pct">${pct}%</div>
              <div class="donut-lbl">concluído</div>
            </div>
          </div>
          <div class="donut-legend" style="width:160px">
            ${this.legendItem('var(--accent-2)', 'Concluídas', overview.completedTasks)}
            ${this.legendItem('#60a5fa', 'Em Progresso', overview.inProgressTasks)}
            ${this.legendItem('var(--text-muted)', 'Pendentes', overview.pendingTasks)}
          </div>
        </div>
      </div>`;
  },

  legendItem(color, label, val) {
    return `<div class="legend-item">
      <div class="legend-dot" style="background:${color}"></div>
      <span class="legend-label">${label}</span>
      <span class="legend-val">${val}</span>
    </div>`;
  },

  todayWidget() {
    const today = this.data?.today || {};
    const tasks = today.tasks || [];
    const events = today.events || [];
    return `
      <div class="card">
        <div class="section-header">
          <span class="section-title"> Para Hoje</span>
          <button class="btn-secondary btn-sm" onclick="App.navigate('tasks')">+ Tarefa</button>
        </div>
        ${tasks.length === 0 && events.length === 0 ? `
          <div class="empty-state" style="padding:30px">
            <div class="empty-icon"></div>
            <h3>Dia livre!</h3>
            <p>Nenhuma tarefa ou evento para hoje</p>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px">
            ${events.map(e => `
              <div class="activity-item">
                <div class="activity-dot" style="background:${e.color}"></div>
                <div class="activity-text">
                  <strong>${Utils.esc(e.title)}</strong>
                  <span>${e.startTime} — ${e.endTime}</span>
                </div>
                <span class="tag">Evento</span>
              </div>`).join('')}
            ${tasks.map(t => `
              <div class="activity-item">
                <div class="activity-dot" style="background:${t.priority==='alta'?'var(--accent-4)':t.priority==='media'?'var(--accent-3)':'var(--accent-2)'}"></div>
                <div class="activity-text">
                  <strong>${Utils.esc(t.title)}</strong>
                  <span>${Utils.categoryLabel(t.category)}</span>
                </div>
                <span class="tag priority-${t.priority}">${t.priority}</span>
              </div>`).join('')}
          </div>
        `}
      </div>`;
  },

  priorityWidget(tasksByCategory) {
    const cats = Object.entries(tasksByCategory || {});
    const total = cats.reduce((s, [, v]) => s + v, 0) || 1;
    const catIcons = { trabalho:'💼', pessoal:'🏠', saude:'❤️', estudo:'📚', financeiro:'💰', outros:'📌' };
    const catColors = { trabalho:'var(--accent)', pessoal:'var(--accent-2)', saude:'var(--accent-4)', estudo:'#60a5fa', financeiro:'var(--accent-3)', outros:'var(--accent-5)' };

    return `
      <div class="card">
        <div class="section-header">
          <span class="section-title">Por Categoria</span>
        </div>
        ${cats.length === 0 ? `<div class="empty-state" style="padding:30px"><div class="empty-icon"></div><h3>Sem tarefas</h3><p>Crie sua primeira tarefa</p></div>` : `
          <div style="display:flex;flex-direction:column;gap:12px">
            ${cats.map(([cat, count]) => `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <span style="font-size:13px;font-weight:500">${catIcons[cat]||'📌'} ${Utils.categoryLabel(cat).split(' ').slice(1).join(' ')}</span>
                  <span style="font-size:13px;color:var(--text-muted)">${count} tarefa${count!==1?'s':''}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${Math.round(count/total*100)}%;background:${catColors[cat]||'var(--accent)'}"></div>
                </div>
              </div>`).join('')}
          </div>
        `}
      </div>`;
  },

  renderBarChart(data) {
    const bars = document.querySelectorAll('.bar-fill');
    const max = Math.max(...data.map(d => d.completed), 1);
    bars.forEach((bar, i) => {
      const val = parseInt(bar.dataset.val) || 0;
      const h = Math.max((val / max) * 80, 4);
      setTimeout(() => { bar.style.height = h + 'px'; }, 100 + i * 50);
    });
  },

  animateStats() {
    document.querySelectorAll('.count-num').forEach(el => {
      const target = parseInt(el.dataset.target) || 0;
      Utils.countUp(el, target);
    });
  }
};
