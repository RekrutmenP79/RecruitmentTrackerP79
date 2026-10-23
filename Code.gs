/**
 * ============================================================================
 *  Recruitment Portal - PT Padepokan Tujuh Sembilan
 *  Google Apps Script Web App
 * ----------------------------------------------------------------------------
 *  Hasil konversi dari file index_toolsmapping.html.
 *
 *  Routing halaman:
 *    /exec                        -> Home (landing page)
 *    /exec?page=status-reference  -> Reference Check Progress Status
 *    /exec?page=status-mapping    -> Client Mapping Status
 *
 *  File HTML yang dipakai:
 *    Index.html, StatusReference.html, StatusMapping.html,
 *    Styles.html, Header.html, Footer.html, FloatingWhatsApp.html
 * ============================================================================
 */

const CONFIG = {
  PORTAL_NAME: 'Portal Rekrutmen',
  COMPANY_NAME: 'PT Padepokan Tujuh Sembilan',
  COPYRIGHT_YEAR: 2026,

  // URL logo publik (http/https).
  // Alternatif Google Drive: https://drive.google.com/thumbnail?id=FILE_ID&sz=w512
  LOGO_URL: 'https://rekrutmenp79.github.io/EuricaP79/logo.jpg',

  // Opsional: favicon publik. HARUS PNG atau ICO (JPEG tidak didukung).
  // Kosongkan jika tidak perlu.
  FAVICON_URL: '',

  // Nomor WhatsApp format internasional, tanpa "+" dan tanpa spasi.
  WHATSAPP_NUMBER: '6282123758753',
  WHATSAPP_MESSAGE:
    'Halo HC PT Padepokan Tujuh Sembilan, saya ingin bertanya terkait proses rekrutmen.',

  // Kosongkan agar otomatis memakai URL deployment yang sedang aktif.
  // Isi manual hanya jika link antar-halaman yang terbentuk salah.
  WEB_APP_URL: '',

  // Opsional: arahkan ke halaman status eksternal.
  // Kosongkan agar memakai halaman internal di project ini.
  STATUS_REFERENCE_URL: '',
  STATUS_MAPPING_URL: '',

  // ===== Sumber data status kandidat =====
  // Spreadsheet "Reference Check" (gid 288098822).
  STATUS_SPREADSHEET_ID: '1Pkx8MVrhiq5U4FrF5s6JyggxA60HAULbYQD7Xagx8pc',
  STATUS_SHEET_NAME: 'Reference Check',
  STATUS_SHEET_GID: 288098822,

  // Kolom fallback jika header tidak ditemukan.
  // A=1 ... J=10. Di sheet: Email=D, Nama=B, Posisi=C, KEPUTUSAN=J.
  STATUS_EMAIL_COLUMN: 'D',
  STATUS_NAME_COLUMN: 'B',
  STATUS_POSITION_COLUMN: 'C',
  STATUS_DECISION_COLUMN: 'J',

  // ===== Client Mapping =====
  // Spreadsheet "Mapping Talent" (sheet allocation ada di gid 1273631981).
  CLIENT_MAPPING_SPREADSHEET_ID: '1Ay-K_8_Dk4zwaWtnSUcO7QlrOSuHHp29ZIpu8g1G4Zo',
  CLIENT_MAPPING_ALLOCATION_GID: 1273631981,
  CLIENT_MAPPING_ALLOCATION_NAME: '',

  // Sheet yang punya header "Status Progress Client" tetapi bukan perusahaan.
  CLIENT_MAPPING_EXCLUDED_SHEETS: [
    'To Bizdev',
    'Oppty Reference',
    'Riwayat Hidup Internal',
    'Talent Database New',
    'Sheet33',
    'System Analyst',
    'Rekap Client',
    'Allocation management'
  ]
};

const PAGE_TITLES = {
  home: 'Portal Rekrutmen - PT Padepokan Tujuh Sembilan',
  'status-reference': 'Status Progres Reference Check - PT Padepokan Tujuh Sembilan',
  'status-mapping': 'Status Client Mapping - PT Padepokan Tujuh Sembilan'
};

