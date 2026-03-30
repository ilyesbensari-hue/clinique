// ============================================================
// app.js — Logique principale MediCare DZ
// ============================================================

// ---- Globals ----
const $ = id => document.getElementById(id);
let currentPage = 'dashboard';
let weekOffset = 0;

const PAGE_TITLES = {
  dashboard: 'Tableau de bord', patients: 'Patients', medecins: 'Médecins',
  rdv: 'Rendez-vous', planning: 'Planning', consultations: 'Consultations',
  facturation: 'Facturation', parametres: 'Paramètres'
};

const JOURS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const HEURES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];

// ============================================================
// AUTH
// ============================================================
function doLogin() {
  const user = $('login-user').value.trim();
  const pass = $('login-pass').value;
  const users = getAll('users');
  const found = users.find(u => u.username === user && u.password === pass);
  if (!found) { $('login-err').classList.add('show'); return; }
  $('login-err').classList.remove('show');
  setSession(found);
  showApp(found);
}

function doLogout() {
  clearSession();
  $('app').classList.add('hidden');
  $('login-screen').classList.remove('hidden');
  $('login-user').value = '';
  $('login-pass').value = '';
}

function showApp(user) {
  $('login-screen').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('sidebar-username').textContent = user.prenom ? user.prenom + ' ' + user.nom : user.nom;
  $('sidebar-role').textContent = user.role === 'admin' ? 'Administrateur' : 'Réceptionniste';
  const initials = (user.prenom || user.nom || 'U').charAt(0).toUpperCase();
  $('sidebar-avatar').textContent = initials;
  updateDate();
  setInterval(updateDate, 60000);
  goPage('dashboard');
}

document.addEventListener('DOMContentLoaded', () => {
  initDB();
  const session = getSession();
  if (session) {
    showApp(session);
  }
  // Enter on login
  [$('login-user'), $('login-pass')].forEach(el => {
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  });
  // Close overlays on backdrop click
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });
});

// ============================================================
// NAVIGATION
// ============================================================
function goPage(id) {
  currentPage = id;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = $('page-' + id);
  if (page) page.classList.add('active');
  const nav = document.querySelector(`[data-page="${id}"]`);
  if (nav) nav.classList.add('active');
  $('page-title').textContent = PAGE_TITLES[id] || id;
  renderPage(id);
}

function renderPage(id) {
  switch(id) {
    case 'dashboard': renderDashboard(); break;
    case 'patients': populatePatientFilters(); renderPatients(); break;
    case 'medecins': populateMedecinFilters(); renderMedecins(); break;
    case 'rdv': populateRDVSelects(); renderRDV(); break;
    case 'planning': populatePlanningFilters(); renderPlanning(); break;
    case 'consultations': populateConsultSelects(); renderConsultations(); break;
    case 'facturation': populateFactureSelects(); renderFacturation(); break;
    case 'parametres': renderParametres(); break;
  }
}

