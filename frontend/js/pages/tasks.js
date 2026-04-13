/* ============================================================
   TASKFLOW — TASKS PAGE
   ============================================================ */

const TasksPage = {
  tasks: [],
  view: 'list', // list | kanban
  filters: { status: '', category: '', priority: '', search: '' },

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    await this.loadTasks();
    this.renderPage();
  },

  async loadTasks() {
    try {
      const q = new URLSearchParams();
      if (this.filters.status) q.set('status', this.filters.status);
      if (this.filters.category) q.set('category', this.filters.category);
      if (this.filters.priority) q.set('priority', this.filters.priority);
      if (this.filters.search) q.set('search', this.filters.search);
      const data = await API.tasks.list(q.toString() ? '?' + q.toString() : '');
      this.tasks = data.tasks;
      // Update badge
      const badge = document.getElementById('tasks-badge');
      if (badge) badge.textContent = data.stats?.pendente || 0;
    } catch (err) {
      Utils.toast(err.message, 'error');
    }
  },

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <!-- TOOLBAR -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div class="tasks-toolbar" style="margin-bottom:0">
          <div class="filter-group">
            ${['','pendente','em_progresso','concluida'].map((s,i) => `
              <button class="filter-btn ${this.filters.status===s?'active':''}"
                onclick="TasksPage.setFilter('status','${s}')">
                ${['Todas','Pendentes','Em Progresso','Concluídas'][i]}
              </button>`).join('')}
          </div>
          <select onchange="TasksPage.setFilter('priority',this.value)" style="width:auto;padding:8px 12px">
            <option value="">Prioridade</option>
            <option value="alta" ${this.filters.priority==='alta'?'selected':''}>🔴 Alta</option>
            <option value="media" ${this.filters.priority==='media'?'selected':''}>🟡 Média</option>
            <option value="baixa" ${this.filters.priority==='baixa'?'selected':''}>🟢 Baixa</option>
          </select>
          <select onchange="TasksPage.setFilter('category',this.value)" style="width:auto;padding:8px 12px">
            <option value="">Categoria</option>
            ${typeof CategoryManager !== 'undefined'
              ? CategoryManager.getAll().map(c => `<option value="${c.value}" ${this.filters.category===c.value?'selected':''}>${c.icon} ${c.label}</option>`).join('')
              : `<option value="trabalho">💼 Trabalho</option>
                 <option value="pessoal">🏠 Pessoal</option>
                 <option value="saude">❤️ Saúde</option>
                 <option value="estudo">📚 Estudo</option>
                 <option value="financeiro">💰 Finanças</option>
                 <option value="outros">📌 Outros</option>`}
          </select>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary btn-sm ${this.view==='list'?'active':''}" onclick="TasksPage.setView('list')">☰ Lista</button>
          <button class="btn-secondary btn-sm ${this.view==='kanban'?'active':''}" onclick="TasksPage.setView('kanban')">⊞ Kanban</button>
          <button class="btn-primary btn-sm" onclick="TasksPage.openCreateModal()">+ Nova Tarefa</button>
        </div>
      </div>

      <!-- TASK LIST / KANBAN -->
      <div id="tasks-container">
        ${this.view === 'list' ? this.renderList() : this.renderKanban()}
      </div>
    `;
  },

  renderList() {
    if (this.tasks.length === 0) {
      return `<div class="empty-state"><div class="empty-icon"></div><h3>Nenhuma tarefa encontrada</h3><p>Crie sua primeira tarefa clicando em "+ Nova Tarefa"</p></div>`;
    }
    return `<div class="stagger">${this.tasks.map(t => this.taskCard(t)).join('')}</div>`;
  },

  taskCard(t) {
    const isOverdue = Utils.isOverdue(t.dueDate) && t.status !== 'concluida';
    const subtasksDone = t.subtasks?.filter(s => s.done).length || 0;
    const subtasksTotal = t.subtasks?.length || 0;
    return `
      <div class="task-card ${t.status==='concluida'?'completed':''}" onclick="TasksPage.openEditModal('${t.id}')">
        <div class="task-card-header">
          <div class="checkbox-custom ${t.status==='concluida'?'checked':''}"
            onclick="event.stopPropagation();TasksPage.toggleStatus('${t.id}','${t.status}')">
            ${t.status==='concluida'?'<span style="color:white;font-weight:700">✓</span>':''}
          </div>
          <div class="task-info">
            <div class="task-title">${Utils.esc(t.title)}</div>
            ${t.description ? `<div class="task-description">${Utils.esc(t.description)}</div>` : ''}
            <div class="task-meta">
              <span class="tag priority-${t.priority}">${Utils.priorityLabel(t.priority)}</span>
              <span class="tag">${Utils.categoryLabel(t.category)}</span>
              <span class="tag status-${t.status}">${Utils.statusLabel(t.status)}</span>
              ${t.dueDate ? `<span class="task-due ${isOverdue?'overdue':''}">📅 ${Utils.formatDate(t.dueDate)}</span>` : ''}
              ${subtasksTotal > 0 ? `<span style="font-size:12px;color:var(--text-muted)">${subtasksDone}/${subtasksTotal} subtarefas</span>` : ''}
            </div>
            ${subtasksTotal > 0 ? `
              <div class="progress-bar" style="margin-top:8px">
                <div class="progress-fill" style="width:${Math.round(subtasksDone/subtasksTotal*100)}%"></div>
              </div>` : ''}
          </div>
          <div class="task-actions" onclick="event.stopPropagation()">
            <button onclick="TasksPage.openEditModal('${t.id}')" title="Editar">✏️</button>
            <button onclick="TasksPage.deleteTask('${t.id}')" title="Excluir">🗑️</button>
          </div>
        </div>
      </div>`;
  },

  renderKanban() {
    const cols = [
      { key: 'pendente', label: 'Pendente', color: 'var(--text-muted)' },
      { key: 'em_progresso', label: 'Em Progresso', color: '#60a5fa' },
      { key: 'concluida', label: 'Concluída', color: 'var(--accent-2)' }
    ];
    return `
      <div class="kanban-board">
        ${cols.map(col => {
          const colTasks = this.tasks.filter(t => t.status === col.key);
          return `
            <div class="kanban-col">
              <div class="kanban-col-header">
                <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
                <span class="kanban-count">${colTasks.length}</span>
              </div>
              ${colTasks.map(t => `
                <div class="kanban-card" onclick="TasksPage.openEditModal('${t.id}')">
                  <div class="kanban-card-title">${Utils.esc(t.title)}</div>
                  <div class="kanban-card-meta">
                    <span class="tag priority-${t.priority}">${t.priority}</span>
                    ${t.dueDate ? `<span style="font-size:11px;color:var(--text-muted)">📅 ${Utils.formatDate(t.dueDate)}</span>` : ''}
                  </div>
                </div>`).join('')}
              <button class="btn-secondary btn-sm" style="width:100%;margin-top:8px" onclick="TasksPage.openCreateModal('${col.key}')">+ Adicionar</button>
            </div>`;
        }).join('')}
      </div>`;
  },

  setFilter(key, val) {
    this.filters[key] = val;
    this.render();
  },

  setView(v) {
    this.view = v;
    this.renderPage();
  },

  async toggleStatus(id, current) {
    const next = { pendente: 'em_progresso', em_progresso: 'concluida', concluida: 'pendente' }[current];
    try {
      await API.tasks.updateStatus(id, next);
      Utils.toast(next === 'concluida' ? '🎉 Tarefa concluída!' : 'Status atualizado!', 'success');
      await this.loadTasks();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  async deleteTask(id) {
    if (!await Utils.confirm('Excluir esta tarefa permanentemente?')) return;
    try {
      await API.tasks.delete(id);
      Utils.toast('Tarefa excluída!', 'success');
      await this.loadTasks();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  openCreateModal(defaultStatus = 'pendente') {
    Utils.openModal('Nova Tarefa', this.taskForm(null, defaultStatus));
  },

  openEditModal(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    Utils.openModal('Editar Tarefa', this.taskForm(task));
  },

  taskForm(task, defaultStatus = 'pendente') {
    const t = task || {};
    return `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="form-group">
          <label>Título *</label>
          <input id="tf-title" value="${Utils.esc(t.title||'')}" placeholder="Nome da tarefa..." />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea id="tf-desc" placeholder="Detalhes opcionais...">${Utils.esc(t.description||'')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label>Prioridade</label>
            <select id="tf-priority">
              <option value="baixa" ${t.priority==='baixa'?'selected':''}>🟢 Baixa</option>
              <option value="media" ${!t.priority||t.priority==='media'?'selected':''}>🟡 Média</option>
              <option value="alta" ${t.priority==='alta'?'selected':''}>🔴 Alta</option>
            </select>
          </div>
          <div class="form-group">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <label style="margin-bottom:0">Categoria</label>
              <button type="button" onclick="CategoryManager.openModal(()=>{const s=document.getElementById('tf-category');if(s){const cur=s.value;s.innerHTML=CategoryManager.renderOptions(cur);}})"
                style="background:none;border:none;color:var(--accent);font-size:11px;cursor:pointer;font-family:var(--font-body);padding:0;font-weight:600">
                + Nova categoria
              </button>
            </div>
            <select id="tf-category">
              ${typeof CategoryManager !== 'undefined' ? CategoryManager.renderOptions(t.category||'pessoal') : `
              <option value="pessoal" ${t.category==='pessoal'?'selected':''}>🏠 Pessoal</option>
              <option value="trabalho" ${t.category==='trabalho'?'selected':''}>💼 Trabalho</option>
              <option value="saude" ${t.category==='saude'?'selected':''}>❤️ Saúde</option>
              <option value="estudo" ${t.category==='estudo'?'selected':''}>📚 Estudo</option>
              <option value="financeiro" ${t.category==='financeiro'?'selected':''}>💰 Finanças</option>
              <option value="outros" ${t.category==='outros'?'selected':''}>📌 Outros</option>`}
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label>Status</label>
            <select id="tf-status">
              <option value="pendente" ${(t.status||defaultStatus)==='pendente'?'selected':''}>Pendente</option>
              <option value="em_progresso" ${t.status==='em_progresso'?'selected':''}>Em Progresso</option>
              <option value="concluida" ${t.status==='concluida'?'selected':''}>Concluída</option>
            </select>
          </div>
          <div class="form-group">
            <label>Data Limite</label>
            <input type="date" id="tf-due" value="${t.dueDate?t.dueDate.split('T')[0]:''}" />
          </div>
        </div>
        <div class="form-group">
          <label>Tags (separadas por vírgula)</label>
          <input id="tf-tags" value="${(t.tags||[]).join(', ')}" placeholder="ex: urgente, cliente, reunião" />
        </div>
        <div class="form-group">
          <label>Subtarefas</label>
          <div id="subtasks-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
            ${(t.subtasks||[]).map(s => `
              <div style="display:flex;align-items:center;gap:8px">
                <input type="checkbox" ${s.done?'checked':''} style="width:auto" />
                <span style="font-size:14px;flex:1">${Utils.esc(s.title)}</span>
              </div>`).join('')}
          </div>
          <div style="display:flex;gap:8px">
            <input id="new-subtask" placeholder="Nova subtarefa..." style="flex:1" onkeydown="if(event.key==='Enter')TasksPage.addSubtaskField()" />
            <button class="btn-secondary btn-sm" onclick="TasksPage.addSubtaskField()">+ Add</button>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button class="btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
          <button class="btn-primary" onclick="TasksPage.saveTask('${t.id||''}')">
            ${t.id ? ' Salvar' : 'Criar Tarefa'}
          </button>
        </div>
      </div>`;
  },

  addSubtaskField() {
    const input = document.getElementById('new-subtask');
    if (!input.value.trim()) return;
    const list = document.getElementById('subtasks-list');
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:8px';
    div.innerHTML = `<input type="checkbox" style="width:auto" /><span style="font-size:14px;flex:1">${Utils.esc(input.value.trim())}</span>`;
    list.appendChild(div);
    input.value = '';
    input.focus();
  },

  async saveTask(id) {
    const title = document.getElementById('tf-title').value.trim();
    if (!title) { Utils.toast('Título é obrigatório!', 'warning'); return; }

    const subtaskEls = document.querySelectorAll('#subtasks-list > div');
    const subtasks = Array.from(subtaskEls).map(el => ({
      title: el.querySelector('span')?.textContent || '',
      done: el.querySelector('input[type=checkbox]')?.checked || false
    })).filter(s => s.title);

    const data = {
      title,
      description: document.getElementById('tf-desc').value,
      priority: document.getElementById('tf-priority').value,
      category: document.getElementById('tf-category').value,
      status: document.getElementById('tf-status').value,
      dueDate: document.getElementById('tf-due').value || null,
      tags: document.getElementById('tf-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      subtasks
    };

    try {
      if (id) {
        await API.tasks.update(id, data);
        Utils.toast('Tarefa atualizada!', 'success');
      } else {
        await API.tasks.create(data);
        Utils.toast('Tarefa criada!', 'success');
      }
      Utils.closeModal();
      await this.loadTasks();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  }
};
