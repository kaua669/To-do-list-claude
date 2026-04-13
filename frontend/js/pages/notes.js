/* ============================================================
   TASKFLOW — NOTES PAGE
   ============================================================ */

const NotesPage = {
  notes: [],
  search: '',

  async render() {
    await this.loadNotes();
    this.renderPage();
  },

  async loadNotes() {
    try {
      const q = this.search ? `?search=${encodeURIComponent(this.search)}` : '';
      const data = await API.notes.list(q);
      this.notes = data.notes;
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  renderPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="search-bar" style="width:280px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Buscar notas..." value="${Utils.esc(this.search)}"
              oninput="NotesPage.setSearch(this.value)" />
          </div>
        </div>
        <button class="btn-primary btn-sm" onclick="NotesPage.openCreateModal()">+ Nova Nota</button>
      </div>

      ${this.notes.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon"></div>
          <h3>Nenhuma nota encontrada</h3>
          <p>Crie sua primeira nota para guardar ideias e anotações importantes</p>
        </div>
      ` : `
        <div class="notes-grid stagger">
          ${this.notes.map(n => this.noteCard(n)).join('')}
        </div>
      `}
    `;
  },

  noteCard(n) {
    return `
      <div class="note-card" style="--note-color:${n.color}" onclick="NotesPage.openEditModal('${n.id}')">
        <button class="note-pin ${n.pinned?'pinned':''}" title="${n.pinned?'Desafixar':'Fixar'}"
          onclick="event.stopPropagation();NotesPage.togglePin('${n.id}')">
          ${n.pinned ? '📌' : '📍'}
        </button>
        <div class="note-title">${Utils.esc(n.title)}</div>
        <div class="note-preview">${Utils.esc(n.content || 'Sem conteúdo...')}</div>
        ${n.tags?.length ? `
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:10px">
            ${n.tags.map(t => `<span class="tag" style="font-size:10px">#${Utils.esc(t)}</span>`).join('')}
          </div>` : ''}
        <div class="note-footer">
          <span class="note-date">${Utils.formatRelative(n.updatedAt)}</span>
          <div class="note-actions">
            <button onclick="event.stopPropagation();NotesPage.openEditModal('${n.id}')" title="Editar">✏️</button>
            <button onclick="event.stopPropagation();NotesPage.deleteNote('${n.id}')" title="Excluir">🗑️</button>
          </div>
        </div>
      </div>`;
  },

  setSearch: Utils.debounce(async function(v) {
    NotesPage.search = v;
    await NotesPage.loadNotes();
    NotesPage.renderPage();
  }, 400),

  async togglePin(id) {
    try {
      const data = await API.notes.pin(id);
      Utils.toast(data.message, 'success');
      await this.loadNotes();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  openCreateModal() {
    Utils.openModal('Nova Nota', this.noteForm(null));
  },

  openEditModal(id) {
    const note = this.notes.find(n => n.id === id);
    if (note) Utils.openModal('Editar Nota', this.noteForm(note));
  },

  noteForm(note) {
    const n = note || {};
    const colorOptions = ['#fbbf24', '#f87171', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#94a3b8'];
    return `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="form-group">
          <label>Título *</label>
          <input id="nf-title" value="${Utils.esc(n.title||'')}" placeholder="Título da nota..." />
        </div>
        <div class="form-group">
          <label>Conteúdo</label>
          <textarea id="nf-content" style="min-height:160px;font-family:var(--font-body);font-size:14px;line-height:1.6"
            placeholder="Escreva sua nota aqui...">${Utils.esc(n.content||'')}</textarea>
        </div>
        <div class="form-group">
          <label>Tags (separadas por vírgula)</label>
          <input id="nf-tags" value="${(n.tags||[]).join(', ')}" placeholder="ideia, projeto, trabalho..." />
        </div>
        <div class="form-group">
          <label>Cor</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${colorOptions.map(c => `
              <div onclick="document.getElementById('nf-color').value='${c}';document.querySelectorAll('.ncolor-opt').forEach(x=>x.style.outline='none');this.style.outline='3px solid white'"
                class="ncolor-opt" style="width:28px;height:28px;border-radius:8px;background:${c};cursor:pointer;outline:${(n.color||'#fbbf24')===c?'3px solid white':'none'};outline-offset:2px">
              </div>`).join('')}
            <input type="hidden" id="nf-color" value="${n.color||'#fbbf24'}" />
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button class="btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
          <button class="btn-primary" onclick="NotesPage.saveNote('${n.id||''}')">
            ${n.id ? ' Salvar' : 'Criar Nota'}
          </button>
        </div>
      </div>`;
  },

  async saveNote(id) {
    const title = document.getElementById('nf-title').value.trim();
    if (!title) { Utils.toast('Título é obrigatório!', 'warning'); return; }

    const data = {
      title,
      content: document.getElementById('nf-content').value,
      color: document.getElementById('nf-color').value,
      tags: document.getElementById('nf-tags').value.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (id) {
        await API.notes.update(id, data);
        Utils.toast('Nota atualizada!', 'success');
      } else {
        await API.notes.create(data);
        Utils.toast('Nota criada!', 'success');
      }
      Utils.closeModal();
      await this.loadNotes();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  async deleteNote(id) {
    if (!await Utils.confirm('Excluir esta nota permanentemente?')) return;
    try {
      await API.notes.delete(id);
      Utils.toast('Nota excluída!', 'success');
      await this.loadNotes();
      this.renderPage();
    } catch (err) { Utils.toast(err.message, 'error'); }
  }
};
