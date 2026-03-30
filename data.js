// ============================================================
// data.js — MediCare DZ — Données & helpers localStorage
// Adapté au système de santé algérien (CNAS / CASNOS / Chifa)
// ============================================================

const DB_PREFIX = 'medicare_';

function dbGet(key) { try { return JSON.parse(localStorage.getItem(DB_PREFIX + key)); } catch { return null; } }
function dbSet(key, val) { localStorage.setItem(DB_PREFIX + key, JSON.stringify(val)); }
function getAll(key) { return dbGet(key) || []; }
function saveAll(key, arr) { dbSet(key, arr); }
function genId(prefix = 'id') { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }
function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function addDays(dateStr, days) { const d = new Date(dateStr); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]; }

// ============================================================
// RÉFÉRENTIELS ALGÉRIENS
// ============================================================

const WILAYAS_DZ = [
  '01 - Adrar','02 - Chlef','03 - Laghouat','04 - Oum El Bouaghi','05 - Batna',
  '06 - Béjaïa','07 - Biskra','08 - Béchar','09 - Blida','10 - Bouira',
  '11 - Tamanrasset','12 - Tébessa','13 - Tlemcen','14 - Tiaret','15 - Tizi Ouzou',
  '16 - Alger','17 - Djelfa','18 - Jijel','19 - Sétif','20 - Saïda',
  '21 - Skikda','22 - Sidi Bel Abbès','23 - Annaba','24 - Guelma','25 - Constantine',
  '26 - Médéa','27 - Mostaganem','28 - M\'Sila','29 - Mascara','30 - Ouargla',
  '31 - Oran','32 - El Bayadh','33 - Illizi','34 - Bordj Bou Arréridj','35 - Boumerdès',
  '36 - El Tarf','37 - Tindouf','38 - Tissemsilt','39 - El Oued','40 - Khenchela',
  '41 - Souk Ahras','42 - Tipaza','43 - Mila','44 - Aïn Defla','45 - Naâma',
  '46 - Aïn Témouchent','47 - Ghardaïa','48 - Relizane','49 - Timimoun','50 - Bordj Badji Mokhtar',
  '51 - Ouled Djellal','52 - Béni Abbès','53 - In Salah','54 - In Guezzam','55 - Touggourt',
  '56 - Djanet','57 - El M\'Ghair','58 - El Meniaa'
];

// Taux de remboursement CNAS/CASNOS par type de cas
const TAUX_REMBOURSEMENT = {
  'Maladie ordinaire': 80,   // Patient paie 20% (ticket modérateur)
  'ALD (Longue durée)': 100, // Prise en charge totale
  'Accident du travail': 100,
  'Maternité': 100,
  'Invalidité': 80,
  'Sans assurance': 0,
};

const ORGANISMES_ASSURANCE = [
  { id: 'CNAS', label: 'CNAS — Salarié', taux: 80 },
  { id: 'CASNOS', label: 'CASNOS — Non salarié', taux: 80 },
  { id: 'CNAS_ALD', label: 'CNAS — ALD (100%)', taux: 100 },
  { id: 'CASNOS_ALD', label: 'CASNOS — ALD (100%)', taux: 100 },
  { id: 'CNAS_AT', label: 'CNAS — Accident du travail', taux: 100 },
  { id: 'CNAS_MAT', label: 'CNAS — Maternité', taux: 100 },
  { id: 'CMR', label: 'CMR — Retraite militaire', taux: 80 },
  { id: 'FNPOS', label: 'FNPOS — Fonction publique', taux: 80 },
  { id: 'aucun', label: 'Sans assurance', taux: 0 },
];

