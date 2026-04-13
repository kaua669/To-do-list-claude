/* ============================================================
   TASKFLOW — EXPORTAÇÃO PARA EXCEL
   Arquivo NOVO — não modifica nenhum arquivo existente
   Usa SheetJS (xlsx) via CDN — carregado dinamicamente
   ============================================================ */

const ExportManager = {

  // Carrega a lib SheetJS dinamicamente se ainda não tiver
  async loadXLSX() {
    if (window.XLSX) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  },

  // ── COLETA TODOS OS DADOS ──────────────────────────────
  async collectAllData() {
    const results = { tasks: [], agenda: [], notes: [], habits: [], profile: null, stats: null };
    const errors = [];

    const safe = async (label, fn) => {
      try { return await fn(); }
      catch (e) { errors.push(`${label}: ${e.message}`); return null; }
    };

    const [tasksData, agendaData, notesData, habitsData, profileData, statsData] = await Promise.all([
      safe('Tarefas',   () => API.tasks.list()),
      safe('Agenda',    () => API.agenda.list()),
      safe('Notas',     () => API.notes.list()),
      safe('Hábitos',   () => API.habits.list()),
      safe('Perfil',    () => API.profile.get()),
      safe('Estatíst.', () => API.tools.stats()),
    ]);

    if (tasksData)   results.tasks   = tasksData.tasks   || [];
    if (agendaData)  results.agenda  = agendaData.events || [];
    if (notesData)   results.notes   = notesData.notes   || [];
    if (habitsData)  results.habits  = habitsData.habits || [];
    if (profileData) results.profile = profileData;
    if (statsData)   results.stats   = statsData;

    return { results, errors };
  },

  // ── FORMATA TAREFAS ────────────────────────────────────
  formatTasks(tasks) {
    return tasks.map(t => ({
      'ID':          t.id,
      'Título':      t.title || '',
      'Descrição':   t.description || '',
      'Status':      { pendente: 'Pendente', em_progresso: 'Em Progresso', concluida: 'Concluída' }[t.status] || t.status,
      'Prioridade':  { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[t.priority] || t.priority,
      'Categoria':   t.category || '',
      'Data Limite': t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '',
      'Tags':        (t.tags || []).join(', '),
      'Subtarefas':  (t.subtasks || []).map(s => `${s.done ? '✓' : '○'} ${s.title}`).join(' | '),
      'Criado em':   t.createdAt ? new Date(t.createdAt).toLocaleString('pt-BR') : '',
      'Atualizado':  t.updatedAt ? new Date(t.updatedAt).toLocaleString('pt-BR') : '',
    }));
  },

  // ── FORMATA EVENTOS ────────────────────────────────────
  formatAgenda(events) {
    return events.map(e => ({
      'ID':        e.id,
      'Título':    e.title || '',
      'Descrição': e.description || '',
      'Data':      e.date || '',
      'Início':    e.startTime || '',
      'Fim':       e.endTime || '',
      'Tipo':      e.type || '',
      'Cor':       e.color || '',
      'Recorrência': e.recurring || 'none',
      'Lembrete (min)': e.reminder || 0,
      'Criado em': e.createdAt ? new Date(e.createdAt).toLocaleString('pt-BR') : '',
    }));
  },

  // ── FORMATA NOTAS ──────────────────────────────────────
  formatNotes(notes) {
    return notes.map(n => ({
      'ID':        n.id,
      'Título':    n.title || '',
      'Conteúdo':  n.content || '',
      'Cor':       n.color || '',
      'Fixada':    n.pinned ? 'Sim' : 'Não',
      'Tags':      (n.tags || []).join(', '),
      'Criado em': n.createdAt ? new Date(n.createdAt).toLocaleString('pt-BR') : '',
      'Atualizado': n.updatedAt ? new Date(n.updatedAt).toLocaleString('pt-BR') : '',
    }));
  },

  // ── FORMATA HÁBITOS ────────────────────────────────────
  formatHabits(habits) {
    return habits.map(h => ({
      'ID':           h.id,
      'Título':       h.title || '',
      'Ícone':        h.icon || '',
      'Cor':          h.color || '',
      'Frequência':   h.frequency || 'daily',
      'Sequência atual': h.streak || 0,
      'Dias concluídos': (h.completedDates || []).length,
      'Concluído hoje': h.completedToday ? 'Sim' : 'Não',
      'Criado em':    h.createdAt ? new Date(h.createdAt).toLocaleString('pt-BR') : '',
    }));
  },

  // ── FORMATA RESUMO ─────────────────────────────────────
  formatSummary(profile, stats) {
    const user = profile?.user || {};
    const ov   = stats?.overview || {};
    return [
      { 'Campo': 'Nome',             'Valor': user.name || '' },
      { 'Campo': 'Email',            'Valor': user.email || '' },
      { 'Campo': 'Localização',      'Valor': user.location || '' },
      { 'Campo': 'Pontos',           'Valor': ov.points || 0 },
      { 'Campo': 'Sequência (dias)', 'Valor': ov.streak || 0 },
      { 'Campo': 'Total de Tarefas', 'Valor': ov.totalTasks || 0 },
      { 'Campo': 'Tarefas Concluídas','Valor': ov.completedTasks || 0 },
      { 'Campo': 'Tarefas Pendentes','Valor': ov.pendingTasks || 0 },
      { 'Campo': 'Em Progresso',     'Valor': ov.inProgressTasks || 0 },
      { 'Campo': 'Taxa de Conclusão','Valor': (ov.completionRate || 0) + '%' },
      { 'Campo': 'Total de Eventos', 'Valor': ov.totalEvents || 0 },
      { 'Campo': 'Total de Notas',   'Valor': ov.totalNotes || 0 },
      { 'Campo': 'Total de Hábitos', 'Valor': ov.totalHabits || 0 },
      { 'Campo': 'Hábitos hoje',     'Valor': ov.completedHabitsToday || 0 },
      { 'Campo': 'Exportado em',     'Valor': new Date().toLocaleString('pt-BR') },
    ];
  },

  // ── APLICA ESTILO AO CABEÇALHO ─────────────────────────
  styleSheet(ws, headerColor = '4F46E5') {
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
      if (!cell) continue;
      cell.s = {
        font:    { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill:    { fgColor: { rgb: headerColor } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          bottom: { style: 'medium', color: { rgb: 'FFFFFF' } }
        }
      };
    }
    // Auto column width
    const colWidths = [];
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        const val = cell ? String(cell.v || '') : '';
        colWidths[C] = Math.max(colWidths[C] || 10, Math.min(val.length + 2, 50));
      }
    }
    ws['!cols'] = colWidths.map(w => ({ wch: w }));
    ws['!rows'] = [{ hpt: 22 }]; // header row height
  },

  // ── GERA O XLSX ────────────────────────────────────────
  async export(options = {}) {
    try {
      Utils.toast('Coletando dados...', 'info', 2000);
      await this.loadXLSX();

      const { results, errors } = await this.collectAllData();
      if (errors.length) console.warn('Erros parciais:', errors);

      const wb = XLSX.utils.book_new();
      wb.Props = {
        Title:   'TaskFlow — Exportação de Dados',
        Author:  results.profile?.user?.name || 'TaskFlow',
        Subject: 'Dados exportados do TaskFlow',
        CreatedDate: new Date()
      };

      // ── ABA: Resumo ──
      const summaryData = this.formatSummary(results.profile, results.stats);
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      this.styleSheet(wsSummary, '1E293B');
      XLSX.utils.book_append_sheet(wb, wsSummary, ' Resumo');

      // ── ABA: Tarefas ──
      if (!options.only || options.only === 'tasks') {
        const taskData = this.formatTasks(results.tasks);
        const wsTasks = XLSX.utils.json_to_sheet(taskData.length ? taskData : [{ 'Info': 'Nenhuma tarefa encontrada' }]);
        this.styleSheet(wsTasks, '4F46E5');
        XLSX.utils.book_append_sheet(wb, wsTasks, 'Tarefas');
      }

      // ── ABA: Agenda ──
      if (!options.only || options.only === 'agenda') {
        const agendaData = this.formatAgenda(results.agenda);
        const wsAgenda = XLSX.utils.json_to_sheet(agendaData.length ? agendaData : [{ 'Info': 'Nenhum evento encontrado' }]);
        this.styleSheet(wsAgenda, '0EA5E9');
        XLSX.utils.book_append_sheet(wb, wsAgenda, 'Agenda');
      }

      // ── ABA: Notas ──
      if (!options.only || options.only === 'notes') {
        const notesData = this.formatNotes(results.notes);
        const wsNotes = XLSX.utils.json_to_sheet(notesData.length ? notesData : [{ 'Info': 'Nenhuma nota encontrada' }]);
        this.styleSheet(wsNotes, 'D97706');
        XLSX.utils.book_append_sheet(wb, wsNotes, 'Notas');
      }

      // ── ABA: Hábitos ──
      if (!options.only || options.only === 'habits') {
        const habitsData = this.formatHabits(results.habits);
        const wsHabits = XLSX.utils.json_to_sheet(habitsData.length ? habitsData : [{ 'Info': 'Nenhum hábito encontrado' }]);
        this.styleSheet(wsHabits, '059669');
        XLSX.utils.book_append_sheet(wb, wsHabits, 'Hábitos');
      }

      // ── GERA E FAZ DOWNLOAD ──
      const date = new Date().toISOString().split('T')[0];
      const fileName = `TaskFlow_${date}.xlsx`;
      XLSX.writeFile(wb, fileName);

      Utils.toast(`✅ Arquivo "${fileName}" baixado com sucesso!`, 'success', 4000);
    } catch (err) {
      console.error(err);
      Utils.toast('Erro ao exportar: ' + err.message, 'error');
    }
  },

  // ── ABRE MODAL DE OPÇÕES ────────────────────────────────
  openModal() {
    Utils.openModal('📥 Exportar para Excel', `
      <div style="display:flex;flex-direction:column;gap:20px">

        <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:16px">
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">
            Exporte <strong style="color:var(--text-primary)">todos os seus dados</strong> do TaskFlow para um arquivo Excel (.xlsx) com abas separadas para cada seção.
          </div>
        </div>

        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.08em">O que será exportado</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${[
              ['', 'Resumo',  'Estatísticas gerais do perfil'],
              ['', 'Tarefas', 'Todas as tarefas com status, prioridade e subtarefas'],
              ['', 'Agenda',  'Eventos do calendário com datas e horários'],
              ['', 'Notas',   'Notas com conteúdo completo e tags'],
              ['', 'Hábitos', 'Hábitos com sequência e dias concluídos'],
            ].map(([icon, name, desc]) => `
              <label style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all 0.2s" class="export-option-row">
                <input type="checkbox" data-export="${name.toLowerCase()}" checked
                  style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0" />
                <span style="font-size:16px">${icon}</span>
                <div>
                  <div style="font-size:14px;font-weight:600">${name}</div>
                  <div style="font-size:12px;color:var(--text-muted)">${desc}</div>
                </div>
              </label>`).join('')}
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:4px">
          <button class="btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
          <button class="btn-primary" onclick="ExportManager.confirmExport()" style="gap:8px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Baixar Excel
          </button>
        </div>
      </div>
    `);

    // Hover style on rows
    document.querySelectorAll('.export-option-row').forEach(row => {
      row.addEventListener('mouseenter', () => row.style.background = 'rgba(255,255,255,0.04)');
      row.addEventListener('mouseleave', () => row.style.background = 'transparent');
    });
  },

  confirmExport() {
    Utils.closeModal();
    this.export();
  }
};