// Alias header (sudah dinormalisasi: huruf kecil, tanpa spasi/simbol).
const STATUS_HEADER_ALIASES = {
  email: ['email', 'emailkandidat', 'alamatemail', 'emailaddress', 'emailpribadi'],
  name: ['namalengkap', 'nama', 'namakandidat', 'kandidat', 'namaapplicant', 'applicant', 'namapeserta'],
  position: ['posisiyangdilamar', 'posisi', 'posisilamar', 'position', 'role'],
  decision: ['keputusan', 'keputusanakhir', 'decision', 'finaldecision', 'statusbgc', 'hasilbgc']
};

// Header sheet allocation (gid 1273631981).
const CLIENT_ALLOCATION_HEADER_ALIASES = {
  name: ['namakandidat', 'nama', 'talentname', 'candidatename'],
  allocation: ['alokasikemanasheet', 'alokasikemana', 'allocation', 'sheet', 'client']
};

// Header sheet perusahaan.
const CLIENT_SHEET_HEADER_ALIASES = {
  name: ['nama', 'namakandidat', 'namalengkap', 'candidate', 'candidatename', 'talentname'],
  role: ['role', 'posisi', 'position'],
  status: ['statusprogressclient', 'statusprogresclient', 'progressclient']
};

/**
 * Entry point Web App.
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  // Dukung juga link lama yang masih memakai ekstensi .html.
  const page = String(params.page || 'home')
    .toLowerCase()
    .trim()
    .replace(/\.html$/, '');

  if (page === 'status-reference') {
    return renderPage_('StatusReference', PAGE_TITLES['status-reference']);
  }

  if (page === 'status-mapping') {
    return renderPage_('StatusMapping', PAGE_TITLES['status-mapping']);
  }

  return renderPage_('Index', PAGE_TITLES.home);
}

/**
 * Merender file HTML sebagai template Apps Script.
 */
function renderPage_(file, title) {
  const output = HtmlService.createTemplateFromFile(file)
    .evaluate()
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  // setFaviconUrl() hanya menerima PNG/ICO. JPEG akan melempar exception.
  if (CONFIG.FAVICON_URL) {
    output.setFaviconUrl(CONFIG.FAVICON_URL);
  }

  return output;
}

/**
 * Dipakai di dalam template: <?!= include('Header') ?>
 */
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

/* ============================== URL HELPER ============================== */

function getBaseUrl_() {
  if (CONFIG.WEB_APP_URL) {
    return String(CONFIG.WEB_APP_URL).replace(/\/+$/, '');
  }

  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (err) {
    return '';
  }
}

function getHomeUrl_() {
  return getBaseUrl_() || '?page=home';
}

function getStatusUrl_(type) {
  if (type === 'reference' && CONFIG.STATUS_REFERENCE_URL) {
    return CONFIG.STATUS_REFERENCE_URL;
  }

  if (type === 'mapping' && CONFIG.STATUS_MAPPING_URL) {
    return CONFIG.STATUS_MAPPING_URL;
  }

  const page = type === 'reference' ? 'status-reference' : 'status-mapping';
  return getBaseUrl_() + '?page=' + page;
}

function getLogoUrl_() {
  return CONFIG.LOGO_URL;
}

function getPortalName_() {
  return CONFIG.PORTAL_NAME;
}

function getCompanyName_() {
  return CONFIG.COMPANY_NAME;
}

function getCopyrightYear_() {
  return CONFIG.COPYRIGHT_YEAR;
}

function getWhatsAppUrl_() {
  return (
    'https://wa.me/' +
    CONFIG.WHATSAPP_NUMBER +
    '?text=' +
    encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)
  );
}

/* ============================ STATUS LOOKUP ============================ */

/**
 * Dipanggil dari halaman status lewat google.script.run.
 *
 * Input : email kandidat
 * Output: { ok, found, name, position, status, decision }
 *
 * Hanya data minimum yang dikembalikan (tanpa skor / data internal lain).
 */
