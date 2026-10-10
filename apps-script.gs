// Google Apps Script — à coller dans script.google.com
// Après modification, créez une nouvelle version dans "Déployer > Gérer les déploiements"

const SPREADSHEET_ID = 'REMPLACER_PAR_VOTRE_ID_SPREADSHEET';

// ── Lecture (appelée au chargement de la page) ────────────────────────────────

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const result = {};

    ['terminaleC', '1S2', '2B', '3A'].forEach(classId => {
      result[classId] = readSheet(ss, classId);
    });

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readSheet(ss, classId) {
  const sheet = ss.getSheetByName(classId);
  if (!sheet || sheet.getLastRow() <= 1) return {};

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  const data = {};
  rows.forEach(row => {
    const id = String(row[2]); // colonne C = N°
    if (id) {
      data[id] = {
        prenom:      String(row[3] || ''),
        nom:         String(row[4] || ''),
        commentaire: String(row[5] || ''),
      };
    }
  });
  return data;
}

// ── Écriture avec merge (champ non-vide entrant gagne, vide conserve l'existant) ──

function doPost(e) {
  try {
    const incoming = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    let sheet = ss.getSheetByName(incoming.classId);
    if (!sheet) sheet = ss.insertSheet(incoming.classId);

    // Lire les données existantes pour le merge
    const existing = readSheet(ss, incoming.classId);

    // Merge : la valeur entrante écrase si non-vide, sinon on conserve l'existante
    const merged = {};
    incoming.rows.forEach(row => {
      const ex = existing[String(row.id)] || {};
      merged[row.id] = {
        prenom:      row.prenom      || ex.prenom      || '',
        nom:         row.nom         || ex.nom         || '',
        commentaire: row.commentaire || ex.commentaire || '',
      };
    });

    // Réécriture complète avec les données mergées
    sheet.clearContents();
    sheet.appendRow(['Classe', 'Mis à jour le', 'N°', 'Prénom', 'Nom', 'Commentaire']);

    const ts = new Date(incoming.timestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
    Object.entries(merged).forEach(([id, f]) => {
      sheet.appendRow([incoming.classe, ts, Number(id), f.prenom, f.nom, f.commentaire]);
    });

    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 6);

    return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('error: ' + err.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// ── Fonctions de test (depuis l'éditeur Apps Script) ──────────────────────────

function testDoGet() {
  const result = doGet({});
  Logger.log(result.getContent());
}

function testDoPost() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        classe: 'Terminale C',
        classId: 'terminaleC',
        timestamp: new Date().toISOString(),
        rows: [
          { id: 1, prenom: 'Jean',  nom: 'Dupont',  commentaire: '' },
          { id: 2, prenom: 'Marie', nom: 'Martin',  commentaire: 'surnommée Mimi' },
          { id: 3, prenom: '',      nom: '',         commentaire: '' },
        ]
      })
    }
  };
  const result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