// ============================================================
// SEED DATA
// ============================================================
const SEED = {
  medecins: [
    { id: 'm_001', prenom: 'Karim', nom: 'Benali', specialite: 'Médecine Générale', tel: '0550 12 34 56', email: 'k.benali@clinique.dz', genre: 'M', status: 'Disponible', horaires: '08:00-17:00', jours: ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'], experience: '15 ans', consultation: 2000, numInscription: 'MED-16-0012', convention: 'CNAS' },
    { id: 'm_002', prenom: 'Amina', nom: 'Hadj', specialite: 'Cardiologie', tel: '0661 23 45 67', email: 'a.hadj@clinique.dz', genre: 'F', status: 'Disponible', horaires: '09:00-16:00', jours: ['Lundi','Mercredi','Vendredi'], experience: '12 ans', consultation: 4000, numInscription: 'MED-16-0234', convention: 'CNAS' },
    { id: 'm_003', prenom: 'Youcef', nom: 'Meziane', specialite: 'Pédiatrie', tel: '0770 34 56 78', email: 'y.meziane@clinique.dz', genre: 'M', status: 'Disponible', horaires: '08:30-17:30', jours: ['Lundi','Mardi','Mercredi','Jeudi'], experience: '8 ans', consultation: 2500, numInscription: 'MED-16-0567', convention: 'CNAS' },
    { id: 'm_004', prenom: 'Fatima', nom: 'Cherif', specialite: 'Dermatologie', tel: '0555 45 67 89', email: 'f.cherif@clinique.dz', genre: 'F', status: 'Absent', horaires: '10:00-18:00', jours: ['Mardi','Jeudi','Samedi'], experience: '10 ans', consultation: 3500, numInscription: 'MED-16-0891', convention: 'CASNOS' },
    { id: 'm_005', prenom: 'Rachid', nom: 'Bouzid', specialite: 'Ophtalmologie', tel: '0660 56 78 90', email: 'r.bouzid@clinique.dz', genre: 'M', status: 'Disponible', horaires: '09:00-17:00', jours: ['Lundi','Mercredi','Samedi'], experience: '20 ans', consultation: 3000, numInscription: 'MED-16-0045', convention: 'CNAS' },
    { id: 'm_006', prenom: 'Sonia', nom: 'Aissaoui', specialite: 'Gynécologie', tel: '0770 67 89 01', email: 's.aissaoui@clinique.dz', genre: 'F', status: 'Disponible', horaires: '08:00-16:00', jours: ['Lundi','Mardi','Jeudi','Vendredi'], experience: '14 ans', consultation: 3500, numInscription: 'MED-16-0312', convention: 'CNAS' },
  ],

  patients: [
    { id: 'p_001', numDossier: 'DZ-2024-001', prenom: 'Mohamed', nom: 'Taleb', dob: '1980-03-15', genre: 'M', tel: '0550 11 22 33', email: 'm.taleb@gmail.com', adresse: '12 Rue des Oliviers', wilaya: '16 - Alger', commune: 'Hussein Dey', groupeSanguin: 'A+', organisme: 'CNAS', numChifa: '12345678901234567890', numMatricule: '80031512345', typeAssure: 'Assuré principal', typeCas: 'Maladie ordinaire', medecinRef: 'm_001', antecedents: 'Hypertension artérielle, Diabète type 2', allergies: 'Pénicilline', traitement: 'Metformine 500mg, Amlodipine 5mg', statut: 'Actif', createdAt: '2024-01-10' },
    { id: 'p_002', numDossier: 'DZ-2024-002', prenom: 'Fatima', nom: 'Benmoussa', dob: '1995-07-22', genre: 'F', tel: '0661 22 33 44', email: 'f.benmoussa@gmail.com', adresse: '7 Cité des Roses', wilaya: '31 - Oran', commune: 'Bir El Djir', groupeSanguin: 'O+', organisme: 'CASNOS', numChifa: '95072298765432100001', numMatricule: '95072298765', typeAssure: 'Assuré principal', typeCas: 'Maternité', medecinRef: 'm_006', antecedents: 'Asthme', allergies: 'Aspirine', traitement: 'Ventoline spray', statut: 'Actif', createdAt: '2024-02-15' },
    { id: 'p_003', numDossier: 'DZ-2024-003', prenom: 'Ahmed', nom: 'Khelifi', dob: '1965-11-08', genre: 'M', tel: '0770 33 44 55', email: '', adresse: '34 Boulevard Zighoud Youcef', wilaya: '25 - Constantine', commune: 'Constantine', groupeSanguin: 'B+', organisme: 'CNAS_ALD', numChifa: '65110812348765001200', numMatricule: '65110812348', typeAssure: 'Assuré principal', typeCas: 'ALD (Longue durée)', medecinRef: 'm_002', antecedents: 'Insuffisance cardiaque, Cholestérol', allergies: '', traitement: 'Bisoprolol 5mg, Atorvastatine', statut: 'Actif', createdAt: '2024-03-01' },
    { id: 'p_004', numDossier: 'DZ-2024-004', prenom: 'Samira', nom: 'Ouali', dob: '2010-05-12', genre: 'F', tel: '0555 44 55 66', email: '', adresse: '5 Cité AADL', wilaya: '23 - Annaba', commune: 'Annaba', groupeSanguin: 'AB-', organisme: 'CNAS', numChifa: '10051299887766554433', numMatricule: '88050145678', typeAssure: 'Ayant droit', typeCas: 'Maladie ordinaire', medecinRef: 'm_003', antecedents: '', allergies: 'Arachides', traitement: '', statut: 'Actif', createdAt: '2024-04-20' },
    { id: 'p_005', numDossier: 'DZ-2024-005', prenom: 'Khaled', nom: 'Messaoud', dob: '1978-09-30', genre: 'M', tel: '0660 55 66 77', email: 'k.messaoud@yahoo.fr', adresse: '89 Rue Ben Mhidi', wilaya: '19 - Sétif', commune: 'Sétif', groupeSanguin: 'O-', organisme: 'aucun', numChifa: '', numMatricule: '', typeAssure: 'Assuré principal', typeCas: 'Sans assurance', medecinRef: 'm_005', antecedents: 'Glaucome', allergies: '', traitement: 'Latanoprost collyre', statut: 'Actif', createdAt: '2024-05-05' },
    { id: 'p_006', numDossier: 'DZ-2024-006', prenom: 'Nadia', nom: 'Hamidi', dob: '1990-12-03', genre: 'F', tel: '0770 66 77 88', email: 'n.hamidi@gmail.com', adresse: '23 Cité El Khaïr', wilaya: '05 - Batna', commune: 'Batna', groupeSanguin: 'A-', organisme: 'FNPOS', numChifa: '90120345678901234500', numMatricule: '90120312345', typeAssure: 'Assuré principal', typeCas: 'Maladie ordinaire', medecinRef: 'm_004', antecedents: 'Eczéma chronique', allergies: 'Latex', traitement: 'Hydrocortisone crème', statut: 'Actif', createdAt: '2024-06-10' },
    { id: 'p_007', numDossier: 'DZ-2024-007', prenom: 'Omar', nom: 'Ferhat', dob: '1955-02-28', genre: 'M', tel: '0550 77 88 99', email: '', adresse: '1 Rue Didouche Mourad', wilaya: '16 - Alger', commune: 'Alger Centre', groupeSanguin: 'B-', organisme: 'CMR', numChifa: '55022812345678901234', numMatricule: '55022812345', typeAssure: 'Assuré principal', typeCas: 'Maladie ordinaire', medecinRef: 'm_001', antecedents: 'BPCO, Tabagisme sevré', allergies: '', traitement: 'Symbicort 160/4.5', statut: 'Inactif', createdAt: '2024-07-15' },
    { id: 'p_008', numDossier: 'DZ-2025-008', prenom: 'Yasmine', nom: 'Belhocine', dob: '2000-08-17', genre: 'F', tel: '0661 88 99 00', email: 'y.belhocine@outlook.com', adresse: '45 Cité Soummam', wilaya: '06 - Béjaïa', commune: 'Béjaïa', groupeSanguin: 'O+', organisme: 'CNAS', numChifa: '00081798765432112345', numMatricule: '00081798765', typeAssure: 'Ayant droit', typeCas: 'Maladie ordinaire', medecinRef: 'm_006', antecedents: 'Migraine', allergies: '', traitement: 'Sumatriptan 50mg (si besoin)', statut: 'Actif', createdAt: '2025-01-08' },
  ],

  rdv: [
    { id: 'r_001', patientId: 'p_001', medecinId: 'm_001', date: getTodayStr(), heure: '09:00', motif: 'Contrôle tension', type: 'Consultation', status: 'Confirmé', notes: '' },
    { id: 'r_002', patientId: 'p_002', medecinId: 'm_006', date: getTodayStr(), heure: '10:30', motif: 'Suivi grossesse', type: 'Consultation', status: 'Présent', notes: '' },
    { id: 'r_003', patientId: 'p_003', medecinId: 'm_002', date: getTodayStr(), heure: '11:00', motif: 'ECG + bilan cardiaque', type: 'Examen', status: 'En attente', notes: '' },
    { id: 'r_004', patientId: 'p_004', medecinId: 'm_003', date: getTodayStr(), heure: '14:00', motif: 'Vaccination', type: 'Consultation', status: 'Confirmé', notes: '' },
    { id: 'r_005', patientId: 'p_005', medecinId: 'm_005', date: getTodayStr(), heure: '15:30', motif: 'Contrôle pression oculaire', type: 'Consultation', status: 'En attente', notes: '' },
    { id: 'r_006', patientId: 'p_006', medecinId: 'm_004', date: getTodayStr(), heure: '16:00', motif: 'Dermatite de contact', type: 'Consultation', status: 'Annulé', notes: 'Patient a annulé' },
    { id: 'r_007', patientId: 'p_007', medecinId: 'm_001', date: addDays(getTodayStr(), 1), heure: '09:30', motif: 'Renouvellement ordonnance', type: 'Consultation', status: 'Confirmé', notes: '' },
    { id: 'r_008', patientId: 'p_008', medecinId: 'm_006', date: addDays(getTodayStr(), 2), heure: '10:00', motif: 'Bilan gynéco annuel', type: 'Consultation', status: 'En attente', notes: '' },
  ],

  consultations: [
    { id: 'c_001', patientId: 'p_001', medecinId: 'm_001', rdvId: null, date: addDays(getTodayStr(), -30), motif: 'Contrôle tension artérielle', diagnostic: 'HTA contrôlée sous traitement', examen: 'TA: 135/85 mmHg, FC: 72 bpm. Examen général sans anomalie.', ordonnance: '- Amlodipine 5mg : 1 comprimé/jour (matin)\n- Metformine 500mg : 2 comprimés/jour (matin et soir)\n- Contrôle dans 3 mois\n\nNon substituable', notes: '', medecinNom: 'Dr. Benali', numOrdonnance: 'ORD-2024-0145' },
    { id: 'c_002', patientId: 'p_003', medecinId: 'm_002', rdvId: null, date: addDays(getTodayStr(), -15), motif: 'Suivi cardiologique', diagnostic: 'Insuffisance cardiaque compensée — ALD n°5', examen: 'ECG: RSR, pas de trouble du rythme. ETT stable. BNP: 180 pg/mL.', ordonnance: '- Bisoprolol 5mg : 1 cp/jour (matin)\n- Furosémide 40mg : 1 cp le matin\n- Réduction apport en sel < 3g/j\n- Contrôle dans 2 mois\n\nPrise en charge ALD 100% — N° prise en charge: PEC-2024-0089', notes: 'Conseiller marche quotidienne 30min', medecinNom: 'Dr. Hadj', numOrdonnance: 'ORD-2024-0289' },
    { id: 'c_003', patientId: 'p_002', medecinId: 'm_006', rdvId: null, date: addDays(getTodayStr(), -7), motif: 'Suivi grossesse', diagnostic: 'Grossesse 20 SA normale — Maternité CNAS 100%', examen: 'Écho: bébé bien positionné, battements cardiaques normaux. Poids maternel +4kg.', ordonnance: '- Acide folique 5mg : 1 cp/jour\n- Fer 80mg + vitamines : 1 cp/jour\n- Échographie morphologique à 22 SA (bon de soin CNAS joint)', notes: 'Prochain RDV dans 4 semaines', medecinNom: 'Dr. Aissaoui', numOrdonnance: 'ORD-2024-0312' },
  ],

  factures: [
    { id: 'f_001', numFacture: 'FAC-2024-001', patientId: 'p_001', medecinId: 'm_001', date: addDays(getTodayStr(), -30), actes: [{ libelle: 'Consultation médecine générale', montant: 2000, codeActe: 'CS' }], paiement: 'Espèces', status: 'Payée', tiersPayant: true, organismeId: 'CNAS', tauxRemboursement: 80, notes: '' },
    { id: 'f_002', numFacture: 'FAC-2024-002', patientId: 'p_003', medecinId: 'm_002', date: addDays(getTodayStr(), -15), actes: [{ libelle: 'Consultation cardiologie', montant: 4000, codeActe: 'CS' }, { libelle: 'ECG', montant: 1500, codeActe: 'ECG' }], paiement: 'Virement CNAS', status: 'Payée', tiersPayant: true, organismeId: 'CNAS_ALD', tauxRemboursement: 100, notes: 'ALD n°5 — Pris en charge à 100%' },
    { id: 'f_003', numFacture: 'FAC-2024-003', patientId: 'p_002', medecinId: 'm_006', date: addDays(getTodayStr(), -7), actes: [{ libelle: 'Consultation gynécologie', montant: 3500, codeActe: 'CS' }, { libelle: 'Échographie obstétricale', montant: 3000, codeActe: 'ECHO' }], paiement: 'CNAS Maternité', status: 'En attente', tiersPayant: true, organismeId: 'CNAS_MAT', tauxRemboursement: 100, notes: 'Bon CNAS Maternité transmis' },
    { id: 'f_004', numFacture: 'FAC-2025-004', patientId: 'p_005', medecinId: 'm_005', date: addDays(getTodayStr(), -3), actes: [{ libelle: 'Consultation ophtalmologie', montant: 3000, codeActe: 'CS' }, { libelle: 'Champ visuel', montant: 2500, codeActe: 'CV' }], paiement: 'Espèces', status: 'Payée', tiersPayant: false, organismeId: 'aucun', tauxRemboursement: 0, notes: 'Patient sans couverture sociale' },
  ],

  tarifs: [
    { id: 't_001', libelle: 'Consultation médecine générale', montant: 2000, codeActe: 'CS', categorie: 'Consultation', remboursable: true },
    { id: 't_002', libelle: 'Consultation spécialiste', montant: 3500, codeActe: 'CS2', categorie: 'Consultation', remboursable: true },
    { id: 't_003', libelle: 'Consultation cardiologie', montant: 4000, codeActe: 'CSC', categorie: 'Consultation', remboursable: true },
    { id: 't_004', libelle: 'Consultation gynécologie', montant: 3500, codeActe: 'CSG', categorie: 'Consultation', remboursable: true },
    { id: 't_005', libelle: 'Consultation pédiatrie', montant: 2500, codeActe: 'CSP', categorie: 'Consultation', remboursable: true },
    { id: 't_006', libelle: 'ECG', montant: 1500, codeActe: 'ECG', categorie: 'Examen', remboursable: true },
    { id: 't_007', libelle: 'Échographie abdominale', montant: 3000, codeActe: 'ECHO', categorie: 'Examen', remboursable: true },
    { id: 't_008', libelle: 'Échographie obstétricale', montant: 3000, codeActe: 'ECHOO', categorie: 'Examen', remboursable: true },
    { id: 't_009', libelle: 'Numération Formule Sanguine (NFS)', montant: 600, codeActe: 'NFS', categorie: 'Biologie', remboursable: true },
    { id: 't_010', libelle: 'Glycémie à jeun', montant: 300, codeActe: 'GLY', categorie: 'Biologie', remboursable: true },
    { id: 't_011', libelle: 'Radio thorax face', montant: 2000, codeActe: 'RTX', categorie: 'Radiologie', remboursable: true },
    { id: 't_012', libelle: 'Champ visuel', montant: 2500, codeActe: 'CV', categorie: 'Examen', remboursable: true },
    { id: 't_013', libelle: 'Injection / Perfusion', montant: 1000, codeActe: 'INJ', categorie: 'Acte', remboursable: false },
    { id: 't_014', libelle: 'Vaccination', montant: 800, codeActe: 'VAC', categorie: 'Acte', remboursable: false },
    { id: 't_015', libelle: 'Pansement simple', montant: 500, codeActe: 'PAN', categorie: 'Acte', remboursable: false },
    { id: 't_016', libelle: 'Électroencéphalogramme (EEG)', montant: 5000, codeActe: 'EEG', categorie: 'Examen', remboursable: true },
  ],

  settings: {
    clinique: 'Clinique El Shifa',
    slogan: 'Votre santé, notre priorité',
    adresse: '15 Rue des Martyrs, Hussein Dey',
    wilaya: '16 - Alger',
    commune: 'Hussein Dey',
    tel: '023 45 67 89',
    fax: '023 45 67 90',
    email: 'contact@elshifa.dz',
    fiscal: 'NIS: 00912345678901234',
    registreCommerce: 'RC N°: 16B0123456',
    horaires: 'Lun-Ven: 08h00-18h00 | Sam: 08h00-14h00',
    numConventionCNAS: 'CONV-CNAS-16-0045',
    numConventionCASNOS: 'CONV-CASNOS-16-0012',
    numAgrementSante: 'AGR-MIN-2020-0567',
    medecinfCachet: 'Dr. Karim BENALI\nMédecin généraliste\nN° Inscription: MED-16-0012\n15 Rue des Martyrs, Alger\nTél: 023 45 67 89',
  },

  users: [
    { id: 'u_admin', username: 'admin', password: 'admin123', role: 'admin', nom: 'Administrateur', prenom: '' },
    { id: 'u_recep', username: 'reception', password: 'recep123', role: 'receptionist', nom: 'Réception', prenom: '' },
  ],
};

// ============================================================
// DB INIT
// ============================================================
function initDB() {
  const keys = ['medecins', 'patients', 'rdv', 'consultations', 'factures', 'tarifs'];
  keys.forEach(k => { if (!dbGet(k)) saveAll(k, SEED[k]); });
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

// Helpers Chifa / assurance
function getOrganisme(id) { return ORGANISMES_ASSURANCE.find(o => o.id === id) || { id: 'aucun', label: 'Sans assurance', taux: 0 }; }
function getTauxRemboursement(organismeId) { return getOrganisme(organismeId).taux; }
function formatChifa(num) {
  if (!num || num.length < 16) return num || '—';
  return num.slice(0,4) + ' ' + num.slice(4,8) + ' ' + num.slice(8,12) + ' ' + num.slice(12,16) + (num.slice(16) ? ' ' + num.slice(16) : '');
}