function getCandidateStatusByEmail(email) {
  try {
    const normalized = normalizeEmail_(email);

    if (
      !normalized ||
      normalized.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ) {
      return { ok: false, error: 'invalid_email' };
    }

    return lookupCandidateStatus_(normalized);
  } catch (err) {
    Logger.log(
      'getCandidateStatusByEmail error: ' + (err && err.message ? err.message : err)
    );
    return { ok: false, error: 'lookup_failed' };
  }
}

/**
 * Tes cepat dari editor Apps Script.
 * Ganti email di bawah dengan email kandidat yang terdaftar di sheet.
 */
function testStatusLookup() {
  const email = 'email-kandidat@example.com';
  Logger.log(JSON.stringify(getCandidateStatusByEmail(email), null, 2));
}

function lookupCandidateStatus_(email) {
  const sheet = getStatusSheet_();

  if (!sheet) {
    return { ok: false, error: 'sheet_not_found' };
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 2 || lastCol < 1) {
    return { ok: true, found: false };
  }

  const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const headers = values[0] || [];

  const emailIdx = findStatusColumn_(
    headers,
    STATUS_HEADER_ALIASES.email,
    CONFIG.STATUS_EMAIL_COLUMN
  );
  const nameIdx = findStatusColumn_(
    headers,
    STATUS_HEADER_ALIASES.name,
    CONFIG.STATUS_NAME_COLUMN
  );
  const positionIdx = findStatusColumn_(
    headers,
    STATUS_HEADER_ALIASES.position,
    CONFIG.STATUS_POSITION_COLUMN
  );
  const decisionIdx = findStatusColumn_(
    headers,
    STATUS_HEADER_ALIASES.decision,
    CONFIG.STATUS_DECISION_COLUMN
  );

  // Cari dari baris paling bawah supaya data terbaru yang dipakai.
  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i] || [];

    if (!rowMatchesEmail_(row[emailIdx], email)) {
      continue;
    }

    const decision = mapDecision_(row[decisionIdx]);

    return {
      ok: true,
      found: true,
      name: cleanText_(row[nameIdx]),
      position: cleanText_(row[positionIdx]),
      status: decision.code,
      decision: decision.label
    };
  }

  return { ok: true, found: false };
}

function getStatusSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.STATUS_SPREADSHEET_ID);
  let sheet = null;

  if (CONFIG.STATUS_SHEET_NAME) {
    sheet = ss.getSheetByName(CONFIG.STATUS_SHEET_NAME);
  }

  // Fallback: cari berdasarkan gid kalau nama sheet berubah.
  if (!sheet && CONFIG.STATUS_SHEET_GID) {
    const gid = Number(CONFIG.STATUS_SHEET_GID);
    const sheets = ss.getSheets();

    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === gid) {
        sheet = sheets[i];
        break;
      }
    }
  }

  return sheet;
}

function findStatusColumn_(headers, aliases, fallbackLetter) {
  const normalized = headers.map(normalizeHeader_);

  for (let i = 0; i < normalized.length; i++) {
    if (aliases.indexOf(normalized[i]) !== -1) {
      return i;
    }
  }

  return columnLetterToIndex_(fallbackLetter);
}

function rowMatchesEmail_(cellValue, targetEmail) {
  const raw = String(cellValue || '').trim();

  if (!raw) {
    return false;
  }

  const candidates = raw.split(/[;,\n]/);

  for (let i = 0; i < candidates.length; i++) {
    if (normalizeEmail_(candidates[i]) === targetEmail) {
      return true;
    }
  }

  return false;
}

function normalizeEmail_(value) {
  let email = String(value || '').trim().toLowerCase();

  // Dukung format "Nama <email@domain.com>".
  const angle = email.match(/<([^>]+)>/);
  if (angle) {
    email = angle[1];
  }

  return email.replace(/^mailto:/, '').replace(/\s+/g, '');
}

