/**
 * Google Apps Script — Importação automática de NF-e por e-mail
 * ===============================================================
 * 1) Crie um novo projeto em https://script.google.com/
 * 2) Cole este código.
 * 3) Em "Configurações do projeto" → "Propriedades do Script", adicione:
 *      ENDPOINT = https://dlehrhqfbwvgpurpmmht.supabase.co/functions/v1/nfe-import
 *      TOKEN    = <valor do segredo NFE_IMPORT_TOKEN>
 *      LABEL    = NFe/Importar       (label do Gmail a monitorar)
 *      DONE     = NFe/Importado      (label aplicado após importar)
 * 4) Crie um gatilho (Triggers) para `importarNFes` rodar a cada 5 ou 10 min.
 * 5) Crie os labels no Gmail e adicione um filtro que aplique "NFe/Importar"
 *    aos e-mails com anexo .xml de NF-e.
 */

function importarNFes() {
  const props = PropertiesService.getScriptProperties();
  const ENDPOINT = props.getProperty('ENDPOINT');
  const TOKEN    = props.getProperty('TOKEN');
  const LABEL    = props.getProperty('LABEL') || 'NFe/Importar';
  const DONE     = props.getProperty('DONE')  || 'NFe/Importado';

  if (!ENDPOINT || !TOKEN) throw new Error('Defina ENDPOINT e TOKEN nas Propriedades do Script.');

  const label     = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  const doneLabel = GmailApp.getUserLabelByName(DONE)  || GmailApp.createLabel(DONE);

  const threads = label.getThreads(0, 25);
  Logger.log('Threads encontradas: ' + threads.length);

  threads.forEach((thread) => {
    const xmls = [];
    thread.getMessages().forEach((msg) => {
      msg.getAttachments().forEach((att) => {
        const name = (att.getName() || '').toLowerCase();
        if (name.endsWith('.xml')) {
          xmls.push(att.getDataAsString('UTF-8'));
        }
      });
    });

    if (xmls.length === 0) return;

    const res = UrlFetchApp.fetch(ENDPOINT, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Import-Token': TOKEN },
      payload: JSON.stringify({ xmls: xmls, source: 'gmail:' + LABEL }),
      muteHttpExceptions: true,
    });

    Logger.log(res.getResponseCode() + ' ' + res.getContentText());

    if (res.getResponseCode() === 200) {
      thread.removeLabel(label);
      thread.addLabel(doneLabel);
    }
  });
}
