/* ============================================================
   TASKFLOW — CATEGORIAS PERSONALIZADAS
   Arquivo NOVO — não modifica nenhum arquivo existente
   Salva no localStorage para persistência sem backend extra
   ============================================================ */

const CategoryManager = {
  STORAGE_KEY: 'tf_custom_categories',

  // Categorias padrão do sistema (não editáveis)
  defaults: [
    { value: 'trabalho',   label: 'Trabalho',  icon: '💼', color: '#6366f1', custom: false },
    { value: 'pessoal',    label: 'Pessoal',   icon: '🏠', color: '#06d6a0', custom: false },
    { value: 'saude',      label: 'Saúde',     icon: '❤️', color: '#f43f5e', custom: false },
    { value: 'estudo',     label: 'Estudo',    icon: '📚', color: '#60a5fa', custom: false },
    { value: 'financeiro', label: 'Finanças',  icon: '💰', color: '#f59e0b', custom: false },
    { value: 'outros',     label: 'Outros',    icon: '📌', color: '#94a3b8', custom: false },
  ],

  // Retorna todas as categorias (padrão + personalizadas)
  getAll() {
    const custom = this.getCustom();
    return [...this.defaults, ...custom];
  },

  // Retorna apenas personalizadas
  getCustom() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch { return []; }
  },

  // Salva lista de personalizadas
  saveCustom(list) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  },

  // Adiciona nova categoria personalizada
  add(label, icon, color) {
    const value = label.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);

    const all = this.getAll();
    if (all.find(c => c.value === value)) {
      throw new Error('Já existe uma categoria com esse nome.');
    }

    const newCat = { value, label, icon: icon || '🏷️', color: color || '#6366f1', custom: true };
    const customs = this.getCustom();
    customs.push(newCat);
    this.saveCustom(customs);
    return newCat;
  },

  // Remove categoria personalizada
  remove(value) {
    const customs = this.getCustom().filter(c => c.value !== value);
    this.saveCustom(customs);
  },

  // Retorna label com ícone para exibição
  getLabel(value) {
    const cat = this.getAll().find(c => c.value === value);
    return cat ? `${cat.icon} ${cat.label}` : `📌 ${value}`;
  },

  // ── RENDERIZA <options> para um <select> ───────────────
  renderOptions(selectedValue = '') {
    return this.getAll().map(cat =>
      `<option value="${cat.value}" ${cat.value === selectedValue ? 'selected' : ''}>
        ${cat.icon} ${cat.label}${cat.custom ? ' ✦' : ''}
      </option>`
    ).join('');
  },

  // ── ABRE MODAL DE GERENCIAMENTO ───────────────────────
  openModal(onSave) {
    const renderList = () => {
      const customs = this.getCustom();
      if (customs.length === 0) {
        return `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">
          Nenhuma categoria personalizada ainda.
        </div>`;
      }
      return customs.map(c => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px">
          <div style="width:28px;height:28px;border-radius:6px;background:${c.color}20;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${c.icon}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600">${c.label}</div>
            <div style="font-size:11px;color:var(--text-muted)">${c.value}</div>
          </div>
          <button onclick="CategoryManager._deleteFromModal('${c.value}')"
            style="background:none;border:none;color:var(--accent-4);cursor:pointer;font-size:18px;padding:4px;border-radius:4px;line-height:1" title="Excluir">×</button>
        </div>`).join('');
    };

    const colorPalette = ['#6366f1','#06d6a0','#f59e0b','#f43f5e','#8b5cf6','#60a5fa','#ec4899','#14b8a6','#84cc16','#f97316'];
    const iconList = ['🏷️','⭐','🎯','🚀','🌟','💡','🎨','🛠️','📦','🔖','🌈','💎','🏆','🎪','🌺','🎵','🏅','🔑','🌍','💬'];

    Utils.openModal('🗂️ Categorias Personalizadas', `
      <div style="display:flex;flex-direction:column;gap:20px">

        <!-- Existing custom categories -->
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.08em">Suas Categorias</div>
          <div id="cat-list" style="display:flex;flex-direction:column;gap:6px">
            ${renderList()}
          </div>
        </div>

        <div style="height:1px;background:var(--border)"></div>

        <!-- Add new -->
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.08em">Nova Categoria</div>
          <div style="display:flex;flex-direction:column;gap:12px">

            <div class="form-group">
              <label>Nome *</label>
              <input id="cat-name" placeholder="Ex: Freelance, Viagem, Esportes..." maxlength="30" />
            </div>

            <div class="form-group">
              <label>Ícone</label>
              <div style="display:flex;flex-wrap:wrap;gap:6px;max-height:84px;overflow-y:auto;padding:4px 0">
                ${iconList.map((ic, i) => `
                  <div onclick="document.getElementById('cat-icon').value='${ic}';document.querySelectorAll('.cat-ic-opt').forEach(x=>x.style.outline='none');this.style.outline='2px solid var(--accent)'"
                    class="cat-ic-opt"
                    style="width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;border:1px solid var(--border);transition:all 0.15s;${i===0?'outline:2px solid var(--accent)':''}">${ic}</div>`).join('')}
              </div>
              <input type="hidden" id="cat-icon" value="🏷️" />
            </div>

            <div class="form-group">
              <label>Cor</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${colorPalette.map((c, i) => `
                  <div onclick="document.getElementById('cat-color').value='${c}';document.querySelectorAll('.cat-col-opt').forEach(x=>x.style.outline='none');this.style.outline='3px solid white'"
                    class="cat-col-opt"
                    style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;outline:${i===0?'3px solid white':'none'};outline-offset:2px;transition:all 0.15s">
                  </div>`).join('')}
              </div>
              <input type="hidden" id="cat-color" value="${colorPalette[0]}" />
            </div>

            <button class="btn-primary" onclick="CategoryManager._addFromModal()">
              ✨ Criar Categoria
            </button>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end">
          <button class="btn-secondary" onclick="Utils.closeModal()">Fechar</button>
        </div>
      </div>
    `);

    // Store callback for refreshing task form after adding
    this._onSave = onSave || null;
  },

  _addFromModal() {
    const name = document.getElementById('cat-name')?.value?.trim();
    const icon  = document.getElementById('cat-icon')?.value || '🏷️';
    const color = document.getElementById('cat-color')?.value || '#6366f1';

    if (!name) { Utils.toast('Digite um nome para a categoria!', 'warning'); return; }

    try {
      this.add(name, icon, color);
      Utils.toast(`Categoria "${name}" criada!`, 'success');

      // Refresh list inside modal
      const list = document.getElementById('cat-list');
      if (list) {
        const customs = this.getCustom();
        list.innerHTML = customs.length === 0
          ? `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">Nenhuma categoria personalizada ainda.</div>`
          : customs.map(c => `
              <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px">
                <div style="width:28px;height:28px;border-radius:6px;background:${c.color}20;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${c.icon}</div>
                <div style="flex:1"><div style="font-size:14px;font-weight:600">${c.label}</div><div style="font-size:11px;color:var(--text-muted)">${c.value}</div></div>
                <button onclick="CategoryManager._deleteFromModal('${c.value}')"
                  style="background:none;border:none;color:var(--accent-4);cursor:pointer;font-size:18px;padding:4px;border-radius:4px;line-height:1">×</button>
              </div>`).join('');
      }

      // Clear name field
      const nameInput = document.getElementById('cat-name');
      if (nameInput) nameInput.value = '';

      // Notify listeners (e.g. task form to refresh its select)
      if (this._onSave) this._onSave();

    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  _deleteFromModal(value) {
    this.remove(value);
    Utils.toast('Categoria removida!', 'info');
    const el = document.getElementById('cat-list');
    if (el) {
      const customs = this.getCustom();
      el.innerHTML = customs.length === 0
        ? `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">Nenhuma categoria personalizada ainda.</div>`
        : customs.map(c => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px">
              <div style="width:28px;height:28px;border-radius:6px;background:${c.color}20;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${c.icon}</div>
              <div style="flex:1"><div style="font-size:14px;font-weight:600">${c.label}</div><div style="font-size:11px;color:var(--text-muted)">${c.value}</div></div>
              <button onclick="CategoryManager._deleteFromModal('${c.value}')"
                style="background:none;border:none;color:var(--accent-4);cursor:pointer;font-size:18px;padding:4px;border-radius:4px;line-height:1">×</button>
            </div>`).join('');
    }
    if (this._onSave) this._onSave();
  }
};