function normalizeHeader_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function columnLetterToIndex_(letters) {
  const text = String(letters || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  if (!text) {
    return -1;
  }

  let index = 0;

  for (let i = 0; i < text.length; i++) {
    index = index * 26 + (text.charCodeAt(i) - 64);
  }

  return index - 1;
}

function cleanText_(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

/**
 * Kosong / "Under Review" -> Under Review
 * Passed / Failed -> sesuai nilainya.
 * Nilai lain yang belum dikenali dianggap Under Review.
 */
function mapDecision_(value) {
  const text = String(value || '').trim();
  const key = text.toLowerCase().replace(/\s+/g, ' ');

  if (!key) {
    return { code: 'under_review', label: 'Under Review' };
  }

  if (
    /(tidak\s*lolos|tidak\s*lulus|not\s*pass|unsuccess|not\s*recommended|failed|fail|gagal|reject|ditolak|tidak\s*direkomendasikan)/.test(
      key
    )
  ) {
    return { code: 'failed', label: 'Failed' };
  }

  if (
    /(passed|pass|lolos|lulus|recommended|direkomendasikan|diterima|accepted)/.test(
      key
    )
  ) {
    return { code: 'passed', label: 'Passed' };
  }

  return { code: 'under_review', label: 'Under Review' };
}

/* ========================= CLIENT MAPPING ========================= */

/**
 * Dipanggil dari halaman Client Mapping lewat google.script.run.
 *
 * Alur:
 *   email -> nama kandidat di sheet Reference Check
 *         -> daftar sheet perusahaan di sheet allocation (gid 1273631981)
 *         -> baca kolom "Status Progress Client" di masing-masing sheet.
 */
function getClientMappingByEmail(email) {
  try {
    const normalized = normalizeEmail_(email);

    if (
      !normalized ||
      normalized.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ) {
      return { ok: false, error: 'invalid_email' };
    }

    const reference = lookupCandidateStatus_(normalized);

    if (!reference.ok) {
      return { ok: false, error: reference.error || 'lookup_failed' };
    }

    if (!reference.found) {
      return { ok: true, found: false };
    }

    if (!reference.name) {
      return { ok: false, error: 'name_missing' };
    }

    const mapping = lookupClientMappings_(reference.name);

    if (!mapping.ok) {
      return { ok: false, error: mapping.error || 'mapping_failed' };
    }

    return {
      ok: true,
      found: true,
      name: reference.name,
      position: reference.position,
      mappings: mapping.mappings
    };
  } catch (err) {
    Logger.log(
      'getClientMappingByEmail error: ' + (err && err.message ? err.message : err)
    );
    return { ok: false, error: 'lookup_failed' };
  }
}

/**
 * Tes cepat dari editor Apps Script.
 * Ganti email di bawah dengan email kandidat yang terdaftar.
 */
function testClientMappingLookup() {
  const email = 'email-kandidat@example.com';
  Logger.log(JSON.stringify(getClientMappingByEmail(email), null, 2));
}

function lookupClientMappings_(candidateName) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.CLIENT_MAPPING_SPREADSHEET_ID);
    const allocationSheet = getAllocationSheet_(ss);

    if (!allocationSheet) {
      Logger.log(
        'Sheet allocation tidak ditemukan. Cek CLIENT_MAPPING_ALLOCATION_GID / CLIENT_MAPPING_ALLOCATION_NAME.'
      );
      return { ok: false, error: 'allocation_not_found' };
    }

    const allocation = readAllocationSheet_(allocationSheet, candidateName);

    if (!allocation.found) {
      return { ok: true, mappings: [] };
    }

    const sheets = ss.getSheets();
    const excluded = {};

    (CONFIG.CLIENT_MAPPING_EXCLUDED_SHEETS || []).forEach(function (name) {
      excluded[normalizeSheetName_(name)] = true;
    });

    const seen = {};
    const mappings = [];

    for (let i = 0; i < allocation.sheetNames.length; i++) {
      const sheet = resolveSheetByName_(sheets, allocation.sheetNames[i], excluded);

      if (!sheet) {
        continue;
      }

      const key = normalizeSheetName_(sheet.getName());

      if (!key || seen[key] || excluded[key]) {
        continue;
      }

      seen[key] = true;

      const meta = getCompanySheetMeta_(sheet);

      // Hanya sheet yang punya header "Status Progress Client".
      if (!meta) {
        continue;
      }

      const entry = readCompanyStatus_(meta, candidateName);

      if (entry) {
        mappings.push(entry);
      }
    }

    mappings.sort(function (a, b) {
      return String(a.company).localeCompare(String(b.company));
    });

    return { ok: true, mappings: mappings };
  } catch (err) {
    Logger.log(
      'lookupClientMappings_ error: ' + (err && err.message ? err.message : err)
    );
    return { ok: false, error: 'mapping_failed' };
  }
}

