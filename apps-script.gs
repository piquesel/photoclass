// Google Apps Script — à coller dans script.google.com
// Déployez-le comme Web App (voir instructions ci-dessous)

const SPREADSHEET_ID = 'REMPLACER_PAR_VOTRE_ID_SPREADSHEET';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Crée l'onglet si inexistant
    let sheet = ss.getSheetByName(data.classId);
    if (!sheet) sheet = ss.insertSheet(data.classId);

    // Écrase les données existantes (chaque save = snapshot complet)
    sheet.clearContents();
    sheet.appendRow(['Classe', 'Mis à jour le', 'N°', 'Prénom', 'Nom', 'Commentaire']);

    // Formate la date
    const ts = new Date(data.timestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    data.rows.forEach(row => {
      sheet.appendRow([data.classe, ts, row.id, row.prenom, row.nom, row.commentaire || '']);
    });

    // Mise en forme de l'en-tête
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

// Fonction utilitaire pour tester depuis l'éditeur Apps Script
function testDoPost() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        classe: 'Terminale C',
        classId: 'terminaleC',
        timestamp: new Date().toISOString(),
        rows: [
          { id: 1, prenom: 'Jean', nom: 'Dupont' },
          { id: 2, prenom: 'Marie', nom: 'Martin', commentaire: 'surnommée Mimi' },
        ]
      })
    }
  };
  const result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
