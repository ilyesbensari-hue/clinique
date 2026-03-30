// ============================================================
// server.js — API REST MediCare DZ
// Port: 3001
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'medicare-dz-secret-2025';
const DB_PATH = process.env.DB_PATH || './data/medicare.db';

// Ensure data dir
if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads', { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---- Middleware ----
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, '..')));

// ---- Multer ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ============================================================
// DATABASE INIT
// ============================================================
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nom TEXT, prenom TEXT,
      role TEXT DEFAULT 'receptionist',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medecins (
      id TEXT PRIMARY KEY,
      prenom TEXT NOT NULL, nom TEXT NOT NULL,
      specialite TEXT, genre TEXT DEFAULT 'M',
      tel TEXT, email TEXT,
      experience TEXT, consultation INTEGER DEFAULT 0,
      horaires TEXT, jours TEXT DEFAULT '[]',
      status TEXT DEFAULT 'Disponible',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      num_dossier TEXT UNIQUE,
      prenom TEXT NOT NULL, nom TEXT NOT NULL,
      dob TEXT, genre TEXT DEFAULT 'M',
      tel TEXT, email TEXT, adresse TEXT,
      groupe_sanguin TEXT, mutuelle TEXT DEFAULT 'Aucune',
      medecin_ref TEXT REFERENCES medecins(id),
      antecedents TEXT, allergies TEXT, traitement TEXT,
      statut TEXT DEFAULT 'Actif',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rdv (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      medecin_id TEXT NOT NULL REFERENCES medecins(id),
      date TEXT NOT NULL, heure TEXT NOT NULL,
      motif TEXT, type TEXT DEFAULT 'Consultation',
      status TEXT DEFAULT 'En attente',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      medecin_id TEXT NOT NULL REFERENCES medecins(id),
      rdv_id TEXT REFERENCES rdv(id),
      date TEXT NOT NULL,
      motif TEXT, examen TEXT,
      diagnostic TEXT, ordonnance TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS factures (
      id TEXT PRIMARY KEY,
      num_facture TEXT UNIQUE,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      medecin_id TEXT REFERENCES medecins(id),
      date TEXT NOT NULL,
      actes TEXT DEFAULT '[]',
      paiement TEXT DEFAULT 'Espèces',
      status TEXT DEFAULT 'En attente',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tarifs (
      id TEXT PRIMARY KEY,
      libelle TEXT NOT NULL,
      montant INTEGER DEFAULT 0,
      categorie TEXT DEFAULT 'Consultation'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed admin user
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, username, password, nom, role) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), 'admin', hash, 'Administrateur', 'admin');
    const hash2 = bcrypt.hashSync('recep123', 10);
    db.prepare('INSERT INTO users (id, username, password, nom, role) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), 'reception', hash2, 'Réception', 'receptionist');
  }

  // Seed tarifs
  const tarifExists = db.prepare('SELECT id FROM tarifs LIMIT 1').get();
  if (!tarifExists) {
    const tarifs = [
      ['Consultation médecine générale', 2000, 'Consultation'],
      ['Consultation spécialiste', 3500, 'Consultation'],
      ['Consultation cardiologie', 4000, 'Consultation'],
      ['Consultation gynécologie', 3500, 'Consultation'],
      ['Consultation pédiatrie', 2500, 'Consultation'],
      ['ECG', 1500, 'Examen'],
      ['Échographie', 3000, 'Examen'],
      ['Prise de sang', 500, 'Examen'],
      ['Radio', 2000, 'Examen'],
      ['Injection / Perfusion', 1000, 'Acte'],
      ['Vaccination', 800, 'Acte'],
    ];
    const stmt = db.prepare('INSERT INTO tarifs (id, libelle, montant, categorie) VALUES (?, ?, ?, ?)');
    tarifs.forEach(([lib, mt, cat]) => stmt.run(uuidv4(), lib, mt, cat));
  }
}