// ============================================================
// HELPERS
// ============================================================
function updateDate() {
  if (!$('topbar-date')) return;
  $('topbar-date').textContent = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

function openModal(id, data) {
  $(id).classList.add('open');
  if (id === 'modal-patient') initPatientModal(data);
  if (id === 'modal-medecin') initMedecinModal(data);
  if (id === 'modal-rdv') initRDVModal(data);
  if (id === 'modal-consultation') initConsultModal(data);
  if (id === 'modal-facture') initFactureModal(data);
}

function closeModal(id) {
  $(id).classList.remove('open');
}

const AVATAR_COLORS = ['av-blue','av-green','av-purple','av-amber','av-teal','av-red'];
function avatarColor(str) {
  if (!str) return 'av-blue';
  let h = 0;
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initials(nom, prenom) {
  return ((prenom||'').charAt(0) + (nom||'').charAt(0)).toUpperCase() || '??';
}
function fullName(p) {
  return p ? `${p.prenom || ''} ${p.nom || ''}`.trim() : '—';
}
function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}
function fmtMoney(n) {
  return Number(n || 0).toLocaleString('fr-DZ') + ' DA';
}
function calcAge(dob) {
  if (!dob) return '—';
  const y = new Date().getFullYear() - parseInt(dob.split('-')[0]);
  return y + ' ans';
}
function getPatient(id) { return getAll('patients').find(p => p.id === id); }
function getMedecin(id) { return getAll('medecins').find(m => m.id === id); }
function medecinName(id) {
  const m = getMedecin(id);
  return m ? `Dr. ${m.prenom} ${m.nom}` : '—';
}

function statusBadge(s) {
  const map = {
    'Présent': 'badge-green', 'Confirmé': 'badge-blue', 'En attente': 'badge-amber',
    'Urgent': 'badge-red', 'Annulé': 'badge-gray', 'Payée': 'badge-green',
    'Annulée': 'badge-gray', 'Disponible': 'badge-green', 'Absent': 'badge-red', 'Congé': 'badge-amber',
    'Actif': 'badge-green', 'Inactif': 'badge-gray'
  };
  return `<span class="badge ${map[s]||'badge-gray'}">${s}</span>`;
}

function avatarHTML(nom, prenom, size = '') {
  const cls = `avatar ${avatarColor(nom)} ${size}`;
  return `<div class="${cls}">${initials(nom, prenom)}</div>`;
}

function ptCell(p, sub) {
  if (!p) return '—';
  return `<div class="pt-cell">${avatarHTML(p.nom, p.prenom)}<div><div class="main">${fullName(p)}</div><div class="sub">${sub || p.numDossier || ''}</div></div></div>`;
}

function updateBadges() {
  const patients = getAll('patients');
  const rdvs = getAll('rdv');
  const today = getTodayStr();
  const pending = rdvs.filter(r => r.date === today && r.status === 'En attente').length;
  $('badge-patients').textContent = patients.length;
  $('badge-rdv').textContent = pending || '';
  $('badge-rdv').style.display = pending ? '' : 'none';
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const today = getTodayStr();
  const rdvs = getAll('rdv');
  const patients = getAll('patients');
  const factures = getAll('factures');
  const medecins = getAll('medecins');
  const consultations = getAll('consultations');

  const todayRDV = rdvs.filter(r => r.date === today);
  const monthStr = new Date().toISOString().slice(0, 7);
  const monthFact = factures.filter(f => f.date && f.date.startsWith(monthStr) && f.status === 'Payée');
  const caMonth = monthFact.reduce((s, f) => s + f.actes.reduce((a, ac) => a + Number(ac.montant), 0), 0);
  const newPatientsMonth = patients.filter(p => p.createdAt && p.createdAt.startsWith(monthStr)).length;

  const session = getSession();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  if ($('welcome-msg')) $('welcome-msg').textContent = `${greeting}, ${session ? session.prenom || session.nom : ''} !`;

  $('dash-metrics').innerHTML = `
    <div class="metric-card blue">
      <div class="metric-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
      <div class="metric-label">RDV aujourd'hui</div>
      <div class="metric-value">${todayRDV.length}</div>
      <div class="metric-sub up">${todayRDV.filter(r => r.status === 'Présent').length} présents · ${todayRDV.filter(r => r.status === 'En attente').length} en attente</div>
    </div>
    <div class="metric-card green">
      <div class="metric-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
      <div class="metric-label">Total patients</div>
      <div class="metric-value">${patients.length}</div>
      <div class="metric-sub up">+${newPatientsMonth} ce mois</div>
    </div>
    <div class="metric-card amber">
      <div class="metric-icon amber"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      <div class="metric-label">CA ce mois</div>
      <div class="metric-value" style="font-size:20px;">${fmtMoney(caMonth)}</div>
      <div class="metric-sub">${monthFact.length} factures payées</div>
    </div>
    <div class="metric-card purple">
      <div class="metric-icon purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div class="metric-label">Médecins actifs</div>
      <div class="metric-value">${medecins.filter(m => m.status === 'Disponible').length}</div>
      <div class="metric-sub">${medecins.length} au total</div>
    </div>
  `;

  // RDV du jour
  const rdvList = todayRDV.slice(0, 6).sort((a, b) => a.heure.localeCompare(b.heure));
  $('dash-rdv-list').innerHTML = rdvList.length ? rdvList.map(r => {
    const p = getPatient(r.patientId);
    return `<div class="rdv-item" onclick="openModal('modal-rdv', getAll('rdv').find(x=>x.id==='${r.id}'))">
      <div class="rdv-time">${r.heure}</div>
      ${avatarHTML(p?.nom||'?', p?.prenom||'', '')}
      <div class="rdv-info">
        <div class="name">${p ? fullName(p) : 'Patient inconnu'}</div>
        <div class="detail">${r.motif} · ${medecinName(r.medecinId)}</div>
      </div>
      ${statusBadge(r.status)}
    </div>`;
  }).join('') : `<div class="empty-state" style="padding:30px 0;"><p>Aucun RDV aujourd'hui</p></div>`;

  // Médecins disponibles
  const dispMeds = medecins.filter(m => m.status === 'Disponible').slice(0, 4);
  $('dash-docs-list').innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">` +
    dispMeds.map(m => `<div class="rdv-item">
      ${avatarHTML(m.nom, m.prenom, '')}
      <div class="rdv-info">
        <div class="name">Dr. ${fullName(m)}</div>
        <div class="detail">${m.specialite} · ${m.horaires || ''}</div>
      </div>
      ${statusBadge(m.status)}
    </div>`).join('') +
    (medecins.filter(m => m.status !== 'Disponible').length > 0 ? `<div style="font-size:12px;color:var(--text3);padding:4px 0;">${medecins.filter(m=>m.status!=='Disponible').length} médecin(s) absent(s) aujourd'hui</div>` : '') +
  `</div>`;

  // Dernières consultations
  const lastConsults = [...consultations].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  $('dash-consults-list').innerHTML = lastConsults.length ? `<div style="display:flex;flex-direction:column;gap:8px;">` +
    lastConsults.map(c => {
      const p = getPatient(c.patientId);
      return `<div class="rdv-item" onclick="viewConsultation('${c.id}')">
        ${avatarHTML(p?.nom||'?', p?.prenom||'')}
        <div class="rdv-info">
          <div class="name">${p ? fullName(p) : '—'}</div>
          <div class="detail">${fmtDate(c.date)} · ${c.motif}</div>
        </div>
      </div>`;
    }).join('') + `</div>` : `<div class="empty-state" style="padding:30px 0;"><p>Aucune consultation</p></div>`;

  // Factures récentes
  const lastFacts = [...factures].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  $('dash-fact-list').innerHTML = lastFacts.length ? `<div style="display:flex;flex-direction:column;gap:8px;">` +
    lastFacts.map(f => {
      const p = getPatient(f.patientId);
      const total = f.actes.reduce((s,a)=>s+Number(a.montant),0);
      return `<div class="rdv-item" onclick="goPage('facturation')">
        ${avatarHTML(p?.nom||'F', p?.prenom||'')}
        <div class="rdv-info">
          <div class="name">${f.numFacture}</div>
          <div class="detail">${p ? fullName(p) : '—'} · ${fmtDate(f.date)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:600;font-size:13px;">${fmtMoney(total)}</div>
          ${statusBadge(f.status)}
        </div>
      </div>`;
    }).join('') + `</div>` : `<div class="empty-state" style="padding:30px 0;"><p>Aucune facture</p></div>`;

  updateBadges();
}

// ============================================================
// PATIENTS
// ============================================================
function populatePatientFilters() {
  const meds = getAll('medecins');
  const sel = $('patient-filter-medecin');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Tous les médecins</option>' +
    meds.map(m => `<option value="${m.id}" ${m.id===cur?'selected':''}>${fullName(m)}</option>`).join('');
}

function renderPatients() {
  let list = [...getAll('patients')];
  const search = ($('patient-search')?.value || '').toLowerCase();
  const medFilter = $('patient-filter-medecin')?.value || '';
  const statusFilter = $('patient-filter-status')?.value || '';

  if (search) list = list.filter(p =>
    fullName(p).toLowerCase().includes(search) ||
    (p.numDossier||'').toLowerCase().includes(search) ||
    (p.tel||'').includes(search)
  );
  if (medFilter) list = list.filter(p => p.medecinRef === medFilter);
  if (statusFilter) list = list.filter(p => p.statut === statusFilter);
  list.sort((a,b) => a.nom.localeCompare(b.nom));

  // Stats
  const all = getAll('patients');
  $('patient-stats').innerHTML = `
    <div class="patient-stat"><div class="metric-icon green" style="width:32px;height:32px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div><div class="val">${all.length}</div><div class="lbl">Total</div></div></div>
    <div class="patient-stat"><div class="metric-icon blue" style="width:32px;height:32px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><div><div class="val">${all.filter(p=>p.statut==='Actif').length}</div><div class="lbl">Actifs</div></div></div>
    <div class="patient-stat"><div class="metric-icon amber" style="width:32px;height:32px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><div><div class="val">${all.filter(p=>p.genre==='F').length}</div><div class="lbl">Femmes</div></div></div>
    <div class="patient-stat"><div class="metric-icon purple" style="width:32px;height:32px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg></div><div><div class="val">${all.filter(p=>p.mutuelle&&p.mutuelle!=='Aucune').length}</div><div class="lbl">Assurés</div></div></div>
  `;

  $('patients-tbody').innerHTML = list.length ? list.map(p => `
    <tr onclick="viewPatient('${p.id}')">
      <td>${ptCell(p)}</td>
      <td style="font-family:monospace;font-size:12px;color:var(--blue-text);">${p.numDossier}</td>
      <td>${calcAge(p.dob)}</td>
      <td>${p.tel || '—'}</td>
      <td>${medecinName(p.medecinRef)}</td>
      <td><span class="badge badge-gray">${p.mutuelle || '—'}</span></td>
      <td>${statusBadge(p.statut || 'Actif')}</td>
      <td><div class="cell-actions" onclick="event.stopPropagation()">
        <button class="btn btn-sm" onclick="viewPatient('${p.id}')">Dossier</button>
        <button class="btn btn-sm" onclick="openModal('modal-patient', getAll('patients').find(x=>x.id==='${p.id}'))">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="deletePatient('${p.id}')">Suppr.</button>
      </div></td>
    </tr>
  `).join('') : `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3);">Aucun patient trouvé</td></tr>`;
}

function initPatientModal(data) {
  const meds = getAll('medecins');
  $('p-medecin-ref').innerHTML = '<option value="">— Aucun —</option>' +
    meds.map(m => `<option value="${m.id}">${fullName(m)} (${m.specialite})</option>`).join('');

  // Populate wilaya select
  $('p-wilaya').innerHTML = '<option value="">— Sélectionner —</option>' +
    WILAYAS_DZ.map(w => `<option value="${w}">${w}</option>`).join('');

  // Populate organisme select
  $('p-organisme').innerHTML = ORGANISMES_ASSURANCE.map(o =>
    `<option value="${o.id}">${o.label} (${o.taux}%)</option>`).join('');

  if (data) {
    $('modal-patient-title').textContent = 'Modifier le patient';
    $('patient-edit-id').value = data.id;
    $('p-prenom').value = data.prenom || '';
    $('p-nom').value = data.nom || '';
    $('p-dob').value = data.dob || '';
    $('p-genre').value = data.genre || 'M';
    $('p-tel').value = data.tel || '';
    $('p-email').value = data.email || '';
    $('p-adresse').value = data.adresse || '';
    $('p-groupe').value = data.groupeSanguin || '';
    $('p-medecin-ref').value = data.medecinRef || '';
    $('p-statut').value = data.statut || 'Actif';
    $('p-antecedents').value = data.antecedents || '';
    $('p-allergies').value = data.allergies || '';
    $('p-traitement').value = data.traitement || '';
    // Algeria fields
    $('p-organisme').value = data.organisme || 'aucun';
    $('p-chifa').value = data.numChifa || '';
    $('p-matricule').value = data.numMatricule || '';
    $('p-type-assure').value = data.typeAssure || 'Assuré principal';
    $('p-type-cas').value = data.typeCas || 'Maladie ordinaire';
    $('p-wilaya').value = data.wilaya || '';
    $('p-commune').value = data.commune || '';
  } else {
    $('modal-patient-title').textContent = 'Nouveau patient';
    $('patient-edit-id').value = '';
    ['p-prenom','p-nom','p-tel','p-email','p-adresse','p-antecedents','p-allergies','p-traitement','p-chifa','p-matricule','p-commune'].forEach(id => $(id).value = '');
    $('p-dob').value = '';
    $('p-genre').value = 'M';
    $('p-groupe').value = '';
    $('p-organisme').value = 'CNAS';
    $('p-type-assure').value = 'Assuré principal';
    $('p-type-cas').value = 'Maladie ordinaire';
    $('p-wilaya').value = '';
    $('p-medecin-ref').value = '';
    $('p-statut').value = 'Actif';
  }
}

function savePatient() {
  const prenom = $('p-prenom').value.trim();
  const nom = $('p-nom').value.trim();
  if (!prenom || !nom) { toast('Prénom et nom obligatoires', 'error'); return; }

  const patients = getAll('patients');
  const editId = $('patient-edit-id').value;
  const obj = {
    prenom, nom,
    dob: $('p-dob').value,
    genre: $('p-genre').value,
    tel: $('p-tel').value,
    email: $('p-email').value,
    adresse: $('p-adresse').value,
    groupeSanguin: $('p-groupe').value,
    organisme: $('p-organisme').value,
    numChifa: $('p-chifa').value.replace(/\s/g,''),
    numMatricule: $('p-matricule').value,
    typeAssure: $('p-type-assure').value,
    typeCas: $('p-type-cas').value,
    wilaya: $('p-wilaya').value,
    commune: $('p-commune').value,
    medecinRef: $('p-medecin-ref').value,
    statut: $('p-statut').value,
    antecedents: $('p-antecedents').value,
    allergies: $('p-allergies').value,
    traitement: $('p-traitement').value,
  };

  if (editId) {
    const i = patients.findIndex(p => p.id === editId);
    if (i >= 0) patients[i] = { ...patients[i], ...obj };
    toast('Patient mis à jour ✓', 'success');
  } else {
    const num = 'DZ-' + new Date().getFullYear() + '-' + String(patients.length + 1).padStart(3, '0');
    patients.push({ id: genId('p'), numDossier: num, createdAt: getTodayStr(), ...obj });
    toast('Patient ajouté ✓', 'success');
  }
  saveAll('patients', patients);
  closeModal('modal-patient');
  renderPatients();
  updateBadges();
}

function deletePatient(id) {
  if (!confirm('Supprimer ce patient ? Cette action est irréversible.')) return;
  saveAll('patients', getAll('patients').filter(p => p.id !== id));
  renderPatients();
  toast('Patient supprimé');
  updateBadges();
}

function viewPatient(id) {
  const p = getPatient(id);
  if (!p) return;
  const consultations = getAll('consultations').filter(c => c.patientId === id);
  const rdvs = getAll('rdv').filter(r => r.patientId === id);
  const factures = getAll('factures').filter(f => f.patientId === id);

  $('modal-patient-detail-title').textContent = `Dossier — ${fullName(p)}`;
  $('modal-patient-detail-body').innerHTML = `
    <div class="patient-detail-header">
      ${avatarHTML(p.nom, p.prenom, 'xl')}
      <div class="patient-detail-info" style="flex:1;">
        <h2>${fullName(p)}</h2>
        <p>${p.numDossier} · ${calcAge(p.dob)} · ${p.genre === 'M' ? 'Masculin' : 'Féminin'}</p>
        <div class="patient-detail-tags">
          ${p.groupeSanguin ? `<span class="badge badge-red">${p.groupeSanguin}</span>` : ''}
          ${statusBadge(p.statut || 'Actif')}
          ${p.organisme && p.organisme !== 'aucun' ? `<span class="badge badge-blue chifa-badge">🏥 ${(ORGANISMES_ASSURANCE.find(o=>o.id===p.organisme)||{label:p.organisme}).label}</span>` : '<span class="badge badge-gray">Sans assurance</span>'}
          ${p.numChifa ? `<span class="badge badge-teal" title="Carte Chifa">🪪 ${formatChifa(p.numChifa)}</span>` : ''}
          ${p.wilaya ? `<span class="badge badge-gray">📍 ${p.wilaya}</span>` : ''}
          ${p.allergies ? `<span class="badge badge-amber">⚠ Allergie: ${p.allergies}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="tabs" id="patient-detail-tabs">
      <div class="tab active" onclick="switchPatientTab('infos', this)">Informations</div>
      <div class="tab" onclick="switchPatientTab('medical', this)">Médical</div>
      <div class="tab" onclick="switchPatientTab('rdv', this)">RDV (${rdvs.length})</div>
      <div class="tab" onclick="switchPatientTab('consults', this)">Consultations (${consultations.length})</div>
      <div class="tab" onclick="switchPatientTab('factures', this)">Factures (${factures.length})</div>
    </div>

    <div id="patient-tab-infos">
      <div class="info-grid">
        <div class="info-item"><label>Téléphone</label><p>${p.tel || '—'}</p></div>
        <div class="info-item"><label>Email</label><p>${p.email || '—'}</p></div>
        <div class="info-item"><label>Adresse</label><p>${p.adresse || '—'}</p></div>
        <div class="info-item"><label>Date de naissance</label><p>${fmtDate(p.dob)}</p></div>
        <div class="info-item"><label>Médecin référent</label><p>${medecinName(p.medecinRef)}</p></div>
        <div class="info-item"><label>Date d'inscription</label><p>${fmtDate(p.createdAt)}</p></div>
      </div>
    </div>
    <div id="patient-tab-medical" style="display:none;">
      <div class="medical-section"><h3>Antécédents médicaux</h3><p style="font-size:13px;line-height:1.7;">${p.antecedents || 'Aucun antécédent renseigné'}</p></div>
      <div class="medical-section"><h3>Allergies</h3><p style="font-size:13px;">${p.allergies || 'Aucune allergie connue'}</p></div>
      <div class="medical-section"><h3>Traitement en cours</h3><p style="font-size:13px;line-height:1.7;">${p.traitement || 'Aucun traitement en cours'}</p></div>
    </div>
    <div id="patient-tab-rdv" style="display:none;">
      ${rdvs.length ? `<div style="display:flex;flex-direction:column;gap:8px;">` + rdvs.slice(-5).reverse().map(r => `
        <div class="rdv-item">
          <div class="rdv-time" style="min-width:90px;font-size:12px;">${fmtDate(r.date)}</div>
          <div class="rdv-info"><div class="name">${r.motif}</div><div class="detail">${medecinName(r.medecinId)} · ${r.heure}</div></div>
          ${statusBadge(r.status)}
        </div>`).join('') + `</div>` : '<p style="color:var(--text3);font-size:13px;">Aucun rendez-vous</p>'}
    </div>
    <div id="patient-tab-consults" style="display:none;">
      ${consultations.length ? `<div class="consult-timeline">` + consultations.slice(-5).reverse().map(c => `
        <div class="consult-item" onclick="viewConsultation('${c.id}')">
          <div class="date">${fmtDate(c.date)} · ${medecinName(c.medecinId)}</div>
          <div class="diag">${c.diagnostic || c.motif}</div>
          <div class="doc">${c.motif}</div>
        </div>`).join('') + `</div>` : '<p style="color:var(--text3);font-size:13px;">Aucune consultation</p>'}
    </div>
    <div id="patient-tab-factures" style="display:none;">
      ${factures.length ? `<div style="display:flex;flex-direction:column;gap:8px;">` + factures.slice(-5).reverse().map(f => {
        const total = f.actes.reduce((s,a)=>s+Number(a.montant),0);
        return `<div class="rdv-item" onclick="viewInvoice('${f.id}')">
          <div class="rdv-time" style="min-width:90px;font-size:12px;">${fmtDate(f.date)}</div>
          <div class="rdv-info"><div class="name">${f.numFacture}</div><div class="detail">${f.actes.map(a=>a.libelle).join(', ')}</div></div>
          <div style="text-align:right;"><div style="font-weight:600;">${fmtMoney(total)}</div>${statusBadge(f.status)}</div>
        </div>`;
      }).join('') + `</div>` : '<p style="color:var(--text3);font-size:13px;">Aucune facture</p>'}
    </div>
  `;

  $('modal-patient-detail-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal('modal-patient-detail')">Fermer</button>
    <button class="btn" onclick="closeModal('modal-patient-detail');openModal('modal-rdv',null);$('rdv-patient').value='${p.id}'">Prendre RDV</button>
    <button class="btn" onclick="closeModal('modal-patient-detail');openModal('modal-consultation',null);$('consult-patient').value='${p.id}'">Nouvelle consultation</button>
    <button class="btn btn-primary" onclick="closeModal('modal-patient-detail');openModal('modal-patient',getPatient('${p.id}'))">Modifier</button>
  `;

  openModal('modal-patient-detail', null);
}

function switchPatientTab(tab, el) {
  ['infos','medical','rdv','consults','factures'].forEach(t => {
    const el = $('patient-tab-' + t);
    if (el) el.style.display = 'none';
  });
  const active = $('patient-tab-' + tab);
  if (active) active.style.display = '';
  document.querySelectorAll('#patient-detail-tabs .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
}

// ============================================================
// MÉDECINS
// ============================================================
function populateMedecinFilters() {
  const specs = [...new Set(getAll('medecins').map(m => m.specialite))].sort();
  const sel = $('medecin-filter-spec');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Toutes spécialités</option>' +
    specs.map(s => `<option value="${s}" ${s===cur?'selected':''}>${s}</option>`).join('');
}

function renderMedecins() {
  let list = [...getAll('medecins')];
  const search = ($('medecin-search')?.value || '').toLowerCase();
  const specFilter = $('medecin-filter-spec')?.value || '';

  if (search) list = list.filter(m => fullName(m).toLowerCase().includes(search) || m.specialite.toLowerCase().includes(search));
  if (specFilter) list = list.filter(m => m.specialite === specFilter);

  $('doctors-grid').innerHTML = list.length ? list.map(m => `
    <div class="doctor-card" onclick="openModal('modal-medecin', getAll('medecins').find(x=>x.id==='${m.id}'))">
      <div class="doctor-card-header">
        ${avatarHTML(m.nom, m.prenom, 'lg')}
        <div class="doctor-card-info">
          <h3>Dr. ${fullName(m)}</h3>
          <p>${m.specialite}</p>
          ${statusBadge(m.status)}
        </div>
      </div>
      <div class="doctor-card-meta">
        ${m.tel ? `<div class="doctor-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 5.07 2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${m.tel}</div>` : ''}
        ${m.horaires ? `<div class="doctor-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${m.horaires}</div>` : ''}
        ${m.experience ? `<div class="doctor-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>${m.experience} d'expérience</div>` : ''}
        ${m.consultation ? `<div class="doctor-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>${fmtMoney(m.consultation)}</div>` : ''}
      </div>
      <div class="doctor-card-footer">
        <div class="doctor-jours">${(m.jours || []).map(j => `<span class="jour-badge">${j.slice(0,3)}</span>`).join('')}</div>
        <div class="cell-actions" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-danger" onclick="deleteMedecin('${m.id}')">Suppr.</button>
        </div>
      </div>
    </div>
  `).join('') : `<div class="empty-state" style="grid-column:1/-1;"><p>Aucun médecin trouvé</p></div>`;
}

function initMedecinModal(data) {
  const jours = JOURS_FR;
  $('med-jours-checks').innerHTML = jours.map(j => `
    <label style="display:flex;align-items:center;gap:5px;font-size:13px;font-weight:normal;cursor:pointer;">
      <input type="checkbox" id="jour-${j}" value="${j}" style="width:14px;height:14px;"> ${j.slice(0,3)}
    </label>
  `).join('');

  if (data) {
    $('modal-medecin-title').textContent = 'Modifier le médecin';
    $('med-edit-id').value = data.id;
    $('med-prenom').value = data.prenom || '';
    $('med-nom').value = data.nom || '';
    $('med-specialite').value = data.specialite || 'Médecine Générale';
    $('med-genre').value = data.genre || 'M';
    $('med-tel').value = data.tel || '';
    $('med-email').value = data.email || '';
    $('med-experience').value = data.experience || '';
    $('med-consultation').value = data.consultation || '';
    $('med-horaires').value = data.horaires || '';
    $('med-status').value = data.status || 'Disponible';
    (data.jours || []).forEach(j => { const el = $('jour-' + j); if (el) el.checked = true; });
  } else {
    $('modal-medecin-title').textContent = 'Nouveau médecin';
    $('med-edit-id').value = '';
    ['med-prenom','med-nom','med-tel','med-email','med-experience','med-consultation','med-horaires'].forEach(id => $(id).value = '');
    $('med-specialite').value = 'Médecine Générale';
    $('med-genre').value = 'M';
    $('med-status').value = 'Disponible';
  }
}

function saveMedecin() {
  const prenom = $('med-prenom').value.trim();
  const nom = $('med-nom').value.trim();
  if (!prenom || !nom) { toast('Prénom et nom obligatoires', 'error'); return; }

  const jours = JOURS_FR.filter(j => { const el = $('jour-' + j); return el && el.checked; });
  const meds = getAll('medecins');
  const editId = $('med-edit-id').value;
  const obj = {
    prenom, nom,
    specialite: $('med-specialite').value,
    genre: $('med-genre').value,
    tel: $('med-tel').value,
    email: $('med-email').value,
    experience: $('med-experience').value,
    consultation: Number($('med-consultation').value) || 0,
    horaires: $('med-horaires').value,
    status: $('med-status').value,
    jours,
  };

  if (editId) {
    const i = meds.findIndex(m => m.id === editId);
    if (i >= 0) meds[i] = { ...meds[i], ...obj };
    toast('Médecin mis à jour ✓', 'success');
  } else {
    meds.push({ id: genId('m'), ...obj });
    toast('Médecin ajouté ✓', 'success');
  }
  saveAll('medecins', meds);
  closeModal('modal-medecin');
  renderMedecins();
}

function deleteMedecin(id) {
  if (!confirm('Supprimer ce médecin ?')) return;
  saveAll('medecins', getAll('medecins').filter(m => m.id !== id));
  renderMedecins();
  toast('Médecin supprimé');
}

// ============================================================
// RDV
// ============================================================
function populateRDVSelects() {
  const patients = getAll('patients').sort((a,b)=>a.nom.localeCompare(b.nom));
  const meds = getAll('medecins');
  const pOpts = '<option value="">— Sélectionner —</option>' + patients.map(p => `<option value="${p.id}">${fullName(p)} (${p.numDossier})</option>`).join('');
  const mOpts = '<option value="">— Sélectionner —</option>' + meds.map(m => `<option value="${m.id}">Dr. ${fullName(m)} — ${m.specialite}</option>`).join('');

  if ($('rdv-patient')) $('rdv-patient').innerHTML = pOpts;
  if ($('rdv-medecin')) $('rdv-medecin').innerHTML = mOpts;

  const sel = $('rdv-filter-medecin');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">Tous les médecins</option>' + meds.map(m => `<option value="${m.id}" ${m.id===cur?'selected':''}>Dr. ${fullName(m)}</option>`).join('');
  }
}

function renderRDV() {
  let list = [...getAll('rdv')];
  const search = ($('rdv-search')?.value || '').toLowerCase();
  const dateFilter = $('rdv-filter-date')?.value || '';
  const medFilter = $('rdv-filter-medecin')?.value || '';
  const statusFilter = $('rdv-filter-status')?.value || '';

  if (search) list = list.filter(r => {
    const p = getPatient(r.patientId);
    return (p && fullName(p).toLowerCase().includes(search)) || r.motif.toLowerCase().includes(search);
  });
  if (dateFilter) list = list.filter(r => r.date === dateFilter);
  if (medFilter) list = list.filter(r => r.medecinId === medFilter);
  if (statusFilter) list = list.filter(r => r.status === statusFilter);
  list.sort((a,b) => (b.date + b.heure).localeCompare(a.date + a.heure));

  $('rdv-tbody').innerHTML = list.length ? list.map(r => {
    const p = getPatient(r.patientId);
    return `<tr onclick="openModal('modal-rdv', getAll('rdv').find(x=>x.id==='${r.id}'))">
      <td>
        <div style="font-weight:600;">${fmtDate(r.date)}</div>
        <div style="font-size:12px;color:var(--blue);font-weight:600;">${r.heure}</div>
      </td>
      <td>${ptCell(p)}</td>
      <td>${medecinName(r.medecinId)}</td>
      <td>${r.motif}</td>
      <td><span class="badge badge-gray">${r.type || 'Consultation'}</span></td>
      <td>${statusBadge(r.status)}</td>
      <td><div class="cell-actions" onclick="event.stopPropagation()">
        <button class="btn btn-sm" onclick="changeRDVStatus('${r.id}', 'Présent')">Présent</button>
        <button class="btn btn-sm" onclick="openModal('modal-rdv', getAll('rdv').find(x=>x.id==='${r.id}'))">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="deleteRDV('${r.id}')">×</button>
      </div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3);">Aucun rendez-vous</td></tr>`;
}

function initRDVModal(data) {
  populateRDVSelects();
  if (data) {
    $('modal-rdv-title').textContent = 'Modifier le rendez-vous';
    $('rdv-edit-id').value = data.id;
    $('rdv-patient').value = data.patientId;
    $('rdv-medecin').value = data.medecinId;
    $('rdv-date').value = data.date;
    $('rdv-heure').value = data.heure;
    $('rdv-type').value = data.type || 'Consultation';
    $('rdv-status').value = data.status;
    $('rdv-motif').value = data.motif;
    $('rdv-notes').value = data.notes || '';
  } else {
    $('modal-rdv-title').textContent = 'Nouveau rendez-vous';
    $('rdv-edit-id').value = '';
    $('rdv-patient').value = '';
    $('rdv-medecin').value = '';
    $('rdv-date').value = getTodayStr();
    $('rdv-heure').value = '09:00';
    $('rdv-type').value = 'Consultation';
    $('rdv-status').value = 'En attente';
    $('rdv-motif').value = '';
    $('rdv-notes').value = '';
  }
}

function saveRDV() {
  const patId = $('rdv-patient').value;
  const medId = $('rdv-medecin').value;
  const motif = $('rdv-motif').value.trim();
  if (!patId || !medId || !motif) { toast('Patient, médecin et motif obligatoires', 'error'); return; }

  const rdvs = getAll('rdv');
  const editId = $('rdv-edit-id').value;
  const obj = {
    patientId: patId, medecinId: medId,
    date: $('rdv-date').value, heure: $('rdv-heure').value,
    type: $('rdv-type').value, status: $('rdv-status').value,
    motif, notes: $('rdv-notes').value
  };

  if (editId) {
    const i = rdvs.findIndex(r => r.id === editId);
    if (i >= 0) rdvs[i] = { ...rdvs[i], ...obj };
    toast('RDV mis à jour ✓', 'success');
  } else {
    rdvs.push({ id: genId('r'), ...obj });
    toast('RDV créé ✓', 'success');
  }
  saveAll('rdv', rdvs);
  closeModal('modal-rdv');
  if (currentPage === 'rdv') renderRDV();
  if (currentPage === 'dashboard') renderDashboard();
  if (currentPage === 'planning') renderPlanning();
  updateBadges();
}

function changeRDVStatus(id, status) {
  const rdvs = getAll('rdv');
  const i = rdvs.findIndex(r => r.id === id);
  if (i >= 0) { rdvs[i].status = status; saveAll('rdv', rdvs); }
  renderRDV();
  updateBadges();
  toast(`Statut mis à jour : ${status}`);
}

function deleteRDV(id) {
  if (!confirm('Supprimer ce rendez-vous ?')) return;
  saveAll('rdv', getAll('rdv').filter(r => r.id !== id));
  renderRDV();
  updateBadges();
  toast('RDV supprimé');
}

// ============================================================
// PLANNING
// ============================================================
function populatePlanningFilters() {
  const meds = getAll('medecins');
  const sel = $('planning-filter-medecin');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Tous les médecins</option>' +
    meds.map(m => `<option value="${m.id}" ${m.id===cur?'selected':''}>Dr. ${fullName(m)}</option>`).join('');
}

function shiftWeek(delta) { weekOffset += delta; renderPlanning(); }

function renderPlanning() {
  const now = new Date();
  now.setDate(now.getDate() + weekOffset * 7);
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));

  const weekDays = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d);
  }

  $('planning-title').textContent = `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const rdvs = getAll('rdv');
  const medFilter = $('planning-filter-medecin')?.value || '';
  const filteredRDV = medFilter ? rdvs.filter(r => r.medecinId === medFilter) : rdvs;
  const today = getTodayStr();
  const FR_DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam'];

  let html = `<table class="planning-tbl"><thead><tr><th style="width:60px;">Heure</th>`;
  weekDays.forEach((d, i) => {
    const dStr = d.toISOString().split('T')[0];
    const isToday = dStr === today;
    html += `<th ${isToday ? 'style="background:var(--blue-bg);color:var(--blue-text);"' : ''}>${FR_DAYS[i]}<br><span style="font-weight:400;letter-spacing:0;">${d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span></th>`;
  });
  html += '</tr></thead><tbody>';

  HEURES.forEach(h => {
    html += `<tr><td class="time-col">${h}</td>`;
    weekDays.forEach(d => {
      const dateStr = d.toISOString().split('T')[0];
      const slots = filteredRDV.filter(r => r.date === dateStr && r.heure === h);
      let cellHtml = '';
      if (slots.length > 0) {
        slots.forEach(s => {
          const p = getPatient(s.patientId);
          const cls = s.status === 'Annulé' ? 'slot-libre' : s.type === 'Chirurgie' ? 'slot-op' : s.type === 'Urgence' ? 'slot-urgent' : 'slot-rdv';
          cellHtml += `<div class="slot ${cls}" onclick="openModal('modal-rdv', getAll('rdv').find(x=>x.id==='${s.id}'))" title="${s.motif}">${p ? initials(p.nom,p.prenom) + ' ' + (p.nom||'') : '?'}</div>`;
        });
      } else {
        cellHtml = `<div class="slot slot-libre" onclick="openModal('modal-rdv',null);$('rdv-date').value='${dateStr}';$('rdv-heure').value='${h}'">+</div>`;
      }
      html += `<td>${cellHtml}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  $('planning-container').innerHTML = html;
}