function getAllocationSheet_(ss) {
  const gid = Number(CONFIG.CLIENT_MAPPING_ALLOCATION_GID || 0);
  const sheets = ss.getSheets();

  if (gid) {
    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === gid) {
        return sheets[i];
      }
    }
  }

  if (CONFIG.CLIENT_MAPPING_ALLOCATION_NAME) {
    const byName = ss.getSheetByName(CONFIG.CLIENT_MAPPING_ALLOCATION_NAME);
    if (byName) {
      return byName;
    }
  }

  // Fallback: cari sheet yang punya header "Alokasi ke mana (Sheet)".
  for (let i = 0; i < sheets.length; i++) {
    try {
      const lastRow = sheets[i].getLastRow();
      const lastCol = sheets[i].getLastColumn();

      if (lastRow < 1 || lastCol < 1) {
        continue;
      }

      const rows = sheets[i]
        .getRange(1, 1, Math.min(5, lastRow), lastCol)
        .getDisplayValues();

      for (let r = 0; r < rows.length; r++) {
        if (
          findHeaderColumn_(
            rows[r],
            CLIENT_ALLOCATION_HEADER_ALIASES.allocation,
            -1
          ) !== -1
        ) {
          return sheets[i];
        }
      }
    } catch (ignore) {}
  }

  return null;
}

function readAllocationSheet_(sheet, candidateName) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 1 || lastCol < 1) {
    return { found: false, sheetNames: [] };
  }

  const headerCount = Math.min(5, lastRow);
  const headerRows = sheet
    .getRange(1, 1, headerCount, lastCol)
    .getDisplayValues();

  let headerRowIndex = -1;
  let nameCol = -1;
  let allocationCol = -1;

  for (let r = 0; r < headerRows.length; r++) {
    const nameIndex = findHeaderColumn_(
      headerRows[r],
      CLIENT_ALLOCATION_HEADER_ALIASES.name,
      -1
    );
    const allocationIndex = findHeaderColumn_(
      headerRows[r],
      CLIENT_ALLOCATION_HEADER_ALIASES.allocation,
      -1
    );

    if (nameIndex !== -1 && allocationIndex !== -1) {
      headerRowIndex = r;
      nameCol = nameIndex;
      allocationCol = allocationIndex;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    nameCol = findHeaderColumn_(
      headerRows[0],
      CLIENT_ALLOCATION_HEADER_ALIASES.name,
      0
    );
    allocationCol = findHeaderColumn_(
      headerRows[0],
      CLIENT_ALLOCATION_HEADER_ALIASES.allocation,
      1
    );
  }

  const dataStartRow = headerRowIndex + 2;

  if (dataStartRow > lastRow) {
    return { found: false, sheetNames: [] };
  }

  const data = sheet
    .getRange(dataStartRow, 1, lastRow - dataStartRow + 1, lastCol)
    .getDisplayValues();

  const target = normalizePersonName_(candidateName);
  const exact = [];

  for (let i = 0; i < data.length; i++) {
    if (normalizePersonName_(data[i][nameCol]) === target) {
      exact.push(data[i]);
    }
  }

  const matches = exact.length
    ? exact
    : findFuzzyNameRows_(data, nameCol, target);

  if (!matches.length) {
    return { found: false, sheetNames: [] };
  }

  const requested = [];
  const seen = {};

  for (let i = 0; i < matches.length; i++) {
    const names = splitAllocationNames_(matches[i][allocationCol]);

    for (let j = 0; j < names.length; j++) {
      const key = normalizeSheetName_(names[j]);

      if (!key || seen[key]) {
        continue;
      }

      seen[key] = true;
      requested.push(names[j]);
    }
  }

  return { found: requested.length > 0, sheetNames: requested };
}

