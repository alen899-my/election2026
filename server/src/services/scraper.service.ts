import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { db } from '../config/db';
import { districts }      from '../schema/districts';
import { constituencies } from '../schema/constituencies';
import { parties }        from '../schema/parties';
import { candidates }     from '../schema/candidates';
import { scrapeLogs }     from '../schema/scrape_logs';
import { eq }             from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const WIKI_BASE = 'https://en.wikipedia.org';
const MAIN_PAGE = `${WIKI_BASE}/wiki/2026_Kerala_Legislative_Assembly_election`;

const DISTRICT_SEAT_COUNTS: Record<string, number> = {
  kasaragod: 5, kannur: 11, wayanad: 3, kozhikode: 13,
  malappuram: 16, palakkad: 12, thrissur: 13, ernakulam: 14,
  idukki: 5, kottayam: 9, alappuzha: 9, pathanamthitta: 5,
  kollam: 11, thiruvananthapuram: 14,
};

const KNOWN_DISTRICTS = [
  'Kasaragod','Kannur','Wayanad','Kozhikode','Malappuram',
  'Palakkad','Thrissur','Ernakulam','Idukki','Kottayam',
  'Alappuzha','Pathanamthitta','Kollam','Thiruvananthapuram',
];

// Full party name (lowercase) → abbreviation
const PARTY_ABBR_MAP: Record<string, string> = {
  'communist party of india (marxist)':               'CPI(M)',
  'communist party of india (marxist) (kerala)':      'CPI(M)',
  'communist party of india':                         'CPI',
  'indian national congress':                         'INC',
  'indian union muslim league':                       'IUML',
  'bharatiya janata party':                           'BJP',
  'bharath dharma jana sena':                         'BDJS',
  'kerala congress (mani)':                           'KC(M)',
  'kerala congress (m)':                              'KC(M)',
  'kerala congress':                                  'KEC',
  'kerala congress (jacob)':                          'KC(J)',
  'revolutionary socialist party (india)':            'RSP',
  'revolutionary socialist party':                    'RSP',
  'revolutionary socialist party (leninist)':         'RSP(L)',
  'nationalist congress party (sharadchandra pawar)': 'NCP-SP',
  'rashtriya janata dal':                             'RJD',
  'indian socialist janata dal':                      'ISJD',
  'indian national league':                           'INL',
  'twenty20 party':                                   'TTP',
  'twenty20 kizhakkambalam':                          'TTP',
  'all india trinamool congress':                     'AITC',
  'trinamool congress':                               'AITC',
  'revolutionary marxist party of india':             'RMPI',
  'democratic congress kerala':                       'DCK',
  'kerala democratic party':                          'DCK',
  'communist marxist party':                          'CMP',
  'communist marxist party (john)':                   'CMP',
  'kerala congress (b)':                              'KC(B)',
  'congress (secular)':                               'Cong(S)',
  'aam aadmi party':                                  'AAP',
  'janathipathiya samrakshana samithy':               'JSS',
  'janadhipathya kerala congress':                    'JKC',
  'kerala kamaraj congress':                          'KKC',
  'all india anna dravida munnetra kazhagam':         'AIADMK',
  'independent politician':                           'IND',
  'independent':                                      'IND',
};

// Known abbreviations as they appear in the table
const KNOWN_ABBRS = new Set([
  'CPI(M)','CPI','INC','IUML','BJP','BDJS','KC(M)','KEC','KC(J)',
  'RSP','RSP(L)','NCP-SP','RJD','ISJD','INL','TTP','AITC','RMPI',
  'DCK','CMP','KC(B)','Cong(S)','AAP','JSS','JKC','KKC','AIADMK','IND',
]);

// Abbreviation → coalition
const COALITION_MAP: Record<string, 'LDF'|'UDF'|'NDA'|'IND'> = {
  'CPI(M)':'LDF','CPI':'LDF','KC(M)':'LDF','ISJD':'LDF','NCP-SP':'LDF',
  'RJD':'LDF','INL':'LDF','Cong(S)':'LDF','KC(B)':'LDF','RSP(L)':'LDF',
  'JKC':'LDF',
  'INC':'UDF','IUML':'UDF','KEC':'UDF','RSP':'UDF','DCK':'UDF',
  'KC(J)':'UDF','CMP':'UDF','RMPI':'UDF','AITC':'UDF',
  'BJP':'NDA','BDJS':'NDA','TTP':'NDA','JSS':'NDA','AIADMK':'NDA','KKC':'NDA',
  'AAP':'IND','IND':'IND',
};

