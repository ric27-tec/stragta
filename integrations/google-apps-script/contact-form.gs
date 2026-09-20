/**
 * STRAGTA contact form receiver.
 *
 * Script properties required:
 *   STRAGTA_CONTACT_SHEET_ID  Google Sheet that receives accepted enquiries
 * Optional:
 *   STRAGTA_CONTACT_EMAIL     Defaults to stragta0@gmail.com
 *   STRAGTA_CONTACT_SHEET_NAME Defaults to SFORM
 *
 * Deploy as a web app that executes as the owner and accepts public requests.
 */

const FORM_ID = 'stragta-contact-2026';
const RETENTION_DAYS = 180;
const MAX_ACCEPTED_PER_HOUR = 30;

function doPost(event) {
  const params = event && event.parameter ? event.parameter : {};

  // Return the same response for accepted and rejected requests so bots
  // cannot tune themselves against the validation rules.
  if (!isAcceptedSubmission_(params)) return response_();

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return response_();

  try {
    const cache = CacheService.getScriptCache();
    const hourKey = 'accepted:' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
    const acceptedThisHour = Number(cache.get(hourKey) || 0);
    if (acceptedThisHour >= MAX_ACCEPTED_PER_HOUR) return response_();

    const duplicateKey = 'duplicate:' + digest_((params.email || '') + '\n' + (params.message || ''));
    if (cache.get(duplicateKey)) return response_();

    const properties = PropertiesService.getScriptProperties();
    const sheetId = properties.getProperty('STRAGTA_CONTACT_SHEET_ID');
    if (!sheetId) throw new Error('Missing STRAGTA_CONTACT_SHEET_ID script property.');

    const sheetName = properties.getProperty('STRAGTA_CONTACT_SHEET_NAME') || 'SFORM';
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    ensureHeader_(sheet);

    const receivedAt = new Date();
    const row = [
      receivedAt,
      clean_(params.name, 120),
      clean_(params.email, 254),
      clean_(params.company, 160),
      clean_(params.interest, 120),
      clean_(params.message, 4000),
    ];
    sheet.appendRow(row);
    pruneOldRows_(sheet, receivedAt);

    const recipient = properties.getProperty('STRAGTA_CONTACT_EMAIL') || 'stragta0@gmail.com';
    MailApp.sendEmail({
      to: recipient,
      replyTo: row[2],
      subject: 'Nueva consulta STRAGTA: ' + (row[4] || 'Contacto web'),
      body: [
        'Nombre: ' + row[1],
        'Correo: ' + row[2],
        'Empresa: ' + (row[3] || '—'),
        'Interés: ' + (row[4] || '—'),
        '',
        row[5],
      ].join('\n'),
    });

    cache.put(hourKey, String(acceptedThisHour + 1), 3600);
    cache.put(duplicateKey, '1', 21600);
  } finally {
    lock.releaseLock();
  }

  return response_();
}

function isAcceptedSubmission_(params) {
  if (params.website || params.fax_number) return false;
  if (params.form_id !== FORM_ID || params.privacy_acknowledged !== 'yes') return false;

  const startedAt = Number(params.form_started_at);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < 2500 || elapsed > 24 * 60 * 60 * 1000) return false;

  const name = clean_(params.name, 120);
  const email = clean_(params.email, 254);
  const message = clean_(params.message, 4000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;

  return true;
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() !== 0) return;
  sheet.appendRow(['Received at', 'Name', 'Email', 'Company', 'Interest', 'Message']);
  sheet.setFrozenRows(1);
}

function pruneOldRows_(sheet, now) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const dates = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let index = dates.length - 1; index >= 0; index -= 1) {
    const value = dates[index][0];
    if (value instanceof Date && value.getTime() < cutoff) sheet.deleteRow(index + 2);
  }
}

function clean_(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function digest_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(function (byte) {
    const normalized = byte < 0 ? byte + 256 : byte;
    return normalized.toString(16).padStart(2, '0');
  }).join('');
}

function response_() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