initDB();

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// ============================================================
// AUTH ROUTES
// ============================================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, username: user.username, nom: user.nom, prenom: user.prenom, role: user.role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nom, prenom, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ============================================================
// STATS
// ============================================================
app.get('/api/stats', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const monthStr = today.slice(0, 7);
  const todayRDV = db.prepare('SELECT COUNT(*) as c FROM rdv WHERE date = ?').get(today);
  const totalPatients = db.prepare('SELECT COUNT(*) as c FROM patients').get();
  const activeMedecins = db.prepare("SELECT COUNT(*) as c FROM medecins WHERE status = 'Disponible'").get();
  const caMonth = db.prepare("SELECT SUM(json_each.value) as total FROM factures, json_each(actes, '$[*].montant') WHERE status = 'Payée' AND date LIKE ?").get(monthStr + '%');
  res.json({
    todayRDV: todayRDV.c,
    totalPatients: totalPatients.c,
    activeMedecins: activeMedecins.c,
    caMonth: caMonth?.total || 0
  });
});

// ============================================================
// MÉDECINS
// ============================================================
app.get('/api/medecins', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM medecins ORDER BY nom').all();
  res.json(rows.map(m => ({ ...m, jours: JSON.parse(m.jours || '[]') })));
});

app.get('/api/medecins/:id', authMiddleware, (req, res) => {
  const m = db.prepare('SELECT * FROM medecins WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Médecin non trouvé' });
  res.json({ ...m, jours: JSON.parse(m.jours || '[]') });
});