const PARTY_COLORS: Record<string, string> = {
  'CPI(M)':'#cc0d0d','CPI':'#f50222','INC':'#00BFFF','IUML':'#006600',
  'BJP':'#FF9933','BDJS':'#800000','KC(M)':'#F48385','KEC':'#CC6600',
  'RSP':'#d84c4c','NCP-SP':'#0029B0','RJD':'#056D05','ISJD':'#33CC00',
  'INL':'#006600','TTP':'#62c0fe','AITC':'#20C646','RMPI':'#FF0000',
  'DCK':'#008080','CMP':'#FF0000','KC(B)':'#CC6600','Cong(S)':'#4fe8db',
  'RSP(L)':'#FF0000','AAP':'#0072B0','JSS':'#FF0000','KC(J)':'#CC6600',
  'KKC':'#e818b6','AIADMK':'#009933','IND':'#DCDCDC',
};

// ─────────────────────────────────────────────────────────────────────────────
// BROWSER
// ─────────────────────────────────────────────────────────────────────────────

let _browser: any = null;

async function getBrowser() {
  if (!_browser) {
    _browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
    });
  }
  return _browser;
}

async function closeBrowser() {
  if (_browser) { await _browser.close(); _browser = null; }
}

async function fetchPage(url: string): Promise<ReturnType<typeof cheerio.load>> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForSelector('table.wikitable', { timeout: 20000 }).catch(() => {});
    const html = await page.content();
    return cheerio.load(html);
  } finally {
    await page.close();
  }
}