function splitAllocationNames_(value) {
  return String(value || '')
    .split(/[,;\n]+/)
    .map(function (name) {
      return name.trim();
    })
    .filter(function (name) {
      const key = normalizeSheetName_(name);
      return key && key !== 'rekapclient';
    });
}

function findFuzzyNameRows_(rows, nameCol, targetName) {
  let best = Infinity;
  let bestRows = [];

  for (let i = 0; i < rows.length; i++) {
    const name = normalizePersonName_(rows[i][nameCol]);

    if (!name) {
      continue;
    }

    const distance = levenshtein_(name, targetName);

    if (distance < best) {
      best = distance;
      bestRows = [rows[i]];
    } else if (distance === best) {
      bestRows.push(rows[i]);
    }
  }

  // Hanya pakai fuzzy match kalau hasilnya tunggal dan bedanya kecil.
  if (best <= 2 && bestRows.length === 1) {
    return bestRows;
  }

  return [];
}

function resolveSheetByName_(sheets, requestedName, excluded) {
  const target = normalizeSheetName_(requestedName);

  if (!target) {
    return null;
  }

  const exact = [];

  for (let i = 0; i < sheets.length; i++) {
    const key = normalizeSheetName_(sheets[i].getName());

    if (!key || excluded[key]) {
      continue;
    }

    if (key === target) {
      exact.push(sheets[i]);
    }
  }

  if (exact.length === 1) {
    return exact[0];
  }

  if (exact.length > 1) {
    return null;
  }

  // Cocokkan nama yang terpotong, mis. "PT Internusa ... Sentosa-UI/UX"
  // dengan sheet "PT Internusa ... Sentosa-".
  const prefixMatches = [];

  for (let i = 0; i < sheets.length; i++) {
    const key = normalizeSheetName_(sheets[i].getName());

    if (!key || excluded[key]) {
      continue;
    }

    const shorter = Math.min(key.length, target.length);
    const longer = Math.max(key.length, target.length);

    if (!shorter || shorter / longer < 0.8) {
      continue;
    }

    if (key.indexOf(target) === 0 || target.indexOf(key) === 0) {
      prefixMatches.push({ sheet: sheets[i], length: key.length });
    }
  }

  if (prefixMatches.length === 1) {
    return prefixMatches[0].sheet;
  }

  if (prefixMatches.length > 1) {
    prefixMatches.sort(function (a, b) {
      return b.length - a.length;
    });

    if (prefixMatches[0].length > prefixMatches[1].length) {
      return prefixMatches[0].sheet;
    }

    return null;
  }

  let best = Infinity;
  let bestSheets = [];

  for (let i = 0; i < sheets.length; i++) {
    const key = normalizeSheetName_(sheets[i].getName());

    if (!key || excluded[key]) {
      continue;
    }

    const distance = levenshtein_(key, target);

    if (distance < best) {
      best = distance;
      bestSheets = [sheets[i]];
    } else if (distance === best) {
      bestSheets.push(sheets[i]);
    }
  }

  const maxDistance = target.length > 20 ? 3 : 2;

  if (best <= maxDistance && bestSheets.length === 1) {
    return bestSheets[0];
  }

  return null;
}