app.post('/api/medecins', authMiddleware, (req, res) => {
  const { prenom, nom, specialite, genre, tel, email, experience, consultation, horaires, jours, status } = req.body;
  if (!prenom || !nom) return res.status(400).json({ error: 'Prénom et nom obligatoires' });
  const id = uuidv4();
  db.prepare('INSERT INTO medecins (id, prenom, nom, specialite, genre, tel, email, experience, consultation, horaires, jours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, prenom, nom, specialite, genre || 'M', tel, email, experience, consultation || 0, horaires, JSON.stringify(jours || []), status || 'Disponible');
  res.status(201).json({ id });
});

app.put('/api/medecins/:id', authMiddleware, (req, res) => {
  const { prenom, nom, specialite, genre, tel, email, experience, consultation, horaires, jours, status } = req.body;
  db.prepare('UPDATE medecins SET prenom=?, nom=?, specialite=?, genre=?, tel=?, email=?, experience=?, consultation=?, horaires=?, jours=?, status=? WHERE id=?').run(prenom, nom, specialite, genre, tel, email, experience, consultation, horaires, JSON.stringify(jours || []), status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/medecins/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM medecins WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// PATIENTS
// ============================================================
app.get('/api/patients', authMiddleware, (req, res) => {
  const { search, medecin, statut } = req.query;
  let q = 'SELECT * FROM patients WHERE 1=1';
  const params = [];
  if (search) { q += ' AND (prenom LIKE ? OR nom LIKE ? OR num_dossier LIKE ? OR tel LIKE ?)'; const s = '%'+search+'%'; params.push(s,s,s,s); }
  if (medecin) { q += ' AND medecin_ref = ?'; params.push(medecin); }
  if (statut) { q += ' AND statut = ?'; params.push(statut); }
  q += ' ORDER BY nom';
  res.json(db.prepare(q).all(...params));
});

app.get('/api/patients/:id', authMiddleware, (req, res) => {
  const p = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Patient non trouvé' });
  res.json(p);
});

app.post('/api/patients', authMiddleware, (req, res) => {
  const { prenom, nom, dob, genre, tel, email, adresse, groupeSanguin, mutuelle, medecinRef, antecedents, allergies, traitement, statut } = req.body;
  if (!prenom || !nom) return res.status(400).json({ error: 'Prénom et nom obligatoires' });
  const id = uuidv4();
  const count = db.prepare('SELECT COUNT(*) as c FROM patients').get().c;
  const num = 'DZ-' + new Date().getFullYear() + '-' + String(count + 1).padStart(3, '0');
  db.prepare('INSERT INTO patients (id, num_dossier, prenom, nom, dob, genre, tel, email, adresse, groupe_sanguin, mutuelle, medecin_ref, antecedents, allergies, traitement, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, num, prenom, nom, dob, genre||'M', tel, email, adresse, groupeSanguin, mutuelle||'Aucune', medecinRef||null, antecedents, allergies, traitement, statut||'Actif');
  res.status(201).json({ id, numDossier: num });
});

app.put('/api/patients/:id', authMiddleware, (req, res) => {
  const { prenom, nom, dob, genre, tel, email, adresse, groupeSanguin, mutuelle, medecinRef, antecedents, allergies, traitement, statut } = req.body;
  db.prepare('UPDATE patients SET prenom=?, nom=?, dob=?, genre=?, tel=?, email=?, adresse=?, groupe_sanguin=?, mutuelle=?, medecin_ref=?, antecedents=?, allergies=?, traitement=?, statut=? WHERE id=?').run(prenom, nom, dob, genre, tel, email, adresse, groupeSanguin, mutuelle, medecinRef||null, antecedents, allergies, traitement, statut, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/patients/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// RDV
// ============================================================
app.get('/api/rdv', authMiddleware, (req, res) => {
  const { date, medecin, status } = req.query;
  let q = 'SELECT * FROM rdv WHERE 1=1';
  const params = [];
  if (date) { q += ' AND date = ?'; params.push(date); }
  if (medecin) { q += ' AND medecin_id = ?'; params.push(medecin); }
  if (status) { q += ' AND status = ?'; params.push(status); }
  q += ' ORDER BY date DESC, heure';
  res.json(db.prepare(q).all(...params));
});

app.post('/api/rdv', authMiddleware, (req, res) => {
  const { patientId, medecinId, date, heure, motif, type, status, notes } = req.body;
  if (!patientId || !medecinId || !motif) return res.status(400).json({ error: 'Champs obligatoires manquants' });
  const id = uuidv4();
  db.prepare('INSERT INTO rdv (id, patient_id, medecin_id, date, heure, motif, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, patientId, medecinId, date, heure, motif, type||'Consultation', status||'En attente', notes||'');
  res.status(201).json({ id });
});

app.put('/api/rdv/:id', authMiddleware, (req, res) => {
  const { patientId, medecinId, date, heure, motif, type, status, notes } = req.body;
  db.prepare('UPDATE rdv SET patient_id=?, medecin_id=?, date=?, heure=?, motif=?, type=?, status=?, notes=? WHERE id=?').run(patientId, medecinId, date, heure, motif, type, status, notes, req.params.id);
  res.json({ ok: true });
});

app.patch('/api/rdv/:id/status', authMiddleware, (req, res) => {
  db.prepare('UPDATE rdv SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/rdv/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM rdv WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// CONSULTATIONS
// ============================================================
app.get('/api/consultations', authMiddleware, (req, res) => {
  const { patient, medecin } = req.query;
  let q = 'SELECT * FROM consultations WHERE 1=1';
  const params = [];
  if (patient) { q += ' AND patient_id = ?'; params.push(patient); }
  if (medecin) { q += ' AND medecin_id = ?'; params.push(medecin); }
  q += ' ORDER BY date DESC';
  res.json(db.prepare(q).all(...params));
});

app.get('/api/consultations/:id', authMiddleware, (req, res) => {
  const c = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Consultation non trouvée' });
  res.json(c);
});

app.post('/api/consultations', authMiddleware, (req, res) => {
  const { patientId, medecinId, rdvId, date, motif, examen, diagnostic, ordonnance, notes } = req.body;
  if (!patientId || !medecinId || !motif) return res.status(400).json({ error: 'Champs obligatoires manquants' });
  const id = uuidv4();
  db.prepare('INSERT INTO consultations (id, patient_id, medecin_id, rdv_id, date, motif, examen, diagnostic, ordonnance, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, patientId, medecinId, rdvId||null, date, motif, examen||'', diagnostic||'', ordonnance||'', notes||'');
  res.status(201).json({ id });
});

app.put('/api/consultations/:id', authMiddleware, (req, res) => {
  const { patientId, medecinId, date, motif, examen, diagnostic, ordonnance, notes } = req.body;
  db.prepare('UPDATE consultations SET patient_id=?, medecin_id=?, date=?, motif=?, examen=?, diagnostic=?, ordonnance=?, notes=? WHERE id=?').run(patientId, medecinId, date, motif, examen, diagnostic, ordonnance, notes, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/consultations/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM consultations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// FACTURES
// ============================================================
app.get('/api/factures', authMiddleware, (req, res) => {
  const { status, patient } = req.query;
  let q = 'SELECT * FROM factures WHERE 1=1';
  const params = [];
  if (status) { q += ' AND status = ?'; params.push(status); }
  if (patient) { q += ' AND patient_id = ?'; params.push(patient); }
  q += ' ORDER BY date DESC';
  const rows = db.prepare(q).all(...params);
  res.json(rows.map(f => ({ ...f, actes: JSON.parse(f.actes || '[]') })));
});

app.post('/api/factures', authMiddleware, (req, res) => {
  const { patientId, medecinId, date, actes, paiement, status, notes } = req.body;
  if (!patientId || !actes?.length) return res.status(400).json({ error: 'Patient et actes obligatoires' });
  const id = uuidv4();
  const count = db.prepare('SELECT COUNT(*) as c FROM factures').get().c;
  const num = 'FAC-' + new Date().getFullYear() + '-' + String(count + 1).padStart(3, '0');
  db.prepare('INSERT INTO factures (id, num_facture, patient_id, medecin_id, date, actes, paiement, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, num, patientId, medecinId||null, date, JSON.stringify(actes), paiement||'Espèces', status||'En attente', notes||'');
  res.status(201).json({ id, numFacture: num });
});

app.put('/api/factures/:id', authMiddleware, (req, res) => {
  const { patientId, medecinId, date, actes, paiement, status, notes } = req.body;
  db.prepare('UPDATE factures SET patient_id=?, medecin_id=?, date=?, actes=?, paiement=?, status=?, notes=? WHERE id=?').run(patientId, medecinId||null, date, JSON.stringify(actes), paiement, status, notes, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/factures/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM factures WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// TARIFS & SETTINGS
// ============================================================
app.get('/api/tarifs', authMiddleware, (req, res) => res.json(db.prepare('SELECT * FROM tarifs ORDER BY categorie, libelle').all()));

app.post('/api/tarifs', authMiddleware, (req, res) => {
  const { libelle, montant, categorie } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO tarifs (id, libelle, montant, categorie) VALUES (?, ?, ?, ?)').run(id, libelle, montant||0, categorie||'Consultation');
  res.status(201).json({ id });
});

app.put('/api/tarifs/:id', authMiddleware, (req, res) => {
  const { libelle, montant, categorie } = req.body;
  db.prepare('UPDATE tarifs SET libelle=?, montant=?, categorie=? WHERE id=?').run(libelle, montant, categorie, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/tarifs/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM tarifs WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/settings', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const result = {};
  rows.forEach(r => { try { result[r.key] = JSON.parse(r.value); } catch { result[r.key] = r.value; } });
  res.json(result);
});

app.put('/api/settings', authMiddleware, (req, res) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  Object.entries(req.body).forEach(([k, v]) => stmt.run(k, JSON.stringify(v)));
  res.json({ ok: true });
});

// Upload
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏥 MediCare DZ API — http://localhost:${PORT}`);
  console.log(`   DB: ${DB_PATH}`);
  console.log(`   Logins: admin/admin123 | reception/recep123\n`);
});