async function fetchSimple(url: string): Promise<ReturnType<typeof cheerio.load>> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KeralaElectionBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return cheerio.load(await res.text());
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function clean(text: string): string {
  return text
    .replace(/\[\d+\]/g, '')
    .replace(/\[[a-z]\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeSlug(text: string, suffix?: string | number): string {
  const base = text.toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return suffix !== undefined ? `${base}-${suffix}` : base;
}

function getPartyAbbr(rawName: string): string {
  const t = rawName.trim();
  // Already an abbreviation?
  if (KNOWN_ABBRS.has(t)) return t;
  // Look up by full name
  const found = PARTY_ABBR_MAP[t.toLowerCase()];
  if (found) return found;
  // Fallback
  return t.substring(0, 8).toUpperCase().replace(/\s+/g, '');
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function logScrape(p: {
  sourceUrl: string; scrapeType: string; status: 'success'|'partial'|'failed';
  recordsInserted?: number; recordsUpdated?: number;
  recordsSkipped?: number; errorMessage?: string; durationMs?: number;
}) {
  try {
    await db.insert(scrapeLogs).values({
      sourceUrl: p.sourceUrl, scrapeType: p.scrapeType, status: p.status,
      recordsInserted: p.recordsInserted ?? 0,
      recordsUpdated:  p.recordsUpdated  ?? 0,
      recordsSkipped:  p.recordsSkipped  ?? 0,
      errorMessage: p.errorMessage,
      durationMs:   p.durationMs,
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// DB UPSERTS
// ─────────────────────────────────────────────────────────────────────────────

async function upsertDistrict(nameEn: string): Promise<string> {
  const slug = makeSlug(nameEn);
  let row = await db.query.districts.findFirst({ where: eq(districts.slug, slug) });
  if (row) return row.id;
  const [ins] = await db.insert(districts).values({
    nameEn, nameMl: nameEn, slug,
    constituencyCount: DISTRICT_SEAT_COUNTS[slug] ?? 0,
  }).onConflictDoNothing().returning({ id: districts.id });
  if (ins) return ins.id;
  row = await db.query.districts.findFirst({ where: eq(districts.slug, slug) });
  return row!.id;
}

async function upsertConstituency(data: {
  number: number; nameEn: string; districtId: string; category: 'general'|'sc'|'st';
}): Promise<string> {
  let row = await db.query.constituencies.findFirst({
    where: eq(constituencies.number, data.number),
  });
  if (row) return row.id;
  const slug = makeSlug(data.nameEn, data.number);
  const [ins] = await db.insert(constituencies).values({
    districtId: data.districtId, number: data.number,
    nameEn: data.nameEn, nameMl: data.nameEn, slug,
    category: data.category,
  }).onConflictDoNothing().returning({ id: constituencies.id });
  if (ins) return ins.id;
  row = await db.query.constituencies.findFirst({ where: eq(constituencies.number, data.number) });
  return row!.id;
}

async function upsertParty(data: {
  nameEn: string; abbreviation: string;
  coalition: 'LDF'|'UDF'|'NDA'|'IND'; colorHex?: string;
}): Promise<string> {
  const slug = makeSlug(data.abbreviation);
  let row = await db.query.parties.findFirst({ where: eq(parties.slug, slug) });
  if (row) return row.id;
  const [ins] = await db.insert(parties).values({
    nameEn: data.nameEn, nameMl: data.nameEn,
    abbreviation: data.abbreviation, slug,
    coalition: data.coalition, colorHex: data.colorHex,
  }).onConflictDoNothing().returning({ id: parties.id });
  if (ins) return ins.id;
  row = await db.query.parties.findFirst({ where: eq(parties.slug, slug) });
  return row!.id;
}

async function upsertCandidate(data: {
  nameEn: string; constituencyId: string;
  partyId?: string; electionYear: number;
}): Promise<string> {
  const slug = makeSlug(data.nameEn, data.constituencyId.substring(0, 8));
  let row = await db.query.candidates.findFirst({ where: eq(candidates.slug, slug) });
  if (row) return row.id;
  const [ins] = await db.insert(candidates).values({
    nameEn: data.nameEn, nameMl: data.nameEn, slug,
    constituencyId: data.constituencyId,
    partyId: data.partyId ?? null,
    electionYear: data.electionYear,
    nominationStatus: 'accepted',
    gender: 'other',
  }).onConflictDoNothing().returning({ id: candidates.id });
  if (ins) return ins.id;
  row = await db.query.candidates.findFirst({ where: eq(candidates.slug, slug) });
  return row!.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTY SCRAPER
// Reads the LDF / UDF / NDA / Others alliance tables
// ─────────────────────────────────────────────────────────────────────────────

interface PartyRecord {
  nameEn: string;
  abbreviation: string;
  coalition: 'LDF'|'UDF'|'NDA'|'IND';
  colorHex?: string;
  wikiPath?: string;
  leaderName?: string;
  seats?: number;
}

function scrapePartyTables($: ReturnType<typeof cheerio.load>): PartyRecord[] {
  const result: PartyRecord[] = [];
  const seen = new Set<string>();

  // Each alliance table has a coloured top border cell: background-color:#cc0d0d (LDF),
  // #0078FF (UDF), #F98C1F (NDA).  We identify coalition by that colour.
  const COALITION_BY_COLOR: Record<string, 'LDF'|'UDF'|'NDA'> = {
    '#cc0d0d': 'LDF',
    '#0078ff': 'LDF',  // fallback match
    '#0078FF': 'UDF',
    '#f98c1f': 'NDA',
    '#F98C1F': 'NDA',
  };

  $('table.wikitable').each((_: number, table: any) => {
    // Does this table have a "Party | Flag | Symbol | Leader | Seats" header?
    const headerCells = $(table).find('tr').eq(2).find('th');
    const headerText  = headerCells.map((_: number, h: any) =>
      clean($(h).text()).toLowerCase()
    ).get().join('|');

    if (!headerText.includes('party') || !headerText.includes('seats')) return;

    // Detect coalition from the top-border colour cell
    const colorCell = $(table).find('td').first();
    const style     = colorCell.attr('style') || '';
    const bgMatch   = style.match(/background-color:\s*([^;,]+)/i);
    let coalition: 'LDF'|'UDF'|'NDA'|'IND' = 'IND';
    if (bgMatch) {
      const bg = bgMatch[1].trim();
      coalition = COALITION_BY_COLOR[bg] ?? 'IND';
      // Also check the second row (alliance name row)
      const allianceName = clean($(table).find('tr').eq(1).text()).toLowerCase();
      if (allianceName.includes('left democratic')) coalition = 'LDF';
      else if (allianceName.includes('united democratic')) coalition = 'UDF';
      else if (allianceName.includes('national democratic')) coalition = 'NDA';
    } else {
      const allianceName = clean($(table).find('tr').eq(0).text()).toLowerCase();
      if (allianceName.includes('left democratic')) coalition = 'LDF';
      else if (allianceName.includes('united democratic')) coalition = 'UDF';
      else if (allianceName.includes('national democratic')) coalition = 'NDA';
    }

    // Parse each party row (skip header rows and total row)
    $(table).find('tbody tr').each((_: number, row: any) => {
      const tds = $(row).find('td');
      if (tds.length < 2) return;

      // Find the party name cell — it's a <td> with a wiki link to a party page
      // The first <td> is the color swatch (2px wide), second is the party name
      const colorSwatch = $(tds[0]);
      const partyCell   = $(tds[1]);

      const partyLink = partyCell.find('a[href^="/wiki/"]').first();
      if (!partyLink.length) return;

      const partyName = clean(partyLink.text());
      const wikiPath  = partyLink.attr('href') || '';

      if (!partyName || partyName.toLowerCase() === 'total' || partyName.length < 2) return;

      // Extract leader
      const leaderCell = $(tds[3]);
      const leaderName = clean(leaderCell.text());

      // Extract seats (last td with a number)
      let seats: number | undefined;
      tds.each((_: number, td: any) => {
        const t = clean($(td).text());
        const n = parseInt(t, 10);
        if (!isNaN(n) && n > 0 && n <= 200) seats = n;
      });

      // Party color from the swatch cell style
      const swatchStyle = colorSwatch.attr('style') || '';
      const colorMatch  = swatchStyle.match(/background-color:\s*([^;,]+)/i);
      const colorHex    = colorMatch ? colorMatch[1].trim() : undefined;

      const abbreviation = getPartyAbbr(partyName);
      const detectedCoal = COALITION_MAP[abbreviation] ?? coalition;

      const key = abbreviation;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          nameEn: partyName, abbreviation,
          coalition: detectedCoal,
          colorHex: colorHex || PARTY_COLORS[abbreviation],
          wikiPath, leaderName, seats,
        });
      }
    });
  });

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATES TABLE PARSER
//
// The table structure (from the actual HTML in document 4) is:
//
//   <tr>
//     <td rowspan="5">Kasaragod</td>   ← district (th or td with rowspan)
//     <th>1</th>                        ← constituency number
//     <td>Manjeshwaram</td>             ← constituency name
//     <td style="…background-color:#cc0d0d">  ← LDF color swatch
//     <td>CPI(M)</td>                   ← LDF party abbr (with wiki link)
//     <td>K. R. Jayanandan</td>         ← LDF candidate (with wiki link, may be red)
//     <td style="…background-color:#006600">  ← UDF color swatch
//     <td>IUML</td>                     ← UDF party abbr
//     <td>A. K. M. Ashraf</td>          ← UDF candidate
//     <td style="…background-color:#FF9933">  ← NDA color swatch
//     <td>BJP</td>                      ← NDA party abbr
//     <td>K. Surendran</td>             ← NDA candidate
//   </tr>
//
// So after [district?][num][name] we have groups of 3 cells: [swatch][party][candidate]
// ─────────────────────────────────────────────────────────────────────────────

interface CandidateEntry {
  name: string;
  partyAbbr: string;
  wikiPath?: string;
}

interface ConstituencyRow {
  num:          number;
  nameEn:       string;
  districtName: string;
  category:     'general'|'sc'|'st';
  ldf:          CandidateEntry | null;
  udf:          CandidateEntry | null;
  nda:          CandidateEntry | null;
}

function parseCandidatesTable($: ReturnType<typeof cheerio.load>): ConstituencyRow[] {
  const rows: ConstituencyRow[] = [];

  // Find the candidates table: it has the district-constituency-LDF-UDF-NDA structure
  // Identified by having a 2-row colspan header with LDF / UDF / NDA
  let table: any = null;

  $('table.wikitable').each((_: number, t: any) => {
    if (table) return;
    const text = $(t).text();
    // The candidates table uniquely contains ALL three alliances + constituency numbers
    if (
      text.includes('Kasaragod') &&
      text.includes('Manjeshwaram') &&
      text.includes('LDF') &&
      text.includes('UDF') &&
      text.includes('NDA')
    ) {
      table = t;
    }
  });

  if (!table) {
    console.warn('[Parser] Could not find candidates table!');
    return [];
  }

  console.log('[Parser] Found candidates table ✓');

  // We need to handle rowspan — districts span multiple rows
  // Build a virtual grid to resolve rowspans
  type Cell = { text: string; html: string; el: any; colspan: number };
  const grid: Cell[][] = [];
  const rowspanTracker: Map<number, { remaining: number; cell: Cell }> = new Map();

  $(table).find('tbody tr').each((_: number, tr: any) => {
    const row: Cell[] = [];
    let colIdx = 0;

    // Fill cells already occupied by rowspans from previous rows
    while (rowspanTracker.has(colIdx)) {
      const rs = rowspanTracker.get(colIdx)!;
      row[colIdx] = rs.cell;
      rs.remaining--;
      if (rs.remaining === 0) rowspanTracker.delete(colIdx);
      colIdx++;
    }

    $(tr).children('td, th').each((_: number, td: any) => {
      // Skip already occupied columns
      while (rowspanTracker.has(colIdx)) {
        const rs = rowspanTracker.get(colIdx)!;
        row[colIdx] = rs.cell;
        rs.remaining--;
        if (rs.remaining === 0) rowspanTracker.delete(colIdx);
        colIdx++;
      }

      const rowspan = parseInt($(td).attr('rowspan') || '1', 10);
      const colspan = parseInt($(td).attr('colspan') || '1', 10);
      const cell: Cell = {
        text:    clean($(td).text()),
        html:    $(td).html() || '',
        el:      td,
        colspan,
      };

      for (let c = 0; c < colspan; c++) {
        row[colIdx + c] = cell;
        if (rowspan > 1) {
          rowspanTracker.set(colIdx + c, { remaining: rowspan - 1, cell });
        }
      }
      colIdx += colspan;
    });

    if (row.some(c => c)) grid.push(row);
  });

  console.log(`[Parser] Grid built: ${grid.length} rows`);

  // Now parse the grid rows
  // Structure:
  //   col 0: district name (rowspan N)  — may or may not be present for every row
  //   col 1: constituency number (th)
  //   col 2: constituency name (td with link)
  //   col 3: LDF color swatch
  //   col 4: LDF party
  //   col 5: LDF candidate
  //   col 6: UDF color swatch
  //   col 7: UDF party
  //   col 8: UDF candidate
  //   col 9: NDA color swatch
  //   col 10: NDA party
  //   col 11: NDA candidate

  let currentDistrict = '';

  for (const row of grid) {
    if (!row || row.length < 6) continue;

    // --- Find district ---
    // District cell is the one that contains a KNOWN_DISTRICTS name
    for (let i = 0; i < Math.min(3, row.length); i++) {
      const cell = row[i];
      if (!cell) continue;
      if (KNOWN_DISTRICTS.some(d =>
        cell.text.toLowerCase() === d.toLowerCase() ||
        cell.text.toLowerCase().includes(d.toLowerCase())
      )) {
        currentDistrict = KNOWN_DISTRICTS.find(d =>
          cell.text.toLowerCase().includes(d.toLowerCase())
        ) || cell.text;
        break;
      }
    }

    // --- Find constituency number ---
    // It's a <th> with a number 1-140
    let numCol = -1;
    let constNum = 0;
    for (let i = 0; i < Math.min(5, row.length); i++) {
      const cell = row[i];
      if (!cell) continue;
      const n = parseInt(cell.text, 10);
      if (!isNaN(n) && n >= 1 && n <= 140 && cell.text.trim() === String(n)) {
        numCol = i;
        constNum = n;
        break;
      }
    }

    if (!constNum || numCol < 0) continue;

    // --- Constituency name ---
    const nameCol = numCol + 1;
    if (nameCol >= row.length || !row[nameCol]) continue;
    const rawName   = row[nameCol].text;
    const constName = rawName.replace(/\s*\(SC\)|\s*\(ST\)/gi, '').trim();
    if (!constName || constName.length < 2) continue;

    let category: 'general'|'sc'|'st' = 'general';
    if (rawName.includes('(SC)')) category = 'sc';
    if (rawName.includes('(ST)')) category = 'st';

    // --- Parse alliance triplets ---
    // Starting at nameCol+1, each alliance is 3 columns: [swatch][party][candidate]
    const startCol = nameCol + 1;

    function extractTriplet(offset: number): CandidateEntry | null {
      const swatchCol    = startCol + offset;
      const partyCol     = startCol + offset + 1;
      const candidateCol = startCol + offset + 2;

      if (candidateCol >= row.length) return null;

      const partyCell     = row[partyCol];
      const candidateCell = row[candidateCol];
      if (!partyCell || !candidateCell) return null;

      // Get party abbreviation from the party cell
      const partyText = partyCell.text.trim();
      const partyAbbr = partyText ? getPartyAbbr(partyText) : 'IND';

      // Get candidate name — prefer wiki link to a PERSON (not org)
      const candidateText = candidateCell.text.trim();
      if (!candidateText || candidateText.length < 2) return null;

      // Extract wiki path from candidate cell HTML
      let wikiPath: string | undefined;
      let candidateName = candidateText;

      const $cell = cheerio.load(candidateCell.html || '');
      $cell('a[href^="/wiki/"]').each((_: number, a: any) => {
        if (wikiPath) return;
        const href = $cell(a).attr('href') || '';
        const text = clean($cell(a).text());
        // Skip org links
        const skipParts = [
          'Communist_Party','Indian_National_Congress','Bharatiya_Janata',
          'Indian_Union_Muslim','Kerala_Congress','_Party','_Front',
          '_League','_Alliance','_Dal','_Sena','Independent_politician',
          'Revolutionary_Socialist','Nationalist_Congress','Rashtriya_Janata',
          'Indian_Socialist','Indian_National_League','Twenty20_Party',
          'All_India_Anna','Kerala_Kamaraj','Aam_Aadmi',
        ];
        const isOrg = skipParts.some(s => href.includes(s));
        if (!isOrg && text && text.length > 1) {
          wikiPath      = href;
          candidateName = text;
        }
      });

      // If candidateName is still a party abbreviation, skip
      if (KNOWN_ABBRS.has(candidateName.toUpperCase())) return null;
      if (candidateName.length < 2) return null;

      return { name: candidateName, partyAbbr, wikiPath };
    }

    const ldf = extractTriplet(0);
    const udf = extractTriplet(3);
    const nda = extractTriplet(6);

    rows.push({ num: constNum, nameEn: constName, districtName: currentDistrict, category, ldf, udf, nda });

    const log = [
      `#${constNum} ${constName} (${currentDistrict})`,
      `LDF: ${ldf?.name ?? '—'} [${ldf?.partyAbbr ?? ''}]`,
      `UDF: ${udf?.name ?? '—'} [${udf?.partyAbbr ?? ''}]`,
      `NDA: ${nda?.name ?? '—'} [${nda?.partyAbbr ?? ''}]`,
    ].join(' | ');
    console.log(`[Candidate] ${log}`);
  }

  console.log(`[Parser] ✓ Parsed ${rows.length} constituencies`);
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL WIKI PAGE SCRAPER
// ─────────────────────────────────────────────────────────────────────────────

interface WikiPersonData {
  photoUrl?:    string;
  bio?:         string;
  dateOfBirth?: string;
  profession?:  string;
  education?:   string;
  gender?:      'male'|'female'|'other';
}

async function scrapePersonPage(wikiPath: string): Promise<WikiPersonData> {
  const data: WikiPersonData = {};
  try {
    const $ = await fetchSimple(`${WIKI_BASE}${wikiPath}`);

    // Photo — convert thumbnail URL to full-size
    const imgSelectors = ['.infobox img', '.infobox-image img', '.infobox td img'];
    for (const sel of imgSelectors) {
      const img = $(sel).first();
      if (!img.length) continue;
      let src = img.attr('src') || img.attr('data-src') || '';
      if (!src) continue;
      if (src.startsWith('//')) src = `https:${src}`;
      // /thumb/a/ab/File.jpg/200px-File.jpg  →  /a/ab/File.jpg
      src = src.replace(
        /\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/\d+px-[^/]+$/,
        '/$1'
      );
      if (src.includes('Question_book') || src.includes('Commons-logo') ||
          src.includes('Replace_this')) continue;
      data.photoUrl = src;
      break;
    }

    // Bio — first substantive paragraph
    $('#mw-content-text .mw-parser-output > p').each((_: number, p: any) => {
      if (data.bio) return;
      const t = clean($(p).text());
      if (t.length > 80 && !t.startsWith('Coordinates') && !t.startsWith('This article')) {
        data.bio = t.substring(0, 2000);
      }
    });

    // Gender from bio pronouns
    if (data.bio) {
      const b = data.bio.toLowerCase();
      const feCount = (b.match(/\bshe\b|\bher\b|\bhers\b/g) || []).length;
      const maCount = (b.match(/\bhe\b|\bhim\b|\bhis\b/g) || []).length;
      if (feCount > maCount) data.gender = 'female';
      else if (maCount > 0) data.gender = 'male';
    }

    // Infobox fields
    $('.infobox tr').each((_: number, row: any) => {
      const th = clean($(row).find('th').text()).toLowerCase();
      const td = $(row).find('td');
      const tv = clean(td.text());
      if (!th || !tv) return;

      if (th.includes('born') && !data.dateOfBirth) {
        const bday = td.find('.bday').text().trim();
        if (bday) {
          data.dateOfBirth = bday;
        } else {
          const m = tv.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/) ||
                    tv.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/) ||
                    tv.match(/(\d{4}-\d{2}-\d{2})/);
          if (m) {
            try {
              const d = new Date(m[0]);
              if (!isNaN(d.getTime()) && d.getFullYear() > 1920) {
                data.dateOfBirth = d.toISOString().split('T')[0];
              }
            } catch {}
          }
        }
      }

      if ((th.includes('occupation') || th === 'profession') && !data.profession) {
        data.profession = tv.split('\n')[0].substring(0, 255).trim();
      }
      if ((th.includes('education') || th.includes('alma mater')) && !data.education) {
        data.education = tv.split('\n')[0].substring(0, 255).trim();
      }
      if ((th === 'gender' || th === 'sex')) {
        data.gender = tv.toLowerCase().includes('female') ? 'female' : 'male';
      }
    });

  } catch (err: any) {
    console.warn(`[Wiki] ✗ ${wikiPath}: ${err.message}`);
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTY PAGE SCRAPER (click each party link)
// ─────────────────────────────────────────────────────────────────────────────

interface PartyPageData {
  fullName?: string;
  founded?: string;
  ideology?: string;
  flagUrl?: string;
  symbolUrl?: string;
}

async function scrapePartyPage(wikiPath: string): Promise<PartyPageData> {
  const data: PartyPageData = {};
  try {
    const $ = await fetchSimple(`${WIKI_BASE}${wikiPath}`);

    // Flag / logo image
    const img = $('.infobox img').first();
    if (img.length) {
      let src = img.attr('src') || '';
      if (src.startsWith('//')) src = `https:${src}`;
      src = src.replace(/\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/\d+px-[^/]+$/, '/$1');
      data.flagUrl = src;
    }

    // Infobox fields
    $('.infobox tr').each((_: number, row: any) => {
      const th = clean($(row).find('th').text()).toLowerCase();
      const tv = clean($(row).find('td').text());
      if (!th || !tv) return;
      if (th.includes('found') && !data.founded) data.founded = tv.substring(0, 50);
      if (th.includes('ideology') && !data.ideology) data.ideology = tv.substring(0, 255);
    });

  } catch {}
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCRAPER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class KeralaElectionScraper {

  // ── 1. Scrape & seed all parties ─────────────────────────────────────────
  static async scrapeAndSeedParties(url = MAIN_PAGE) {
    const start = Date.now();
    console.log('\n[Parties] Fetching main page...');
    const $ = await fetchPage(url);
    const partyRecords = scrapePartyTables($);

    console.log(`[Parties] Found ${partyRecords.length} parties on page`);
    let inserted = 0;

    for (const p of partyRecords) {
      try {
        await upsertParty({
          nameEn:       p.nameEn,
          abbreviation: p.abbreviation,
          coalition:    p.coalition,
          colorHex:     p.colorHex,
        });
        inserted++;
        console.log(`  ✓ ${p.abbreviation} (${p.coalition}) — ${p.nameEn}`);
      } catch (e: any) {
        console.warn(`  ✗ ${p.abbreviation}: ${e.message}`);
      }
    }

    await logScrape({
      sourceUrl: url, scrapeType: 'parties',
      status: 'success', recordsInserted: inserted,
      durationMs: Date.now() - start,
    });
    console.log(`[Parties] ✓ ${inserted} parties seeded`);
    return { inserted };
  }

  // ── 2. Scrape & seed constituencies + candidates ──────────────────────────
  static async scrapeAndSeedConstituencies(url = MAIN_PAGE) {
    const start = Date.now();
    const stats = {
      districts:     { inserted: 0, skipped: 0 },
      constituencies:{ inserted: 0, skipped: 0 },
      candidates:    { inserted: 0, skipped: 0 },
    };

    console.log('\n[Constituencies] Fetching main page...');
    const $ = await fetchPage(url);

    // Load party map from DB
    const dbParties   = await db.query.parties.findMany();
    const partyByAbbr = new Map(dbParties.map(p => [p.abbreviation.toUpperCase(), p.id]));

    function getPartyId(abbr: string): string | undefined {
      return partyByAbbr.get(abbr.toUpperCase()) ||
             partyByAbbr.get(getPartyAbbr(abbr).toUpperCase());
    }

    const rows = parseCandidatesTable($);

    if (rows.length === 0) {
      console.error('[Constituencies] ✗ 0 rows — parsing failed!');
      await logScrape({
        sourceUrl: url, scrapeType: 'constituencies',
        status: 'failed', errorMessage: '0 rows parsed',
        durationMs: Date.now() - start,
      });
      return stats;
    }

    for (const row of rows) {
      if (!row.districtName) {
        console.warn(`[Skip] #${row.num} ${row.nameEn} — no district!`);
        stats.constituencies.skipped++;
        continue;
      }

      const districtId = await upsertDistrict(row.districtName);
      const constituencyId = await upsertConstituency({
        number:     row.num,
        nameEn:     row.nameEn,
        districtId,
        category:   row.category,
      });
      stats.constituencies.inserted++;

      // Seed up to 3 candidates per constituency
      const toSeed = [row.ldf, row.udf, row.nda].filter(Boolean) as CandidateEntry[];
      for (const cand of toSeed) {
        if (!cand.name || cand.name.length < 2) continue;
        try {
          await upsertCandidate({
            nameEn:         cand.name,
            constituencyId,
            partyId:        getPartyId(cand.partyAbbr),
            electionYear:   2026,
          });
          stats.candidates.inserted++;
        } catch {
          stats.candidates.skipped++;
        }
      }
    }

    await logScrape({
      sourceUrl: url, scrapeType: 'constituencies_candidates',
      status: 'success',
      recordsInserted: stats.constituencies.inserted + stats.candidates.inserted,
      durationMs: Date.now() - start,
    });

    console.log(
      `[Constituencies] ✓ constituencies=${stats.constituencies.inserted}` +
      ` candidates=${stats.candidates.inserted}`
    );
    return stats;
  }

  // ── 3. Enrich candidates with data from their individual Wiki pages ───────
  static async enrichCandidatesFromWiki(options: {
    limit?: number; delayMs?: number; url?: string;
  } = {}) {
    const { limit = 50, delayMs = 1500, url = MAIN_PAGE } = options;
    const start = Date.now();
    let enriched = 0, skipped = 0, failed = 0;

    // Re-scrape main page to get accurate wiki paths per candidate
    console.log('\n[Enrich] Re-scraping main page for wiki links...');
    const $ = await fetchPage(url);
    const rows = parseCandidatesTable($);

    // Build map: candidate name (lowercase) → wikiPath
    const wikiPathMap = new Map<string, string>();
    for (const row of rows) {
      for (const c of [row.ldf, row.udf, row.nda]) {
        if (c?.wikiPath && c.name) {
          wikiPathMap.set(c.name.toLowerCase().trim(), c.wikiPath);
        }
      }
    }
    console.log(`[Enrich] ${wikiPathMap.size} wiki links found`);

    const allCandidates = await db.query.candidates.findMany();
    const needsEnrich   = allCandidates
      .filter(c => !c.photoUrl || !c.bio)
      .slice(0, limit);

    console.log(`[Enrich] ${needsEnrich.length} candidates to enrich...`);

    for (const candidate of needsEnrich) {
      // Try exact match first, then constructed
      let wikiPath = wikiPathMap.get(candidate.nameEn.toLowerCase().trim());
      if (!wikiPath) {
        // Construct from name: "K. K. Shailaja" → "/wiki/K._K._Shailaja"
        wikiPath = '/wiki/' + candidate.nameEn.trim()
          .split(/\s+/)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('_');
      }

      try {
        const data = await scrapePersonPage(wikiPath);

        if (!data.bio && !data.photoUrl && !data.dateOfBirth) {
          skipped++;
          await sleep(300);
          continue;
        }

        const fields: Record<string, any> = { updatedAt: new Date() };
        if (data.photoUrl)    fields.photoUrl    = data.photoUrl;
        if (data.bio)         fields.bio         = data.bio;
        if (data.dateOfBirth) fields.dateOfBirth = data.dateOfBirth;
        if (data.profession)  fields.profession  = data.profession;
        if (data.education)   fields.education   = data.education;
        if (data.gender)      fields.gender      = data.gender;

        await db.update(candidates).set(fields).where(eq(candidates.id, candidate.id));
        enriched++;
        console.log(
          `[Enrich] ✓ ${candidate.nameEn} — ` +
          `photo=${!!data.photoUrl} bio=${!!data.bio} dob=${data.dateOfBirth ?? 'N/A'}`
        );
      } catch (err: any) {
        failed++;
        console.warn(`[Enrich] ✗ ${candidate.nameEn}: ${err.message}`);
      }

      await sleep(delayMs);
    }

    await closeBrowser();
    await logScrape({
      sourceUrl: url, scrapeType: 'wiki_enrich',
      status: 'success', recordsUpdated: enriched,
      durationMs: Date.now() - start,
    });
    console.log(`[Enrich] enriched=${enriched} skipped=${skipped} failed=${failed}`);
    return { enriched, skipped, failed };
  }

  // ── 4. Full sync ──────────────────────────────────────────────────────────
  static async syncAll(options: {
    url?: string; enrichWiki?: boolean; wikiLimit?: number; delayMs?: number;
  } = {}) {
    const { url = MAIN_PAGE, enrichWiki = true, wikiLimit = 30, delayMs = 1500 } = options;
    const t0 = Date.now();
    const results: Record<string, any> = {};

    console.log('\n════════════════════════════════════════════');
    console.log('  Kerala 2026 — Full Dynamic Sync');
    console.log('════════════════════════════════════════════');

    try {
      console.log('\n[1/3] Parties...');
      results.parties = await this.scrapeAndSeedParties(url);

      console.log('\n[2/3] Constituencies + Candidates...');
      results.constituencies = await this.scrapeAndSeedConstituencies(url);

      if (enrichWiki) {
        console.log(`\n[3/3] Wiki Enrich (limit=${wikiLimit})...`);
        results.wikiEnrich = await this.enrichCandidatesFromWiki({ limit: wikiLimit, delayMs, url });
      }
    } finally {
      await closeBrowser();
    }

    results.totalTimeMs = Date.now() - t0;
    console.log(`\n✅ Done in ${(results.totalTimeMs / 1000).toFixed(1)}s`);
    return results;
  }

  // ── Backward compat ───────────────────────────────────────────────────────
  static async syncConstituenciesFromSource(targetUrl: string) {
    return this.syncAll({ url: targetUrl, enrichWiki: false });
  }
}