function getCompanySheetMeta_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 1 || lastCol < 1) {
    return null;
  }

  const headerCount = Math.min(10, lastRow);
  const headerRows = sheet
    .getRange(1, 1, headerCount, lastCol)
    .getDisplayValues();

  let headerRowIndex = -1;
  let statusCol = -1;

  for (let r = 0; r < headerRows.length; r++) {
    const index = findHeaderColumn_(
      headerRows[r],
      CLIENT_SHEET_HEADER_ALIASES.status,
      -1
    );

    if (index !== -1) {
      headerRowIndex = r;
      statusCol = index;
      break;
    }
  }

  // Tanpa header ini, sheet dianggap bukan sheet perusahaan.
  if (headerRowIndex === -1 || statusCol < 0 || statusCol >= lastCol) {
    return null;
  }

  const headers = headerRows[headerRowIndex];
  const nameCol = findHeaderColumn_(
    headers,
    CLIENT_SHEET_HEADER_ALIASES.name,
    2
  );
  let roleCol = findHeaderColumn_(
    headers,
    CLIENT_SHEET_HEADER_ALIASES.role,
    -1
  );

  if (nameCol < 0 || nameCol >= lastCol) {
    return null;
  }

  if (roleCol < 0 || roleCol >= lastCol) {
    roleCol = -1;
  }

  return {
    sheet: sheet,
    headerRow: headerRowIndex + 1,
    nameCol: nameCol,
    roleCol: roleCol,
    statusCol: statusCol,
    lastRow: lastRow,
    lastCol: lastCol
  };
}

function readCompanyStatus_(meta, candidateName) {
  const dataStartRow = meta.headerRow + 1;
  const rowCount = meta.lastRow - meta.headerRow;

  if (rowCount < 1) {
    return null;
  }

  // Baca seluruh baris data sekali saja (lebih cepat daripada 3 range terpisah).
  const data = meta.sheet
    .getRange(dataStartRow, 1, rowCount, meta.lastCol)
    .getDisplayValues();

  const target = normalizePersonName_(candidateName);
  const matches = [];

  for (let i = 0; i < data.length; i++) {
    if (normalizePersonName_(data[i][meta.nameCol]) === target) {
      matches.push(i);
    }
  }

  if (!matches.length) {
    let best = Infinity;
    let bestIndex = -1;
    let bestCount = 0;

    for (let i = 0; i < data.length; i++) {
      const name = normalizePersonName_(data[i][meta.nameCol]);

      if (!name) {
        continue;
      }

      const distance = levenshtein_(name, target);

      if (distance < best) {
        best = distance;
        bestIndex = i;
        bestCount = 1;
      } else if (distance === best) {
        bestCount++;
      }
    }

    if (best <= 2 && bestCount === 1 && bestIndex >= 0) {
      matches.push(bestIndex);
    }
  }

  if (!matches.length) {
    return null;
  }

  // Ambil baris paling bawah yang punya status; kalau kosong semua,
  // tetap tampilkan perusahaan dengan status "Dalam Proses".
  let chosenIndex = matches[matches.length - 1];

  for (let i = matches.length - 1; i >= 0; i--) {
    const status = cleanText_(data[matches[i]][meta.statusCol]);

    if (status) {
      chosenIndex = matches[i];
      break;
    }
  }

  return {
    company: meta.sheet.getName(),
    role: meta.roleCol >= 0 ? cleanText_(data[chosenIndex][meta.roleCol]) : '',
    status: cleanText_(data[chosenIndex][meta.statusCol])
  };
}

function findHeaderColumn_(headers, aliases, fallbackIndex) {
  const normalized = headers.map(normalizeHeader_);

  for (let i = 0; i < normalized.length; i++) {
    if (aliases.indexOf(normalized[i]) !== -1) {
      return i;
    }
  }

  return fallbackIndex;
}

function normalizeSheetName_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizePersonName_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein_(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  const m = left.length;
  const n = right.length;

  if (!m) return n;
  if (!n) return m;

  let previous = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    previous[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    const current = [i];

    for (let j = 1; j <= n; j++) {
      const cost = left.charAt(i - 1) === right.charAt(j - 1) ? 0 : 1;

      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
    }

    previous = current;
  }

  return previous[n];
}
