/* ============================================================
   TASKFLOW — UTILITIES
   ============================================================ */

const Utils = {
  // Format date
  formatDate(str, opts = {}) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', ...opts });
  },

  formatTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  formatRelative(str) {
    if (!str) return '';
    const diff = Date.now() - new Date(str).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return this.formatDate(str);
  },

  isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date() && !dateStr.includes('T00:00:00.000Z');
  },

  isDueToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  },

  // Get user initials
  initials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  },

  // Priority label in Portuguese
  priorityLabel(p) {
    return { alta: '🔴 Alta', media: '🟡 Média', baixa: '🟢 Baixa' }[p] || p;
  },

  // Category label
  categoryLabel(c) {
    const map = {
      trabalho: '💼 Trabalho', pessoal: '🏠 Pessoal',
      saude: '❤️ Saúde', estudo: '📚 Estudo',
      financeiro: '💰 Finanças', outros: '📌 Outros'
    };
    return map[c] || c;
  },

  // Status label
  statusLabel(s) {
    return { pendente: 'Pendente', em_progresso: 'Em Progresso', concluida: 'Concluída' }[s] || s;
  },

  // Debounce
  debounce(fn, ms = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },

  // Generate a rainbow for charts
  chartColors: ['#6366f1', '#06d6a0', '#f59e0b', '#f43f5e', '#8b5cf6', '#60a5fa'],

  // Count-up animation
  countUp(el, target, duration = 1000) {
    const start = parseInt(el.textContent) || 0;
    const range = target - start;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + range * eased);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },

  // Toast
  toast(msg, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  // Modal
  openModal(title, bodyHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-overlay').classList.add('active');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  // Confirm dialog
  async confirm(msg) {
    return new Promise(resolve => {
      Utils.openModal('Confirmar', `
        <p style="color:var(--text-secondary);margin-bottom:24px">${msg}</p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-secondary btn-sm" onclick="Utils.closeModal();window._confirmResolve(false)">Cancelar</button>
          <button class="btn-danger btn-sm" onclick="Utils.closeModal();window._confirmResolve(true)">Confirmar</button>
        </div>
      `);
      window._confirmResolve = resolve;
    });
  },

  // Format seconds
  formatSeconds(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  // Escape HTML
  esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
