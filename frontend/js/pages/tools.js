/* ============================================================
   TASKFLOW — TOOLS PAGE
   ============================================================ */

const ToolsPage = {
  activeTool: null,

  render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="tools-grid stagger">
        ${this.toolCard('🍅', 'Pomodoro Timer', 'Técnica de gerenciamento de tempo com intervalos focados de trabalho.', 'pomodoro')}
        ${this.toolCard('🗺️', 'Matriz de Eisenhower', 'Priorize tarefas por urgência e importância para focar no que realmente importa.', 'matrix')}
        ${this.toolCard('📊', 'Análise de Produtividade', 'Veja gráficos e estatísticas detalhadas sobre seu desempenho.', 'analytics')}
        ${this.toolCard('🎯', 'Metas SMART', 'Defina metas específicas, mensuráveis, atingíveis, relevantes e com prazo.', 'smart')}
        ${this.toolCard('⏱️', 'Cronômetro', 'Cronometre suas atividades com precisão.', 'stopwatch')}
        ${this.toolCard('🧮', 'Calculadora de Foco', 'Calcule quantas sessões você precisa para concluir uma tarefa.', 'calc')}
      </div>

      <div id="tool-panel" style="margin-top:24px"></div>
    `;
  },

  toolCard(icon, name, desc, tool) {
    return `
      <div class="tool-card" onclick="ToolsPage.openTool('${tool}')">
        <div class="tool-icon">${icon}</div>
        <div class="tool-name">${name}</div>
        <div class="tool-desc">${desc}</div>
        <button class="btn-secondary btn-sm">Abrir ferramenta →</button>
      </div>`;
  },

  async openTool(tool) {
    this.activeTool = tool;
    const panel = document.getElementById('tool-panel');

    const renderers = {
      pomodoro: () => { App.navigate('pomodoro'); },
      matrix: () => this.renderMatrix(panel),
      analytics: () => this.renderAnalytics(panel),
      smart: () => this.renderSmart(panel),
      stopwatch: () => this.renderStopwatch(panel),
      calc: () => this.renderCalc(panel)
    };

    if (renderers[tool]) renderers[tool]();
  },

  async renderMatrix(panel) {
    let tasks = [];
    try {
      const data = await API.tasks.list();
      tasks = data.tasks.filter(t => t.status !== 'concluida');
    } catch {}

    const quadrants = [
      { key: 'q1', label: 'Urgente + Importante', sub: 'FAZER AGORA', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.3)', match: t => t.priority==='alta' },
      { key: 'q2', label: 'Não Urgente + Importante', sub: 'PLANEJAR', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.3)', match: t => t.priority==='media' },
      { key: 'q3', label: 'Urgente + Não Importante', sub: 'DELEGAR', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', match: t => Utils.isOverdue(t.dueDate) && t.priority==='baixa' },
      { key: 'q4', label: 'Não Urgente + Não Importante', sub: 'ELIMINAR', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.3)', match: t => !Utils.isOverdue(t.dueDate) && t.priority==='baixa' }
    ];

    panel.innerHTML = `
      <div class="card">
        <div class="section-title" style="margin-bottom:16px">🗺️ Matriz de Eisenhower</div>
        <div class="matrix-grid">
          ${quadrants.map(q => `
            <div class="matrix-cell" style="background:${q.bg};border-color:${q.border}">
              <div class="matrix-cell-header">
                <div style="font-size:13px;font-weight:700">${q.label}</div>
                <div style="font-size:10px;font-weight:600;color:var(--text-muted);letter-spacing:0.08em">${q.sub}</div>
              </div>
              <div class="matrix-cell-items">
                ${tasks.filter(q.match).map(t => `
                  <div class="matrix-item">${Utils.esc(t.title)}</div>`).join('') || `<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px">Vazio</div>`}
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  async renderAnalytics(panel) {
    let stats;
    try { stats = await API.tools.stats(); } catch { return; }
    const { overview, charts } = stats;

    panel.innerHTML = `
      <div class="card">
        <div class="section-title" style="margin-bottom:20px">📊 Análise de Produtividade</div>
        <div class="grid-4" style="margin-bottom:20px">
          ${[
            ['Taxa de Conclusão', overview.completionRate + '%', 'var(--accent)'],
            ['Tarefas / Semana', Math.round(overview.totalTasks / 4), 'var(--accent-2)'],
            ['Hábitos Ativos', overview.totalHabits, 'var(--accent-3)'],
            ['Pontos Totais', overview.points, 'var(--accent-5)']
          ].map(([l,v,c]) => `
            <div class="card" style="text-align:center;border-color:${c}30">
              <div style="font-family:var(--font-display);font-size:28px;font-weight:800;color:${c}">${v}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${l}</div>
            </div>`).join('')}
        </div>
        <div style="margin-bottom:16px">
          <div style="font-weight:600;margin-bottom:12px">Atividade dos Últimos 7 Dias</div>
          <div class="bar-chart" style="height:120px">
            ${(() => {
              const data = charts.last7Days;
              const max = Math.max(...data.map(d=>d.completed), 1);
              return data.map(d => `
                <div class="bar-item">
                  <div style="font-size:11px;color:var(--accent);font-weight:600">${d.completed}</div>
                  <div class="bar-fill" style="height:${Math.max(d.completed/max*80, 4)}px"></div>
                  <div class="bar-label">${d.day}</div>
                </div>`).join('');
            })()}
          </div>
        </div>
      </div>`;
  },

  renderSmart(panel) {
    panel.innerHTML = `
      <div class="card">
        <div class="section-title" style="margin-bottom:16px">🎯 Criar Meta SMART</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          ${[
            ['S — Específica', 'O que exatamente você quer alcançar?', 'smart-s'],
            ['M — Mensurável', 'Como você saberá que atingiu a meta?', 'smart-m'],
            ['A — Atingível', 'É realista com seus recursos atuais?', 'smart-a'],
            ['R — Relevante', 'Por que isso é importante para você?', 'smart-r'],
            ['T — Temporal', 'Qual o prazo para atingir?', 'smart-t']
          ].map(([l,p,id]) => `
            <div class="form-group">
              <label>${l}</label>
              <input id="${id}" placeholder="${p}" />
            </div>`).join('')}
        </div>
        <button class="btn-primary" onclick="ToolsPage.generateSmart()">✨ Gerar Meta SMART</button>
        <div id="smart-result" style="margin-top:16px"></div>
      </div>`;
  },

  generateSmart() {
    const s = document.getElementById('smart-s').value;
    const m = document.getElementById('smart-m').value;
    const a = document.getElementById('smart-a').value;
    const r = document.getElementById('smart-r').value;
    const t = document.getElementById('smart-t').value;

    if (!s || !t) { Utils.toast('Preencha ao menos o objetivo e o prazo!', 'warning'); return; }

    const result = document.getElementById('smart-result');
    result.innerHTML = `
      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);border-radius:var(--radius-md);padding:18px">
        <div style="font-weight:700;margin-bottom:10px;color:var(--accent)">📋 Sua Meta SMART:</div>
        <p style="font-size:14px;line-height:1.6;color:var(--text-primary)">
          <strong>${s}</strong>${m ? `, medido por ${m}` : ''}${a ? `, de forma ${a}` : ''}${r ? `, porque ${r}` : ''}${t ? `, até ${t}` : ''}.
        </p>
        <button class="btn-primary btn-sm" style="margin-top:12px" onclick="ToolsPage.saveSmartAsTask()">Criar como tarefa →</button>
      </div>`;

    window._smartGoal = s;
  },

  async saveSmartAsTask() {
    if (!window._smartGoal) return;
    try {
      await API.tasks.create({ title: window._smartGoal, category: 'pessoal', priority: 'alta' });
      Utils.toast('Meta criada como tarefa!', 'success');
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  renderStopwatch(panel) {
    let ms = 0, running = false, interval = null;
    const laps = [];

    panel.innerHTML = `
      <div class="card" style="text-align:center;max-width:400px;margin:0 auto">
        <div class="section-title" style="margin-bottom:20px">⏱️ Cronômetro</div>
        <div id="sw-display" style="font-family:var(--font-display);font-size:52px;font-weight:800;margin-bottom:20px;letter-spacing:0.05em">00:00.00</div>
        <div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px">
          <button class="btn-primary" id="sw-btn" onclick="ToolsPage.swToggle()">▶ Iniciar</button>
          <button class="btn-secondary" onclick="ToolsPage.swReset()">↺ Reset</button>
          <button class="btn-secondary" onclick="ToolsPage.swLap()">🏁 Lap</button>
        </div>
        <div id="sw-laps" style="max-height:160px;overflow-y:auto;text-align:left"></div>
      </div>`;

    window._sw = { ms: 0, running: false, interval: null, laps: [], startTime: 0 };
  },

  renderCalc(panel) {
    panel.innerHTML = `
      <div class="card" style="max-width:400px;margin:0 auto">
        <div class="section-title" style="margin-bottom:16px">🧮 Calculadora de Sessões</div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="form-group">
            <label>Tempo estimado da tarefa (horas)</label>
            <input type="number" id="calc-hours" value="2" min="0.5" step="0.5" />
          </div>
          <div class="form-group">
            <label>Duração de cada sessão (min)</label>
            <input type="number" id="calc-duration" value="25" min="5" step="5" />
          </div>
          <button class="btn-primary" onclick="ToolsPage.calcSessions()">Calcular</button>
          <div id="calc-result"></div>
        </div>
      </div>`;
  },

  calcSessions() {
    const hours = parseFloat(document.getElementById('calc-hours').value);
    const duration = parseInt(document.getElementById('calc-duration').value);
    const sessions = Math.ceil((hours * 60) / duration);
    const withBreaks = sessions * duration + (sessions - 1) * 5;

    document.getElementById('calc-result').innerHTML = `
      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);border-radius:var(--radius-md);padding:16px;text-align:center">
        <div style="font-family:var(--font-display);font-size:36px;font-weight:800;color:var(--accent)">${sessions}</div>
        <div style="font-size:13px;color:var(--text-secondary)">sessões de ${duration} minutos</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">≈ ${Math.round(withBreaks/60*10)/10}h com pausas incluídas</div>
      </div>`;
  },

  swToggle() {
    const sw = window._sw;
    if (!sw) return;
    if (sw.running) {
      sw.running = false;
      clearInterval(sw.interval);
      document.getElementById('sw-btn').textContent = '▶ Continuar';
    } else {
      sw.running = true;
      sw.startTime = Date.now() - sw.ms;
      sw.interval = setInterval(() => {
        sw.ms = Date.now() - sw.startTime;
        const ms = sw.ms;
        const cents = Math.floor((ms % 1000) / 10);
        const secs = Math.floor(ms / 1000) % 60;
        const mins = Math.floor(ms / 60000);
        document.getElementById('sw-display').textContent =
          `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(cents).padStart(2,'0')}`;
      }, 50);
      document.getElementById('sw-btn').textContent = '⏸ Pausar';
    }
  },

  swReset() {
    const sw = window._sw;
    if (!sw) return;
    clearInterval(sw.interval);
    sw.running = false; sw.ms = 0; sw.laps = [];
    document.getElementById('sw-display').textContent = '00:00.00';
    document.getElementById('sw-btn').textContent = '▶ Iniciar';
    document.getElementById('sw-laps').innerHTML = '';
  },

  swLap() {
    const sw = window._sw;
    if (!sw || !sw.running) return;
    sw.laps.push(sw.ms);
    const display = document.getElementById('sw-display').textContent;
    const lapsEl = document.getElementById('sw-laps');
    lapsEl.innerHTML = sw.laps.map((_, i) => {
      const ms = sw.laps[sw.laps.length - 1 - i];
      const cents = Math.floor((ms%1000)/10), secs = Math.floor(ms/1000)%60, mins = Math.floor(ms/60000);
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
        <span>Lap ${sw.laps.length - i}</span>
        <span style="font-family:monospace">${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(cents).padStart(2,'0')}</span>
      </div>`;
    }).join('');
  }
};
