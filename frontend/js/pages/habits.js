/* ============================================================
   TASKFLOW — HABITS PAGE
   ============================================================ */

const HabitsPage = {
  habits: [],

  async render() {
    await this.loadHabits();
    this.renderPage();
  },

  async loadHabits() {
    try {
      const data = await API.habits.list();
      this.habits = data.habits;
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  renderPage() {
    const content = document.getElementById('page-content');
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const completedToday = this.habits.filter(h => h.completedToday).length;
    const total = this.habits.length;
    const pct = total > 0 ? Math.round((completedToday / total) * 100) : 0;

    content.innerHTML = `
      <!-- HEADER SUMMARY -->
      <div class="card" style="margin-bottom:24px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05))">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div>
            <div style="font-family:var(--font-display);font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em">${today}</div>
            <div style="font-family:var(--font-display);font-size:28px;font-weight:800;margin:6px 0">${completedToday} de ${total} hábitos</div>
            <div style="font-size:14px;color:var(--text-secondary)">
              ${pct === 100 ? ' Parabéns! Todos os hábitos concluídos!' : pct >= 50 ? ' Mais da metade! Continue assim!' : ' Vamos lá! Você consegue!'}
            </div>
          </div>
          <div style="text-align:center">
            <div style="font-family:var(--font-display);font-size:48px;font-weight:800;color:var(--accent)">${pct}%</div>
            <div class="progress-bar" style="width:120px;margin:8px auto">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
          </div>
          <button class="btn-primary" onclick="HabitsPage.openCreateModal()">+ Novo Hábito</button>
        </div>
      </div>

      <!-- HABITS GRID -->
      ${this.habits.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon"></div>
          <h3>Nenhum hábito cadastrado</h3>
          <p>Crie hábitos saudáveis e acompanhe seu progresso diário</p>
          <button class="btn-primary" style="margin-top:16px" onclick="HabitsPage.openCreateModal()">Criar primeiro hábito</button>
        </div>
      ` : `
        <div class="habits-grid stagger">
          ${this.habits.map(h => this.habitCard(h)).join('')}
        </div>
      `}

      <!-- STREAK HALL -->
      ${this.habits.filter(h => h.streak > 0).length > 0 ? `
        <div class="card" style="margin-top:24px">
          <div class="section-title" style="margin-bottom:16px">Hall das Sequências</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px">
            ${this.habits.filter(h => h.streak > 0).sort((a,b) => b.streak-a.streak).map(h => `
              <div style="display:flex;align-items:center;gap:8px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px">
                <span style="font-size:20px">${h.icon}</span>
                <div>
                  <div style="font-size:13px;font-weight:600">${Utils.esc(h.title)}</div>
                  <div style="font-size:12px;color:var(--accent-3)"> ${h.streak} dias</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  habitCard(h) {
    return `
      <div class="habit-card ${h.completedToday ? 'completed-today' : ''}">
        <div class="habit-header">
          <div class="habit-icon-wrap" style="background:${h.color}20">
            <span>${h.icon}</span>
          </div>
          <div class="habit-info">
            <div class="habit-title">${Utils.esc(h.title)}</div>
            <div class="habit-streak">${h.streak} dias seguidos</div>
          </div>
          <button onclick="HabitsPage.deleteHabit('${h.id}')"
            style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;padding:4px">🗑️</button>
        </div>

        <div class="habit-progress">
          <div class="habit-progress-label">
            <span>Progresso do mês</span>
            <span>${h.completedDates?.length || 0} dias</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.min((h.completedDates?.length||0)/30*100, 100)}%;background:${h.color}"></div>
          </div>
        </div>

        <button class="habit-complete-btn" onclick="HabitsPage.completeHabit('${h.id}')">
          ${h.completedToday ? '✅ Concluído hoje!' : '○ Marcar como feito'}
        </button>
      </div>`;
  },

  async completeHabit(id) {
    try {
      const data = await API.habits.complete(id);
      Utils.toast(data.message, 'success');
      await this.loadHabits();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  async deleteHabit(id) {
    if (!await Utils.confirm('Excluir este hábito e todo seu progresso?')) return;
    try {
      await API.habits.delete(id);
      Utils.toast('Hábito excluído!', 'success');
      await this.loadHabits();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  openCreateModal() {
    const icons = ['💧','🏋️','📚','🧘','🚴','🍎','🛌','🏃','✍️','🎸','🌿','💊','🧠','🎯','🙏'];
    const colors = ['#6366f1','#06d6a0','#f59e0b','#f43f5e','#8b5cf6','#60a5fa','#ec4899','#14b8a6'];
    Utils.openModal('Novo Hábito', `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="form-group">
          <label>Nome do Hábito *</label>
          <input id="hf-title" placeholder="Ex: Beber 2L de água..." />
        </div>
        <div class="form-group">
          <label>Ícone</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;max-height:80px;overflow-y:auto">
            ${icons.map((ic,i) => `
              <div onclick="document.getElementById('hf-icon').value='${ic}';document.querySelectorAll('.hicon').forEach(x=>x.style.background='transparent');this.style.background='var(--accent)20'"
                class="hicon" style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;border:1px solid var(--border);transition:all 0.2s;${i===0?'background:var(--accent)20':''}">${ic}</div>`).join('')}
          </div>
          <input type="hidden" id="hf-icon" value="💧" />
        </div>
        <div class="form-group">
          <label>Cor</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${colors.map((c,i) => `
              <div onclick="document.getElementById('hf-color').value='${c}';document.querySelectorAll('.hcolor').forEach(x=>x.style.outline='none');this.style.outline='3px solid white'"
                class="hcolor" style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;outline:${i===0?'3px solid white':'none'};outline-offset:2px">
              </div>`).join('')}
            <input type="hidden" id="hf-color" value="#6366f1" />
          </div>
        </div>
        <div class="form-group">
          <label>Frequência</label>
          <select id="hf-freq">
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button class="btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
          <button class="btn-primary" onclick="HabitsPage.saveHabit()"> Criar Hábito</button>
        </div>
      </div>
    `);
  },

  async saveHabit() {
    const title = document.getElementById('hf-title').value.trim();
    if (!title) { Utils.toast('Nome é obrigatório!', 'warning'); return; }

    try {
      await API.habits.create({
        title,
        icon: document.getElementById('hf-icon').value,
        color: document.getElementById('hf-color').value,
        frequency: document.getElementById('hf-freq').value
      });
      Utils.toast('Hábito criado!', 'success');
      Utils.closeModal();
      await this.loadHabits();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  }
};
