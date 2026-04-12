/* ============================================================
   TASKFLOW — PROFILE PAGE
   ============================================================ */

const ProfilePage = {
  profileData: null,

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    try {
      this.profileData = await API.profile.get();
      this.renderPage();
    } catch (err) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>${err.message}</h3></div>`;
    }
  },

  renderPage() {
    const { user, stats } = this.profileData;
    const content = document.getElementById('page-content');
    const level = Math.floor(stats.points / 100) + 1;
    const levelProgress = stats.points % 100;
    const initials = Utils.initials(user.name);

    const achievements = [
      { icon: '🎯', name: 'Primeiro Passo', desc: '1ª tarefa criada', unlocked: stats.totalTasks >= 1 },
      { icon: '🔥', name: 'Em Chamas', desc: '5 hábitos seguidos', unlocked: stats.totalHabits >= 1 },
      { icon: '⚡', name: 'Velocista', desc: '10 tarefas concluídas', unlocked: stats.completedTasks >= 10 },
      { icon: '📚', name: 'Anotador', desc: '5 notas criadas', unlocked: stats.totalNotes >= 5 },
      { icon: '🗓️', name: 'Agendado', desc: '5 eventos criados', unlocked: stats.totalEvents >= 5 },
      { icon: '💎', name: 'Diamante', desc: '100 tarefas concluídas', unlocked: stats.completedTasks >= 100 },
    ];

    content.innerHTML = `
      <div class="profile-wrap">
        <!-- LEFT CARD -->
        <div>
          <div class="profile-card">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar" id="profile-avatar-el">
                ${user.avatar ? `<img src="${user.avatar}" alt="Avatar"/>` : initials}
              </div>
              <button class="avatar-change-btn" onclick="ProfilePage.changeAvatar()" title="Alterar foto">📷</button>
            </div>

            <div class="profile-name">${Utils.esc(user.name)}</div>
            <div class="profile-email">${Utils.esc(user.email)}</div>
            ${user.bio ? `<div class="profile-bio">${Utils.esc(user.bio)}</div>` : ''}
            ${user.location ? `<div style="font-size:13px;color:var(--text-muted)">📍 ${Utils.esc(user.location)}</div>` : ''}

            <!-- Level -->
            <div class="level-bar" style="width:100%">
              <div class="level-info">
                <span class="level-label">⭐ Nível ${level}</span>
                <span style="font-size:12px;color:var(--text-muted)">${levelProgress}/100 XP</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width:${levelProgress}%;background:var(--accent-3)"></div>
              </div>
            </div>

            <!-- Stats -->
            <div class="profile-stats">
              <div class="profile-stat">
                <div class="profile-stat-val">${stats.completedTasks}</div>
                <div class="profile-stat-lbl">Concluídas</div>
              </div>
              <div class="profile-stat">
                <div class="profile-stat-val">${stats.points}</div>
                <div class="profile-stat-lbl">Pontos</div>
              </div>
              <div class="profile-stat">
                <div class="profile-stat-val">${stats.streak}</div>
                <div class="profile-stat-lbl">Sequência</div>
              </div>
            </div>

            <div class="separator" style="width:100%"></div>

            <!-- Quick stats -->
            <div style="width:100%;display:flex;flex-direction:column;gap:8px">
              ${[
                ['📋 Tarefas totais', stats.totalTasks],
                ['📅 Eventos criados', stats.totalEvents],
                ['📝 Notas', stats.totalNotes],
                ['🔥 Hábitos ativos', stats.totalHabits]
              ].map(([l,v]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px">
                  <span style="color:var(--text-secondary)">${l}</span>
                  <span style="font-weight:600">${v}</span>
                </div>`).join('')}
            </div>

            <button class="btn-danger btn-sm btn-full" onclick="App.logout()">Sair da conta</button>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="profile-right">
          <!-- Edit Profile -->
          <div class="profile-section">
            <h3>✏️ Editar Perfil</h3>
            <div style="display:flex;flex-direction:column;gap:14px">
              <div class="form-row">
                <div class="form-group">
                  <label>Nome</label>
                  <input id="pf-name" value="${Utils.esc(user.name)}" />
                </div>
                <div class="form-group">
                  <label>Telefone</label>
                  <input id="pf-phone" value="${Utils.esc(user.phone||'')}" placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div class="form-group">
                <label>Bio</label>
                <textarea id="pf-bio" placeholder="Conte um pouco sobre você...">${Utils.esc(user.bio||'')}</textarea>
              </div>
              <div class="form-group">
                <label>Localização</label>
                <input id="pf-location" value="${Utils.esc(user.location||'')}" placeholder="Cidade, Estado" />
              </div>
              <div style="display:flex;justify-content:flex-end">
                <button class="btn-primary" onclick="ProfilePage.saveProfile()">💾 Salvar Alterações</button>
              </div>
            </div>
          </div>

          <!-- Change Password -->
          <div class="profile-section">
            <h3>🔒 Alterar Senha</h3>
            <div style="display:flex;flex-direction:column;gap:14px">
              <div class="form-group">
                <label>Senha Atual</label>
                <input type="password" id="pf-cur-pw" placeholder="••••••••" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Nova Senha</label>
                  <input type="password" id="pf-new-pw" placeholder="Mínimo 6 caracteres" />
                </div>
                <div class="form-group">
                  <label>Confirmar Nova Senha</label>
                  <input type="password" id="pf-conf-pw" placeholder="Repita a nova senha" />
                </div>
              </div>
              <div style="display:flex;justify-content:flex-end">
                <button class="btn-primary" onclick="ProfilePage.changePassword()">🔑 Alterar Senha</button>
              </div>
            </div>
          </div>

          <!-- Achievements -->
          <div class="profile-section">
            <h3>🏆 Conquistas</h3>
            <div class="achievement-grid">
              ${achievements.map(a => `
                <div class="achievement ${a.unlocked ? 'unlocked' : 'locked'}">
                  <div class="achievement-icon">${a.icon}</div>
                  <div class="achievement-name">${a.name}</div>
                  <div class="achievement-desc">${a.desc}</div>
                  ${a.unlocked ? '<div style="font-size:10px;color:var(--accent-3);margin-top:4px">✅ Desbloqueado</div>' : '<div style="font-size:10px;color:var(--text-muted);margin-top:4px">🔒 Bloqueado</div>'}
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async saveProfile() {
    try {
      const data = {
        name: document.getElementById('pf-name').value.trim(),
        bio: document.getElementById('pf-bio').value.trim(),
        phone: document.getElementById('pf-phone').value.trim(),
        location: document.getElementById('pf-location').value.trim()
      };
      if (!data.name) { Utils.toast('Nome é obrigatório!', 'warning'); return; }

      const result = await API.profile.update(data);
      // Update sidebar
      document.getElementById('sidebar-name').textContent = data.name;
      document.getElementById('sidebar-avatar').textContent = Utils.initials(data.name);
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('tf_user') || '{}');
      localStorage.setItem('tf_user', JSON.stringify({ ...stored, ...data }));

      Utils.toast('Perfil atualizado!', 'success');
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  async changePassword() {
    const cur = document.getElementById('pf-cur-pw').value;
    const nw = document.getElementById('pf-new-pw').value;
    const conf = document.getElementById('pf-conf-pw').value;

    if (!cur || !nw) { Utils.toast('Preencha todos os campos!', 'warning'); return; }
    if (nw !== conf) { Utils.toast('Senhas não conferem!', 'error'); return; }
    if (nw.length < 6) { Utils.toast('Senha deve ter pelo menos 6 caracteres!', 'warning'); return; }

    try {
      await API.profile.changePassword({ currentPassword: cur, newPassword: nw });
      Utils.toast('Senha alterada com sucesso!', 'success');
      document.getElementById('pf-cur-pw').value = '';
      document.getElementById('pf-new-pw').value = '';
      document.getElementById('pf-conf-pw').value = '';
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  changeAvatar() {
    Utils.openModal('Alterar Foto de Perfil', `
      <div style="display:flex;flex-direction:column;gap:16px">
        <p style="color:var(--text-secondary);font-size:14px">Cole a URL de uma imagem para usar como avatar:</p>
        <div class="form-group">
          <label>URL da Imagem</label>
          <input id="avatar-url" placeholder="https://exemplo.com/foto.jpg" />
        </div>
        <div id="avatar-preview" style="display:none;text-align:center">
          <img style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--accent)" />
        </div>
        <button class="btn-secondary" onclick="document.getElementById('avatar-preview').style.display='block';document.getElementById('avatar-preview').querySelector('img').src=document.getElementById('avatar-url').value">
          👁️ Pré-visualizar
        </button>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
          <button class="btn-primary" onclick="ProfilePage.saveAvatar()">💾 Salvar</button>
        </div>
      </div>
    `);
  },

  async saveAvatar() {
    const url = document.getElementById('avatar-url').value.trim();
    if (!url) return;
    try {
      await API.profile.update({ avatar: url });
      Utils.toast('Avatar atualizado!', 'success');
      Utils.closeModal();
      await this.render();
    } catch (err) { Utils.toast(err.message, 'error'); }
  }
};
