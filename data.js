// ============================================================
// data.js — Données initiales & helpers localStorage
// MediCare — Système de gestion de clinique
// ============================================================

const DB_PREFIX = 'medicare_';

function dbGet(key) {
  try { return JSON.parse(localStorage.getItem(DB_PREFIX + key)); } catch { return null; }
}
function dbSet(key, val) {
  localStorage.setItem(DB_PREFIX + key, JSON.stringify(val));
}
function getAll(key) {
  return dbGet(key) || [];
}
function saveAll(key, arr) {
  dbSet(key, arr);
}
function genId(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}
function getYearStr() {
  return new Date().getFullYear().toString();
}

// ============================================================
// SEED DATA
// ============================================================
const SEED = {
  medecins: [
    { id: 'm_001', prenom: 'Karim', nom: 'Benali', specialite: 'Médecine Générale', tel: '0550 12 34 56', email: 'k.benali@clinique.dz', genre: 'M', status: 'Disponible', horaires: '08:00-17:00', jours: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'], experience: '15 ans', consultation: 2000 },
    { id: 'm_002', prenom: 'Amina', nom: 'Hadj', specialite: 'Cardiologie', tel: '0661 23 45 67', email: 'a.hadj@clinique.dz', genre: 'F', status: 'Disponible', horaires: '09:00-16:00', jours: ['Lundi','Mercredi','Vendredi'], experience: '12 ans', consultation: 4000 },
    { id: 'm_003', prenom: 'Youcef', nom: 'Meziane', specialite: 'Pédiatrie', tel: '0770 34 56 78', email: 'y.meziane@clinique.dz', genre: 'M', status: 'Disponible', horaires: '08:30-17:30', jours: ['Lundi','Mardi','Mercredi','Jeudi'], experience: '8 ans', consultation: 2500 },
    { id: 'm_004', prenom: 'Fatima', nom: 'Cherif', specialite: 'Dermatologie', tel: '0555 45 67 89', email: 'f.cherif@clinique.dz', genre: 'F', status: 'Absent', horaires: '10:00-18:00', jours: ['Mardi','Jeudi','Samedi'], experience: '10 ans', consultation: 3500 },
    { id: 'm_005', prenom: 'Rachid', nom: 'Bouzid', specialite: 'Ophtalmologie', tel: '0660 56 78 90', email: 'r.bouzid@clinique.dz', genre: 'M', status: 'Disponible', horaires: '09:00-17:00', jours: ['Lundi','Mercredi','Samedi'], experience: '20 ans', consultation: 3000 },
    { id: 'm_006', prenom: 'Sonia', nom: 'Aissaoui', specialite: 'Gynécologie', tel: '0770 67 89 01', email: 's.aissaoui@clinique.dz', genre: 'F', status: 'Disponible', horaires: '08:00-16:00', jours: ['Lundi','Mardi','Jeudi','Vendredi'], experience: '14 ans', consultation: 3500 },
  ],

  patients: [
    { id: 'p_001', numDossier: 'DZ-2024-001', prenom: 'Mohamed', nom: 'Taleb', dob: '1980-03-15', genre: 'M', tel: '0550 11 22 33', email: 'm.taleb@gmail.com', adresse: '12 Rue des Oliviers, Alger', groupeSanguin: 'A+', mutuelle: 'CNAS', medecinRef: 'm_001', antecedents: 'Hypertension artérielle, Diabète type 2', allergies: 'Pénicilline', traitement: 'Metformine 500mg, Amlodipine 5mg', statut: 'Actif', createdAt: '2024-01-10' },
    { id: 'p_002', numDossier: 'DZ-2024-002', prenom: 'Fatima', nom: 'Benmoussa', dob: '1995-07-22', genre: 'F', tel: '0661 22 33 44', email: 'f.benmoussa@gmail.com', adresse: '7 Cité des Roses, Oran', groupeSanguin: 'O+', mutuelle: 'CASNOS', medecinRef: 'm_006', antecedents: 'Asthme', allergies: 'Aspirine', traitement: 'Ventoline spray', statut: 'Actif', createdAt: '2024-02-15' },
    { id: 'p_003', numDossier: 'DZ-2024-003', prenom: 'Ahmed', nom: 'Khelifi', dob: '1965-11-08', genre: 'M', tel: '0770 33 44 55', email: '', adresse: '34 Boulevard Zighoud Youcef, Constantine', groupeSanguin: 'B+', mutuelle: 'Retraite', medecinRef: 'm_002', antecedents: 'Insuffisance cardiaque, Cholestérol', allergies: '', traitement: 'Bisoprolol 5mg, Atorvastatine', statut: 'Actif', createdAt: '2024-03-01' },
    { id: 'p_004', numDossier: 'DZ-2024-004', prenom: 'Samira', nom: 'Ouali', dob: '2010-05-12', genre: 'F', tel: '0555 44 55 66', email: '', adresse: '5 Cité AADL, Annaba', groupeSanguin: 'AB-', mutuelle: 'CNAS (tuteur)', medecinRef: 'm_003', antecedents: '', allergies: 'Arachides', traitement: '', statut: 'Actif', createdAt: '2024-04-20' },
    { id: 'p_005', numDossier: 'DZ-2024-005', prenom: 'Khaled', nom: 'Messaoud', dob: '1978-09-30', genre: 'M', tel: '0660 55 66 77', email: 'k.messaoud@yahoo.fr', adresse: '89 Rue Ben Mhidi, Sétif', groupeSanguin: 'O-', mutuelle: 'Aucune', medecinRef: 'm_005', antecedents: 'Glaucome', allergies: '', traitement: 'Latanoprost collyre', statut: 'Actif', createdAt: '2024-05-05' },
    { id: 'p_006', numDossier: 'DZ-2024-006', prenom: 'Nadia', nom: 'Hamidi', dob: '1990-12-03', genre: 'F', tel: '0770 66 77 88', email: 'n.hamidi@gmail.com', adresse: '23 Cité El Khaïr, Batna', groupeSanguin: 'A-', mutuelle: 'CNAS', medecinRef: 'm_004', antecedents: 'Eczéma chronique', allergies: 'Latex', traitement: 'Hydrocortisone crème', statut: 'Actif', createdAt: '2024-06-10' },
    { id: 'p_007', numDossier: 'DZ-2024-007', prenom: 'Omar', nom: 'Ferhat', dob: '1955-02-28', genre: 'M', tel: '0550 77 88 99', email: '', adresse: '1 Rue Didouche Mourad, Alger', groupeSanguin: 'B-', mutuelle: 'Retraite', medecinRef: 'm_001', antecedents: 'BPCO, Tabagisme sevré', allergies: '', traitement: 'Symbicort 160/4.5', statut: 'Inactif', createdAt: '2024-07-15' },
    { id: 'p_008', numDossier: 'DZ-2025-008', prenom: 'Yasmine', nom: 'Belhocine', dob: '2000-08-17', genre: 'F', tel: '0661 88 99 00', email: 'y.belhocine@outlook.com', adresse: '45 Cité Soummam, Béjaïa', groupeSanguin: 'O+', mutuelle: 'CNAS', medecinRef: 'm_006', antecedents: 'Migraine', allergies: '', traitement: 'Sumatriptan 50mg (si besoin)', statut: 'Actif', createdAt: '2025-01-08' },
  ],

  rdv: [
    { id: 'r_001', patientId: 'p_001', medecinId: 'm_001', date: getTodayStr(), heure: '09:00', motif: 'Contrôle tension', type: 'Consultation', status: 'Confirmé', notes: '' },
    { id: 'r_002', patientId: 'p_002', medecinId: 'm_006', date: getTodayStr(), heure: '10:30', motif: 'Suivi grossesse', type: 'Consultation', status: 'Présent', notes: '' },
    { id: 'r_003', patientId: 'p_003', medecinId: 'm_002', date: getTodayStr(), heure: '11:00', motif: 'ECG + bilan', type: 'Examen', status: 'En attente', notes: '' },
    { id: 'r_004', patientId: 'p_004', medecinId: 'm_003', date: getTodayStr(), heure: '14:00', motif: 'Vaccination', type: 'Consultation', status: 'Confirmé', notes: '' },
    { id: 'r_005', patientId: 'p_005', medecinId: 'm_005', date: getTodayStr(), heure: '15:30', motif: 'Contrôle pression oculaire', type: 'Consultation', status: 'En attente', notes: '' },
    { id: 'r_006', patientId: 'p_006', medecinId: 'm_004', date: getTodayStr(), heure: '16:00', motif: 'Dermatite de contact', type: 'Consultation', status: 'Annulé', notes: 'Patient a appelé pour annuler' },
    { id: 'r_007', patientId: 'p_007', medecinId: 'm_001', date: addDays(getTodayStr(), 1), heure: '09:30', motif: 'Renouvellement ordonnance', type: 'Consultation', status: 'Confirmé', notes: '' },
    { id: 'r_008', patientId: 'p_008', medecinId: 'm_006', date: addDays(getTodayStr(), 2), heure: '10:00', motif: 'Bilan gynéco annuel', type: 'Consultation', status: 'En attente', notes: '' },
  ],

  consultations: [
    { id: 'c_001', patientId: 'p_001', medecinId: 'm_001', rdvId: null, date: addDays(getTodayStr(), -30), motif: 'Contrôle tension artérielle', diagnostic: 'HTA contrôlée sous traitement', examen: 'TA: 135/85 mmHg, FC: 72 bpm. Examen général sans anomalie.', ordonnance: 'Continuer Amlodipine 5mg 1cp/j\nMetformine 500mg 2cp/j\nContrôle dans 3 mois', notes: '', medecinNom: 'Dr. Benali' },
    { id: 'c_002', patientId: 'p_003', medecinId: 'm_002', rdvId: null, date: addDays(getTodayStr(), -15), motif: 'Suivi cardiologique', diagnostic: 'Insuffisance cardiaque compensée', examen: 'ECG: RSR, pas de trouble du rythme. ETT stable. BNP: 180 pg/mL.', ordonnance: 'Bisoprolol 5mg 1cp/j\nFurosémide 40mg 1cp le matin\nRéduction apport en sel\nContrôle dans 2 mois', notes: 'Conseiller marche quotidienne 30min', medecinNom: 'Dr. Hadj' },
    { id: 'c_003', patientId: 'p_002', medecinId: 'm_006', rdvId: null, date: addDays(getTodayStr(), -7), motif: 'Visite de routine', diagnostic: 'Grossesse 20 SA normale', examen: 'Écho: bébé bien positionné, battements cardiaques normaux. Poids +4kg.', ordonnance: 'Acide folique 5mg/j\nFer + vitamines\nÉchographie morphologique à 22 SA', notes: 'Prochain RDV dans 4 semaines', medecinNom: 'Dr. Aissaoui' },
  ],

  factures: [
    { id: 'f_001', numFacture: 'FAC-2024-001', patientId: 'p_001', medecinId: 'm_001', date: addDays(getTodayStr(), -30), actes: [{ libelle: 'Consultation médecine générale', montant: 2000 }], paiement: 'Espèces', status: 'Payée', notes: '' },
    { id: 'f_002', numFacture: 'FAC-2024-002', patientId: 'p_003', medecinId: 'm_002', date: addDays(getTodayStr(), -15), actes: [{ libelle: 'Consultation cardiologie', montant: 4000 }, { libelle: 'ECG', montant: 1500 }], paiement: 'Chèque', status: 'Payée', notes: '' },
    { id: 'f_003', numFacture: 'FAC-2024-003', patientId: 'p_002', medecinId: 'm_006', date: addDays(getTodayStr(), -7), actes: [{ libelle: 'Consultation gynécologie', montant: 3500 }, { libelle: 'Échographie', montant: 3000 }], paiement: 'Virement', status: 'En attente', notes: 'Remboursement CNAS en cours' },
    { id: 'f_004', numFacture: 'FAC-2025-004', patientId: 'p_005', medecinId: 'm_005', date: addDays(getTodayStr(), -3), actes: [{ libelle: 'Consultation ophtalmologie', montant: 3000 }, { libelle: 'Champ visuel', montant: 2500 }], paiement: 'Espèces', status: 'Payée', notes: '' },
  ],

  tarifs: [
    { id: 't_001', libelle: 'Consultation médecine générale', montant: 2000, categorie: 'Consultation' },
    { id: 't_002', libelle: 'Consultation spécialiste', montant: 3500, categorie: 'Consultation' },
    { id: 't_003', libelle: 'Consultation cardiologie', montant: 4000, categorie: 'Consultation' },
    { id: 't_004', libelle: 'Consultation gynécologie', montant: 3500, categorie: 'Consultation' },
    { id: 't_005', libelle: 'Consultation pédiatrie', montant: 2500, categorie: 'Consultation' },
    { id: 't_006', libelle: 'ECG', montant: 1500, categorie: 'Examen' },
    { id: 't_007', libelle: 'Échographie', montant: 3000, categorie: 'Examen' },
    { id: 't_008', libelle: 'Prise de sang', montant: 500, categorie: 'Examen' },
    { id: 't_009', libelle: 'Radio', montant: 2000, categorie: 'Examen' },
    { id: 't_010', libelle: 'Champ visuel', montant: 2500, categorie: 'Examen' },
    { id: 't_011', libelle: 'Injection / Perfusion', montant: 1000, categorie: 'Acte' },
    { id: 't_012', libelle: 'Vaccination', montant: 800, categorie: 'Acte' },
  ],

  settings: {
    clinique: 'Clinique El Shifa',
    slogan: 'Votre santé, notre priorité',
    adresse: '15 Rue des Martyrs, Alger Centre',
    tel: '023 45 67 89',
    email: 'contact@elshifa.dz',
    fiscal: 'NIS: 00912345678901234',
    horaires: 'Lun-Ven: 08h00-18h00 | Sam: 08h00-14h00',
  },

  users: [
    { id: 'u_admin', username: 'admin', password: 'admin123', role: 'admin', nom: 'Administrateur', prenom: '' },
    { id: 'u_recep', username: 'reception', password: 'recep123', role: 'receptionist', nom: 'Réception', prenom: '' },
  ],
};

// ============================================================
// HELPERS
// ============================================================
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function initDB() {
  const keys = ['medecins', 'patients', 'rdv', 'consultations', 'factures', 'tarifs'];
  keys.forEach(k => {
    if (!dbGet(k)) saveAll(k, SEED[k]);
  });
  if (!dbGet('settings')) dbSet('settings', SEED.settings);
  if (!dbGet('users')) dbSet('users', SEED.users);
}

function resetDB() {
  const keys = ['medecins', 'patients', 'rdv', 'consultations', 'factures', 'tarifs', 'settings', 'users'];
  keys.forEach(k => localStorage.removeItem(DB_PREFIX + k));
  initDB();
}

// Auth helpers
function getSession() { return dbGet('session'); }
function setSession(user) { dbSet('session', user); }
function clearSession() { localStorage.removeItem(DB_PREFIX + 'session'); }
function isLoggedIn() { return !!getSession(); }