// ============================================================
// CONSULTATIONS
// ============================================================
function populateConsultSelects() {
  const patients = getAll('patients').sort((a,b)=>a.nom.localeCompare(b.nom));
  const meds = getAll('medecins');
  const pOpts = '<option value="">— Sélectionner —</option>' + patients.map(p => `<option value="${p.id}">${fullName(p)} (${p.numDossier})</option>`).join('');
  const mOpts = '<option value="">— Sélectionner —</option>' + meds.map(m => `<option value="${m.id}">Dr. ${fullName(m)}</option>`).join('');
  if ($('consult-patient')) $('consult-patient').innerHTML = pOpts;
  if ($('consult-medecin')) $('consult-medecin').innerHTML = mOpts;

  const sel = $('consult-filter-medecin');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">Tous les médecins</option>' + meds.map(m => `<option value="${m.id}" ${m.id===cur?'selected':''}>Dr. ${fullName(m)}</option>`).join('');
  }
}

function renderConsultations() {
  let list = [...getAll('consultations')];
  const search = ($('consult-search')?.value || '').toLowerCase();
  const medFilter = $('consult-filter-medecin')?.value || '';

  if (search) list = list.filter(c => {
    const p = getPatient(c.patientId);
    return (p && fullName(p).toLowerCase().includes(search)) || c.motif.toLowerCase().includes(search) || (c.diagnostic||'').toLowerCase().includes(search);
  });
  if (medFilter) list = list.filter(c => c.medecinId === medFilter);
  list.sort((a,b) => b.date.localeCompare(a.date));

  $('consultations-tbody').innerHTML = list.length ? list.map(c => {
    const p = getPatient(c.patientId);
    return `<tr onclick="viewConsultation('${c.id}')">
      <td style="font-weight:500;white-space:nowrap;">${fmtDate(c.date)}</td>
      <td>${ptCell(p)}</td>
      <td>${medecinName(c.medecinId)}</td>
      <td style="max-width:180px;">${c.motif}</td>
      <td style="max-width:200px;color:var(--text2);font-size:12px;">${(c.diagnostic||'—').substring(0,60)}${(c.diagnostic||'').length>60?'…':''}</td>
      <td><div class="cell-actions" onclick="event.stopPropagation()">
        <button class="btn btn-sm" onclick="viewConsultation('${c.id}')">Voir</button>
        <button class="btn btn-sm" onclick="openModal('modal-consultation', getAll('consultations').find(x=>x.id==='${c.id}'))">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="deleteConsultation('${c.id}')">×</button>
      </div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text3);">Aucune consultation</td></tr>`;
}

function initConsultModal(data) {
  populateConsultSelects();
  if (data) {
    $('modal-consultation-title').textContent = 'Modifier la consultation';
    $('consult-edit-id').value = data.id;
    $('consult-patient').value = data.patientId;
    $('consult-medecin').value = data.medecinId;
    $('consult-date').value = data.date;
    $('consult-motif').value = data.motif;
    $('consult-examen').value = data.examen || '';
    $('consult-diagnostic').value = data.diagnostic || '';
    $('consult-ordonnance').value = data.ordonnance || '';
    $('consult-notes').value = data.notes || '';
  } else {
    $('modal-consultation-title').textContent = 'Nouvelle consultation';
    $('consult-edit-id').value = '';
    $('consult-patient').value = '';
    $('consult-medecin').value = '';
    $('consult-date').value = getTodayStr();
    ['consult-motif','consult-examen','consult-diagnostic','consult-ordonnance','consult-notes'].forEach(id => $(id).value = '');
  }
}

function saveConsultation() {
  const patId = $('consult-patient').value;
  const medId = $('consult-medecin').value;
  const motif = $('consult-motif').value.trim();
  if (!patId || !medId || !motif) { toast('Patient, médecin et motif obligatoires', 'error'); return; }

  const consultations = getAll('consultations');
  const editId = $('consult-edit-id').value;
  const obj = {
    patientId: patId, medecinId: medId,
    date: $('consult-date').value, motif,
    examen: $('consult-examen').value,
    diagnostic: $('consult-diagnostic').value,
    ordonnance: $('consult-ordonnance').value,
    notes: $('consult-notes').value,
    medecinNom: medecinName(medId),
  };

  if (editId) {
    const i = consultations.findIndex(c => c.id === editId);
    if (i >= 0) consultations[i] = { ...consultations[i], ...obj };
    toast('Consultation mise à jour ✓', 'success');
  } else {
    consultations.push({ id: genId('c'), ...obj });
    toast('Consultation enregistrée ✓', 'success');
  }
  saveAll('consultations', consultations);
  closeModal('modal-consultation');
  if (currentPage === 'consultations') renderConsultations();
  if (currentPage === 'dashboard') renderDashboard();
}

function viewConsultation(id) {
  const c = getAll('consultations').find(x => x.id === id);
  if (!c) return;
  const p = getPatient(c.patientId);
  $('modal-consult-view-title').textContent = `Consultation du ${fmtDate(c.date)}`;
  $('modal-consult-view-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding:14px;background:var(--blue-bg);border-radius:var(--radius);">
      ${avatarHTML(p?.nom||'?', p?.prenom||'', 'lg')}
      <div>
        <div style="font-weight:600;font-size:15px;">${p ? fullName(p) : '—'}</div>
        <div style="font-size:12px;color:var(--text2);">${medecinName(c.medecinId)} · ${fmtDate(c.date)}</div>
      </div>
    </div>
    ${c.motif ? `<div class="consult-detail-section"><h4>Motif</h4><p>${c.motif}</p></div>` : ''}
    ${c.examen ? `<div class="consult-detail-section"><h4>Examen clinique</h4><p>${c.examen}</p></div>` : ''}
    ${c.diagnostic ? `<div class="consult-detail-section"><h4>Diagnostic</h4><p style="font-weight:500;">${c.diagnostic}</p></div>` : ''}
    ${c.ordonnance ? `<div class="consult-detail-section"><h4>Ordonnance</h4><div class="consult-ordo">${c.ordonnance}</div></div>` : ''}
    ${c.notes ? `<div class="consult-detail-section"><h4>Notes internes</h4><p style="color:var(--text2);">${c.notes}</p></div>` : ''}
  `;
  $('consult-view-edit-btn').onclick = () => {
    closeModal('modal-consult-view');
    openModal('modal-consultation', c);
  };
  openModal('modal-consult-view', null);
}

function deleteConsultation(id) {
  if (!confirm('Supprimer cette consultation ?')) return;
  saveAll('consultations', getAll('consultations').filter(c => c.id !== id));
  renderConsultations();
  toast('Consultation supprimée');
}

// ============================================================
// FACTURATION
// ============================================================
function populateFactureSelects() {
  const patients = getAll('patients').sort((a,b)=>a.nom.localeCompare(b.nom));
  const meds = getAll('medecins');
  const pOpts = '<option value="">— Sélectionner —</option>' + patients.map(p => `<option value="${p.id}">${fullName(p)} (${p.numDossier})</option>`).join('');
  const mOpts = '<option value="">— Aucun —</option>' + meds.map(m => `<option value="${m.id}">Dr. ${fullName(m)}</option>`).join('');
  if ($('fact-patient')) $('fact-patient').innerHTML = pOpts;
  if ($('fact-medecin')) $('fact-medecin').innerHTML = mOpts;
}

function renderFacturation() {
  let list = [...getAll('factures')];
  const search = ($('fact-search')?.value || '').toLowerCase();
  const statusFilter = $('fact-filter-status')?.value || '';

  if (search) list = list.filter(f => {
    const p = getPatient(f.patientId);
    return (f.numFacture||'').toLowerCase().includes(search) || (p && fullName(p).toLowerCase().includes(search));
  });
  if (statusFilter) list = list.filter(f => f.status === statusFilter);
  list.sort((a,b) => b.date.localeCompare(a.date));

  const all = getAll('factures');
  const totalCA = all.reduce((s,f) => s + f.actes.reduce((a,ac)=>a+Number(ac.montant),0), 0);
  const paid = all.filter(f=>f.status==='Payée').reduce((s,f) => s + f.actes.reduce((a,ac)=>a+Number(ac.montant),0), 0);
  const pending = all.filter(f=>f.status==='En attente').reduce((s,f) => s + f.actes.reduce((a,ac)=>a+Number(ac.montant),0), 0);

  $('fact-summary').innerHTML = `
    <div class="fact-metric"><div class="lbl">Total facturé</div><div class="val">${fmtMoney(totalCA)}</div></div>
    <div class="fact-metric"><div class="lbl">Encaissé</div><div class="val" style="color:var(--green)">${fmtMoney(paid)}</div></div>
    <div class="fact-metric"><div class="lbl">En attente</div><div class="val" style="color:var(--amber)">${fmtMoney(pending)}</div></div>
    <div class="fact-metric"><div class="lbl">Factures totales</div><div class="val">${all.length}</div></div>
  `;

  $('fact-tbody').innerHTML = list.length ? list.map(f => {
    const p = getPatient(f.patientId);
    const total = f.actes.reduce((s,a) => s+Number(a.montant), 0);
    return `<tr>
      <td style="font-weight:700;color:var(--blue-text);font-family:monospace;font-size:12px;">${f.numFacture}</td>
      <td>${ptCell(p)}</td>
      <td>${medecinName(f.medecinId)}</td>
      <td>${fmtDate(f.date)}</td>
      <td style="font-size:12px;max-width:160px;color:var(--text2);">${f.actes.map(a=>a.libelle).join(', ').substring(0,50)}${f.actes.length > 1 ? '…' : ''}</td>
      <td style="font-weight:700;">${fmtMoney(total)}</td>
      <td>${f.paiement || '—'}</td>
      <td>${statusBadge(f.status)}</td>
      <td><div class="cell-actions">
        <button class="btn btn-sm" onclick="viewInvoice('${f.id}')">Aperçu</button>
        <button class="btn btn-sm" onclick="openModal('modal-facture', getAll('factures').find(x=>x.id==='${f.id}'))">Modifier</button>
        <button class="btn btn-sm btn-danger" onclick="deleteFacture('${f.id}')">×</button>
      </div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text3);">Aucune facture</td></tr>`;
}

let acteRows = [];
function addActeRow(libelle = '', montant = '') {
  const container = $('fact-actes-container');
  const rowId = 'acte_' + Date.now() + '_' + Math.random().toString(36).slice(2,5);
  const tarifs = getAll('tarifs');
  const tarifOpts = tarifs.map(t => `<option value="${t.montant}" data-lib="${t.libelle}" ${t.libelle===libelle?'selected':''}>${t.libelle} (${t.montant} DA)</option>`).join('');

  const div = document.createElement('div');
  div.className = 'acte-row';
  div.id = rowId;
  div.innerHTML = `
    <select onchange="fillActeAmount(this)" style="padding:8px 10px;font-size:12px;border:1.5px solid var(--border2);border-radius:6px;background:var(--surface);">
      <option value="">Acte libre…</option>${tarifOpts}
    </select>
    <input type="text" placeholder="Libellé acte" value="${libelle}" style="padding:8px 10px;font-size:13px;border:1.5px solid var(--border2);border-radius:6px;font-family:inherit;">
    <input type="number" placeholder="Montant DA" value="${montant}" oninput="updateFactTotal()" style="padding:8px 10px;font-size:13px;border:1.5px solid var(--border2);border-radius:6px;font-family:inherit;">
    <button class="acte-remove" onclick="this.parentElement.remove();updateFactTotal()">×</button>
  `;
  container.appendChild(div);
  updateFactTotal();
}

function fillActeAmount(sel) {
  const row = sel.closest('.acte-row');
  const opt = sel.options[sel.selectedIndex];
  if (opt.value) {
    row.querySelectorAll('input')[0].value = opt.dataset.lib || opt.text.split(' (')[0];
    row.querySelectorAll('input')[1].value = opt.value;
    updateFactTotal();
  }
}

function updateFactTotal() {
  let total = 0;
  document.querySelectorAll('#fact-actes-container .acte-row input[type=number]').forEach(inp => { total += Number(inp.value) || 0; });
  if ($('fact-total-display')) $('fact-total-display').textContent = fmtMoney(total);
  updateTiersPayantCalc(total);
}

function onFactPatientChange() {
  const patId = $('fact-patient').value;
  if (!patId) { if ($('fact-tiers-section')) $('fact-tiers-section').style.display = 'none'; return; }
  const p = getAll('patients').find(x => x.id === patId);
  if (!p || !p.organisme || p.organisme === 'aucun') {
    if ($('fact-tiers-section')) $('fact-tiers-section').style.display = 'none';
    return;
  }
  const org = ORGANISMES_ASSURANCE.find(o => o.id === p.organisme);
  if (!org) return;
  $('fact-tiers-section').style.display = 'block';
  $('fact-tp-organisme').textContent = org.label;
  $('fact-tp-taux').textContent = org.taux + '%';
  $('fact-tp-chifa').textContent = p.numChifa ? formatChifa(p.numChifa) : '—';
  let total = 0;
  document.querySelectorAll('#fact-actes-container .acte-row input[type=number]').forEach(inp => { total += Number(inp.value) || 0; });
  updateTiersPayantCalc(total);
}

function updateTiersPayantCalc(total) {
  if (!$('fact-tiers-section') || $('fact-tiers-section').style.display === 'none') return;
  const patId = $('fact-patient')?.value;
  if (!patId) return;
  const p = getAll('patients').find(x => x.id === patId);
  if (!p || !p.organisme || p.organisme === 'aucun') return;
  const org = ORGANISMES_ASSURANCE.find(o => o.id === p.organisme);
  if (!org) return;
  const partOrg = Math.round(total * org.taux / 100);
  const partPat = total - partOrg;
  $('fact-tp-org-part').textContent = fmtMoney(partOrg);
  $('fact-tp-patient-part').textContent = fmtMoney(partPat);
}

function initFactureModal(data) {
  populateFactureSelects();
  $('fact-actes-container').innerHTML = '';
  if ($('fact-tiers-section')) $('fact-tiers-section').style.display = 'none';
  if (data) {
    $('modal-facture-title').textContent = 'Modifier la facture';
    $('fact-edit-id').value = data.id;
    $('fact-patient').value = data.patientId;
    $('fact-medecin').value = data.medecinId || '';
    $('fact-date').value = data.date;
    $('fact-paiement').value = data.paiement || 'Espèces';
    $('fact-status').value = data.status;
    $('fact-notes').value = data.notes || '';
    data.actes.forEach(a => addActeRow(a.libelle, a.montant));
    onFactPatientChange();
  } else {
    $('modal-facture-title').textContent = 'Nouvelle facture';
    $('fact-edit-id').value = '';
    $('fact-patient').value = '';
    $('fact-medecin').value = '';
    $('fact-date').value = getTodayStr();
    $('fact-paiement').value = 'Espèces';
    $('fact-status').value = 'En attente';
    $('fact-notes').value = '';
    addActeRow();
  }
}

function saveFacture() {
  const patId = $('fact-patient').value;
  if (!patId) { toast('Sélectionnez un patient', 'error'); return; }
  const actes = [];
  document.querySelectorAll('#fact-actes-container .acte-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const libelle = inputs[0].value.trim();
    const montant = Number(inputs[1].value) || 0;
    if (libelle) actes.push({ libelle, montant });
  });
  if (!actes.length) { toast('Ajoutez au moins un acte', 'error'); return; }

  const factures = getAll('factures');
  const editId = $('fact-edit-id').value;
  const p = getAll('patients').find(x => x.id === patId);
  const org = p && p.organisme && p.organisme !== 'aucun' ? ORGANISMES_ASSURANCE.find(o => o.id === p.organisme) : null;
  const total = actes.reduce((s,a) => s + a.montant, 0);
  const tiersPayant = !!org;
  const tauxRembours = org ? org.taux : 0;
  const partOrganisme = tiersPayant ? Math.round(total * tauxRembours / 100) : 0;
  const ticketModerateur = total - partOrganisme;
  const obj = {
    patientId: patId, medecinId: $('fact-medecin').value,
    date: $('fact-date').value, actes,
    paiement: $('fact-paiement').value,
    status: $('fact-status').value,
    notes: $('fact-notes').value,
    tiersPayant, organismeId: p?.organisme || null, tauxRemboursement: tauxRembours,
    partOrganisme, ticketModerateur
  };

  if (editId) {
    const i = factures.findIndex(f => f.id === editId);
    if (i >= 0) factures[i] = { ...factures[i], ...obj };
    toast('Facture mise à jour ✓', 'success');
  } else {
    const year = new Date().getFullYear();
    const num = 'FAC-' + year + '-' + String(factures.length + 1).padStart(3, '0');
    factures.push({ id: genId('f'), numFacture: num, ...obj });
    toast('Facture créée ✓', 'success');
  }
  saveAll('factures', factures);
  closeModal('modal-facture');
  renderFacturation();
}

function deleteFacture(id) {
  if (!confirm('Supprimer cette facture ?')) return;
  saveAll('factures', getAll('factures').filter(f => f.id !== id));
  renderFacturation();
  toast('Facture supprimée');
}

function viewInvoice(id) {
  const f = getAll('factures').find(f => f.id === id);
  if (!f) return;
  const p = getPatient(f.patientId);
  const settings = dbGet('settings') || SEED.settings;
  const total = f.actes.reduce((s,a) => s+Number(a.montant), 0);
  $('invoice-body').innerHTML = `
    <div class="invoice-print">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <div class="inv-logo">${settings.clinique || 'MediCare DZ'}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px;">${settings.adresse||''}</div>
          <div style="font-size:12px;color:var(--text2);">${settings.tel||''} · ${settings.email||''}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px;">${settings.fiscal||''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:800;color:var(--text2);">FACTURE</div>
          <div style="font-size:16px;font-weight:700;margin-top:4px;color:var(--blue);">${f.numFacture}</div>
          <div style="font-size:12px;color:var(--text2);">Date : ${fmtDate(f.date)}</div>
          <div style="margin-top:6px;">${statusBadge(f.status)}</div>
        </div>
      </div>
      <hr class="inv-divider">
      <div style="margin-bottom:18px;padding:14px;background:var(--blue-bg);border-radius:var(--radius);">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text3);margin-bottom:6px;">Facturé à</div>
        <div style="font-weight:700;font-size:15px;">${p ? fullName(p) : '—'}</div>
        <div style="font-size:12px;color:var(--text2);">${p ? (p.numDossier + ' · ' + (p.tel||'')) : ''}</div>
        <div style="font-size:12px;color:var(--text2);">${p ? (p.mutuelle||'') : ''}</div>
      </div>
      <table class="inv-table">
        <thead><tr><th>Acte / Prestation</th><th style="text-align:right;">Montant</th></tr></thead>
        <tbody>${f.actes.map(a => `<tr><td>${a.libelle}</td><td style="text-align:right;font-weight:500;">${fmtMoney(a.montant)}</td></tr>`).join('')}</tbody>
        <tfoot><tr class="inv-total-row"><td>TOTAL</td><td style="text-align:right;">${fmtMoney(total)}</td></tr></tfoot>
      </table>
      ${f.tiersPayant ? (() => {
        const org = ORGANISMES_ASSURANCE.find(o => o.id === f.organismeId);
        return `<div style="margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#166534;margin-bottom:8px;">Tiers payant — Sécurité sociale</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px;">
            <div><div style="color:#6b7280;">Organisme</div><div style="font-weight:600;">${org ? org.label : f.organismeId}</div></div>
            <div><div style="color:#6b7280;">Taux</div><div style="font-weight:600;color:#059669;">${f.tauxRemboursement}%</div></div>
            <div><div style="color:#6b7280;">N° Chifa</div><div style="font-weight:600;font-family:monospace;">${p && p.numChifa ? formatChifa(p.numChifa) : '—'}</div></div>
            <div><div style="color:#6b7280;">Part organisme</div><div style="font-weight:700;color:#2563eb;">${fmtMoney(f.partOrganisme)}</div></div>
            <div><div style="color:#6b7280;">Ticket modérateur</div><div style="font-weight:700;color:#d97706;">${fmtMoney(f.ticketModerateur)}</div></div>
          </div>
        </div>`;
      })() : ''}
      <div style="margin-top:18px;display:flex;justify-content:space-between;font-size:13px;">
        <div>Mode de paiement : <strong>${f.paiement||'—'}</strong></div>
        ${f.notes ? `<div style="color:var(--text2);">Note : ${f.notes}</div>` : ''}
      </div>
      <div style="margin-top:28px;border-top:1px solid var(--border);padding-top:14px;font-size:11px;color:var(--text3);text-align:center;">
        ${settings.clinique} · ${settings.adresse||''} · ${settings.tel||''}
        ${settings.numConventionCNAS ? ` · Conv. CNAS : ${settings.numConventionCNAS}` : ''}
        ${settings.numAgrementSante ? ` · Agrément : ${settings.numAgrementSante}` : ''}<br>
        Merci de votre confiance.
      </div>
    </div>`;
  openModal('modal-invoice', null);
}

// ============================================================
// PARAMÈTRES
// ============================================================
function renderParametres() {
  const s = dbGet('settings') || SEED.settings;
  if ($('cfg-name')) $('cfg-name').value = s.clinique||'';
  if ($('cfg-slogan')) $('cfg-slogan').value = s.slogan||'';
  if ($('cfg-addr')) $('cfg-addr').value = s.adresse||'';
  if ($('cfg-tel')) $('cfg-tel').value = s.tel||'';
  if ($('cfg-fax')) $('cfg-fax').value = s.fax||'';
  if ($('cfg-email')) $('cfg-email').value = s.email||'';
  if ($('cfg-fiscal')) $('cfg-fiscal').value = s.fiscal||'';
  if ($('cfg-rc')) $('cfg-rc').value = s.registreCommerce||'';
  if ($('cfg-horaires')) $('cfg-horaires').value = s.horaires||'';
  if ($('cfg-conv-cnas')) $('cfg-conv-cnas').value = s.numConventionCNAS||'';
  if ($('cfg-conv-casnos')) $('cfg-conv-casnos').value = s.numConventionCASNOS||'';
  if ($('cfg-agrement')) $('cfg-agrement').value = s.numAgrementSante||'';
  // Populate and set wilaya
  if ($('cfg-wilaya')) {
    $('cfg-wilaya').innerHTML = '<option value="">— Sélectionner —</option>' +
      WILAYAS_DZ.map(w => `<option value="${w}" ${w===s.wilaya?'selected':''}>${w}</option>`).join('');
  }
  if ($('clinic-name-sidebar')) $('clinic-name-sidebar').textContent = s.clinique||'Clinique';
  renderTarifsList();
  renderUsersList();
}

function saveSettings() {
  dbSet('settings', {
    clinique: $('cfg-name').value,
    slogan: $('cfg-slogan').value,
    adresse: $('cfg-addr').value,
    wilaya: $('cfg-wilaya').value,
    tel: $('cfg-tel').value,
    fax: $('cfg-fax').value,
    email: $('cfg-email').value,
    fiscal: $('cfg-fiscal').value,
    registreCommerce: $('cfg-rc').value,
    horaires: $('cfg-horaires').value,
    numConventionCNAS: $('cfg-conv-cnas').value,
    numConventionCASNOS: $('cfg-conv-casnos').value,
    numAgrementSante: $('cfg-agrement').value,
  });
  if ($('clinic-name-sidebar')) $('clinic-name-sidebar').textContent = $('cfg-name').value;
  toast('Paramètres enregistrés ✓', 'success');
}

function renderTarifsList() {
  const tarifs = getAll('tarifs');
  const cats = ['Consultation','Examen','Acte','Autre'];
  $('tarifs-list').innerHTML = tarifs.map(t => `
    <div class="tarif-row">
      <input type="text" value="${t.libelle}" id="tarif-lib-${t.id}" placeholder="Libellé"/>
      <select id="tarif-cat-${t.id}" style="padding:8px 8px;font-size:12px;border:1.5px solid var(--border2);border-radius:6px;">
        ${cats.map(c => `<option ${c===t.categorie?'selected':''}>${c}</option>`).join('')}
      </select>
      <input type="number" value="${t.montant}" id="tarif-mt-${t.id}" placeholder="DA"/>
      <button class="btn btn-sm btn-danger" onclick="deleteTarif('${t.id}')">×</button>
    </div>`).join('');
}

function addTarifRow() {
  const tarifs = getAll('tarifs');
  tarifs.push({ id: genId('t'), libelle: 'Nouveau tarif', montant: 1000, categorie: 'Consultation' });
  saveAll('tarifs', tarifs);
  renderTarifsList();
}

function saveTarifs() {
  const tarifs = getAll('tarifs').map(t => ({
    ...t,
    libelle: ($('tarif-lib-'+t.id) ? $('tarif-lib-'+t.id).value : t.libelle),
    categorie: ($('tarif-cat-'+t.id) ? $('tarif-cat-'+t.id).value : t.categorie),
    montant: ($('tarif-mt-'+t.id) ? Number($('tarif-mt-'+t.id).value) : t.montant)
  }));
  saveAll('tarifs', tarifs);
  toast('Tarifs enregistrés ✓', 'success');
}

function deleteTarif(id) {
  saveAll('tarifs', getAll('tarifs').filter(t => t.id !== id));
  renderTarifsList();
}

function renderUsersList() {
  const users = getAll('users');
  $('users-list').innerHTML = users.map(u => `
    <div class="med-item">
      <div class="pt-cell">
        <div class="avatar av-purple">${(u.prenom||u.username||'U').charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:500;">${u.prenom ? u.prenom + ' ' + u.nom : u.username}</div>
          <div style="font-size:12px;color:var(--text3);">${u.username} · ${u.role === 'admin' ? 'Administrateur' : 'Réceptionniste'}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${statusBadge(u.role === 'admin' ? 'Disponible' : 'Confirmé')}
      </div>
    </div>`).join('') || '<p style="color:var(--text2);font-size:13px;">Aucun utilisateur</p>';
}

// ============================================================
// EXPORT / IMPORT
// ============================================================
function exportData() {
  const data = {};
  ['medecins','patients','rdv','consultations','factures','tarifs'].forEach(k => { data[k] = getAll(k); });
  data.settings = dbGet('settings') || SEED.settings;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'medicare_backup_' + getTodayStr() + '.json';
  a.click();
  toast('Export réalisé ✓', 'success');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      ['medecins','patients','rdv','consultations','factures','tarifs'].forEach(k => { if (data[k]) saveAll(k, data[k]); });
      if (data.settings) dbSet('settings', data.settings);
      renderPage(currentPage);
      toast('Import réussi ✓', 'success');
    } catch { toast('Fichier invalide', 'error'); }
  };
  reader.readAsText(file);
}
