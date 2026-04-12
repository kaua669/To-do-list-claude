/* ============================================================
   TASKFLOW — AGENDA PAGE
   ============================================================ */

const AgendaPage = {
  events: [],
  currentDate: new Date(),
  selectedDate: null,

  async render() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    await this.loadEvents();
    this.renderPage();
  },

  async loadEvents() {
    try {
      const m = this.currentDate.getMonth() + 1;
      const y = this.currentDate.getFullYear();
      const data = await API.agenda.list(`?month=${m}&year=${y}`);
      this.events = data.events;
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  renderPage() {
    const content = document.getElementById('page-content');
    const monthName = this.currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div></div>
        <button class="btn-primary btn-sm" onclick="AgendaPage.openEventModal()">+ Novo Evento</button>
      </div>
      <div class="calendar-wrap">
        <!-- Calendar -->
        <div>
          <div class="calendar-nav">
            <button class="btn-secondary btn-sm" onclick="AgendaPage.changeMonth(-1)">‹ Anterior</button>
            <h2>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h2>
            <button class="btn-secondary btn-sm" onclick="AgendaPage.changeMonth(1)">Próximo ›</button>
          </div>
          <div class="calendar-grid">
            <div class="calendar-weekdays">
              ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<div class="weekday">${d}</div>`).join('')}
            </div>
            <div class="calendar-days">
              ${this.renderDays()}
            </div>
          </div>
        </div>

        <!-- Events sidebar -->
        <div class="events-sidebar-panel">
          <h3>📅 ${this.selectedDate ? new Date(this.selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {weekday:'long',day:'numeric',month:'long'}) : 'Selecione um dia'}</h3>
          <div id="day-events">
            ${this.renderDayEvents(this.selectedDate)}
          </div>
        </div>
      </div>
    `;
  },

  renderDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    let html = '';
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="calendar-day other-month"><div class="day-num">${daysInPrev - i}</div></div>`;
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEvents = this.events.filter(e => e.date === dateStr);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDate;

      html += `
        <div class="calendar-day ${isToday?'today':''} ${isSelected?'selected':''}" onclick="AgendaPage.selectDate('${dateStr}')">
          <div class="day-num">${d}</div>
          <div class="day-events">
            ${dayEvents.slice(0,3).map(e => `
              <div class="day-event-dot" style="background:${e.color}20;color:${e.color}">${e.title}</div>`).join('')}
            ${dayEvents.length > 3 ? `<div style="font-size:10px;color:var(--text-muted)">+${dayEvents.length-3} mais</div>` : ''}
          </div>
        </div>`;
    }

    // Fill remaining
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = 1; i <= totalCells - firstDay - daysInMonth; i++) {
      html += `<div class="calendar-day other-month"><div class="day-num">${i}</div></div>`;
    }

    return html;
  },

  renderDayEvents(dateStr) {
    const dayEvents = this.events.filter(e => e.date === dateStr);
    if (dayEvents.length === 0) {
      return `<div style="text-align:center;padding:30px;color:var(--text-muted)">
        <div style="font-size:32px;margin-bottom:8px">🌟</div>
        <p style="font-size:14px">Nenhum evento neste dia</p>
        <button class="btn-secondary btn-sm" style="margin-top:12px" onclick="AgendaPage.openEventModal('${dateStr||''}')">+ Adicionar</button>
      </div>`;
    }
    return dayEvents.map(e => `
      <div class="event-card" style="--event-color:${e.color}" onclick="AgendaPage.openEditModal('${e.id}')">
        <div class="event-time">${e.startTime} — ${e.endTime}</div>
        <div class="event-title">${Utils.esc(e.title)}</div>
        ${e.description ? `<div class="event-desc">${Utils.esc(e.description)}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span class="tag" style="font-size:11px">${e.type}</span>
          <button onclick="event.stopPropagation();AgendaPage.deleteEvent('${e.id}')"
            style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px">🗑️</button>
        </div>
      </div>`).join('');
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    document.getElementById('day-events').innerHTML = this.renderDayEvents(dateStr);
  },

  async changeMonth(dir) {
    this.currentDate.setMonth(this.currentDate.getMonth() + dir);
    await this.loadEvents();
    this.renderPage();
  },

  openEventModal(defaultDate = '') {
    Utils.openModal('Novo Evento', this.eventForm(null, defaultDate || this.selectedDate));
  },

  openEditModal(id) {
    const ev = this.events.find(e => e.id === id);
    if (ev) Utils.openModal('Editar Evento', this.eventForm(ev));
  },

  eventForm(ev, defaultDate = '') {
    const e = ev || {};
    const colorOptions = ['#6366f1','#06d6a0','#f59e0b','#f43f5e','#8b5cf6','#60a5fa','#ec4899'];
    return `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="form-group">
          <label>Título *</label>
          <input id="ev-title" value="${Utils.esc(e.title||'')}" placeholder="Nome do evento..." />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea id="ev-desc" placeholder="Detalhes...">${Utils.esc(e.description||'')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="form-group">
            <label>Data *</label>
            <input type="date" id="ev-date" value="${e.date||defaultDate}" />
          </div>
          <div class="form-group">
            <label>Início</label>
            <input type="time" id="ev-start" value="${e.startTime||'09:00'}" />
          </div>
          <div class="form-group">
            <label>Fim</label>
            <input type="time" id="ev-end" value="${e.endTime||'10:00'}" />
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label>Tipo</label>
            <select id="ev-type">
              <option value="pessoal" ${e.type==='pessoal'?'selected':''}>🏠 Pessoal</option>
              <option value="trabalho" ${e.type==='trabalho'?'selected':''}>💼 Trabalho</option>
              <option value="reuniao" ${e.type==='reuniao'?'selected':''}>👥 Reunião</option>
              <option value="saude" ${e.type==='saude'?'selected':''}>❤️ Saúde</option>
              <option value="outro" ${e.type==='outro'?'selected':''}>📌 Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Lembrete (min antes)</label>
            <select id="ev-reminder">
              <option value="0">Sem lembrete</option>
              <option value="5" ${e.reminder===5?'selected':''}>5 minutos</option>
              <option value="15" ${e.reminder===15?'selected':''}>15 minutos</option>
              <option value="30" ${e.reminder===30?'selected':''}>30 minutos</option>
              <option value="60" ${e.reminder===60?'selected':''}>1 hora</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Cor</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${colorOptions.map(c => `
              <div onclick="document.getElementById('ev-color').value='${c}';document.querySelectorAll('.color-opt').forEach(x=>x.style.outline='none');this.style.outline='3px solid white'"
                class="color-opt" style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;outline:${(e.color||'#6366f1')===c?'3px solid white':'none'};outline-offset:2px">
              </div>`).join('')}
            <input type="hidden" id="ev-color" value="${e.color||'#6366f1'}" />
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button class="btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
          <button class="btn-primary" onclick="AgendaPage.saveEvent('${e.id||''}')">
            ${e.id ? '💾 Salvar' : '✨ Criar Evento'}
          </button>
        </div>
      </div>`;
  },

  async saveEvent(id) {
    const title = document.getElementById('ev-title').value.trim();
    if (!title) { Utils.toast('Título é obrigatório!', 'warning'); return; }
    const date = document.getElementById('ev-date').value;
    if (!date) { Utils.toast('Data é obrigatória!', 'warning'); return; }

    const data = {
      title,
      description: document.getElementById('ev-desc').value,
      date,
      startTime: document.getElementById('ev-start').value,
      endTime: document.getElementById('ev-end').value,
      type: document.getElementById('ev-type').value,
      color: document.getElementById('ev-color').value,
      reminder: parseInt(document.getElementById('ev-reminder').value)
    };

    try {
      if (id) {
        await API.agenda.update(id, data);
        Utils.toast('Evento atualizado!', 'success');
      } else {
        await API.agenda.create(data);
        Utils.toast('Evento criado!', 'success');
      }
      Utils.closeModal();
      await this.loadEvents();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  async deleteEvent(id) {
    if (!await Utils.confirm('Excluir este evento?')) return;
    try {
      await API.agenda.delete(id);
      Utils.toast('Evento excluído!', 'success');
      await this.loadEvents();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  }
};
