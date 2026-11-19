/* ============================================
   Washington Metro Timetable — Application Logic
   Arlington ⇄ DC live board + scheduled departures
   ============================================ */

/* ---------- Reference data (WMATA) ---------- */
const DEMO_KEY = 'e13626d03d8e4c03ac07f95541b3091b'; // published on developer.wmata.com/products
const DC_TZ = 'America/New_York';

const LINE_META = {
    RD: { name: 'Red',    color: '#bf0d3e', ink: '#ffffff' },
    OR: { name: 'Orange', color: '#ed8b00', ink: '#1d1504' },
    BL: { name: 'Blue',   color: '#009cde', ink: '#ffffff' },
    SV: { name: 'Silver', color: '#a0a7ab', ink: '#14181a' },
    YL: { name: 'Yellow', color: '#ffd100', ink: '#221d00' },
    GR: { name: 'Green',  color: '#00b140', ink: '#ffffff' }
};

const AREA_ARLINGTON = 'Arlington, VA';
const AREA_DC = 'Washington, DC';
const AREA_MD = 'Maryland';
const AREA_VA = 'Fairfax / Loudoun, VA';

/* Station registry: id -> { name, area, codes: { line: platform code } }
   Transfer stations carry one code per line (e.g. Metro Center = C01 Blue/Orange/Silver, A01 Red). */
const STATIONS = {
    /* --- Arlington, VA --- */
    'rosslyn':             { name: 'Rosslyn', area: AREA_ARLINGTON, codes: { BL: 'C05', OR: 'C05', SV: 'C05' } },
    'arlington-cemetery':  { name: 'Arlington Cemetery', area: AREA_ARLINGTON, codes: { BL: 'C06' } },
    'pentagon':            { name: 'Pentagon', area: AREA_ARLINGTON, codes: { BL: 'C07', YL: 'C07' } },
    'pentagon-city':       { name: 'Pentagon City', area: AREA_ARLINGTON, codes: { BL: 'C08', YL: 'C08' } },
    'crystal-city':        { name: 'Crystal City', area: AREA_ARLINGTON, codes: { BL: 'C09', YL: 'C09' } },
    'reagan-airport':      { name: 'Ronald Reagan National Airport', area: AREA_ARLINGTON, codes: { BL: 'C10', YL: 'C10' } },
    'braddock-rd':         { name: 'Braddock Rd', area: AREA_ARLINGTON, codes: { BL: 'C12', YL: 'C12' } },
    'king-st':             { name: 'King St-Old Town', area: AREA_ARLINGTON, codes: { BL: 'C13', YL: 'C13' } },
    'eisenhower-av':       { name: 'Eisenhower Av', area: AREA_ARLINGTON, codes: { YL: 'C14' } },
    'court-house':         { name: 'Court House', area: AREA_ARLINGTON, codes: { OR: 'K01', SV: 'K01' } },
    'clarendon':           { name: 'Clarendon', area: AREA_ARLINGTON, codes: { OR: 'K02', SV: 'K02' } },
    'virginia-sq':         { name: 'Virginia Sq-GMU', area: AREA_ARLINGTON, codes: { OR: 'K03', SV: 'K03' } },
    'ballston':            { name: 'Ballston-MU', area: AREA_ARLINGTON, codes: { OR: 'K04', SV: 'K04' } },
    'east-falls-church':   { name: 'East Falls Church', area: AREA_ARLINGTON, codes: { OR: 'K05', SV: 'K05' } },
    'van-dorn-st':         { name: 'Van Dorn St', area: AREA_ARLINGTON, codes: { BL: 'J02' } },

    /* --- Washington, DC --- */
    'foggy-bottom':        { name: 'Foggy Bottom-GWU', area: AREA_DC, codes: { BL: 'C04', OR: 'C04', SV: 'C04' } },
    'farragut-west':       { name: 'Farragut West', area: AREA_DC, codes: { BL: 'C03', OR: 'C03', SV: 'C03' } },
    'mcpherson-sq':        { name: 'McPherson Sq', area: AREA_DC, codes: { BL: 'C02', OR: 'C02', SV: 'C02' } },
    'metro-center':        { name: 'Metro Center', area: AREA_DC, codes: { BL: 'C01', OR: 'C01', SV: 'C01', RD: 'A01' } },
    'federal-triangle':    { name: 'Federal Triangle', area: AREA_DC, codes: { BL: 'D01', OR: 'D01', SV: 'D01' } },
    'smithsonian':         { name: 'Smithsonian', area: AREA_DC, codes: { BL: 'D02', OR: 'D02', SV: 'D02' } },
    'lenfant-plaza':       { name: "L'Enfant Plaza", area: AREA_DC, codes: { BL: 'D03', OR: 'D03', SV: 'D03', GR: 'D03', YL: 'D03' } },
    'federal-center-sw':   { name: 'Federal Center SW', area: AREA_DC, codes: { BL: 'D04', OR: 'D04', SV: 'D04' } },
    'capitol-south':       { name: 'Capitol South', area: AREA_DC, codes: { BL: 'D05', OR: 'D05', SV: 'D05' } },
    'eastern-market':      { name: 'Eastern Market', area: AREA_DC, codes: { BL: 'D06', OR: 'D06', SV: 'D06' } },
    'potomac-ave':         { name: 'Potomac Ave', area: AREA_DC, codes: { BL: 'D07', OR: 'D07', SV: 'D07' } },
    'stadium-armory':      { name: 'Stadium-Armory', area: AREA_DC, codes: { BL: 'D08', OR: 'D08', SV: 'D08' } },
    'archives':            { name: 'Archives-Navy Memorial', area: AREA_DC, codes: { GR: 'F02', YL: 'F02' } },
    'gallery-place':       { name: 'Gallery Place-Chinatown', area: AREA_DC, codes: { GR: 'F01', YL: 'F01', RD: 'B01' } },
    'mt-vernon-sq':        { name: 'Mt Vernon Sq 7th St-Convention Center', area: AREA_DC, codes: { GR: 'E01', YL: 'E01' } },
    'shaw':                { name: 'Shaw-Howard Univ', area: AREA_DC, codes: { GR: 'E02', YL: 'E02' } },
    'u-st':                { name: 'U St African-Amer Civil War Memorial', area: AREA_DC, codes: { GR: 'E03', YL: 'E03' } },
    'columbia-heights':    { name: 'Columbia Heights', area: AREA_DC, codes: { GR: 'E04', YL: 'E04' } },
    'georgia-ave':         { name: 'Georgia Ave-Petworth', area: AREA_DC, codes: { GR: 'E05', YL: 'E05' } },
    'fort-totten':         { name: 'Fort Totten', area: AREA_DC, codes: { GR: 'E06', YL: 'E06', RD: 'B07' } },
    'waterfront':          { name: 'Waterfront', area: AREA_DC, codes: { GR: 'F04' } },
    'navy-yard':           { name: 'Navy Yard-Ballpark', area: AREA_DC, codes: { GR: 'F05' } },
    'anacostia':           { name: 'Anacostia', area: AREA_DC, codes: { GR: 'F06' } },
    'congress-heights':    { name: 'Congress Heights', area: AREA_DC, codes: { GR: 'F07' } },
    'southern-ave':        { name: 'Southern Ave', area: AREA_DC, codes: { GR: 'F08' } },

    /* --- Maryland --- */
    'benning-rd':          { name: 'Benning Rd', area: AREA_MD, codes: { BL: 'G01', SV: 'G01' } },
    'capitol-heights':     { name: 'Capitol Heights', area: AREA_MD, codes: { BL: 'G02', SV: 'G02' } },
    'addison-rd':          { name: 'Addison Rd-Seat Pleasant', area: AREA_MD, codes: { BL: 'G03', SV: 'G03' } },
    'morgan-blvd':         { name: 'Morgan Blvd', area: AREA_MD, codes: { BL: 'G04', SV: 'G04' } },
    'largo':               { name: 'Downtown Largo', area: AREA_MD, codes: { BL: 'G05', SV: 'G05' } },
    'minnesota-ave':       { name: 'Minnesota Ave', area: AREA_MD, codes: { OR: 'D09' } },
    'deanwood':            { name: 'Deanwood', area: AREA_MD, codes: { OR: 'D10' } },
    'cheverly':            { name: 'Cheverly', area: AREA_MD, codes: { OR: 'D11' } },
    'landover':            { name: 'Landover', area: AREA_MD, codes: { OR: 'D12' } },
    'new-carrollton':      { name: 'New Carrollton', area: AREA_MD, codes: { OR: 'D13' } },
    'west-hyattsville':    { name: 'West Hyattsville', area: AREA_MD, codes: { GR: 'E07', YL: 'E07' } },
    'pg-plaza':            { name: "Prince George's Plaza", area: AREA_MD, codes: { GR: 'E08', YL: 'E08' } },
    'college-park':        { name: 'College Park-UMD', area: AREA_MD, codes: { GR: 'E09', YL: 'E09' } },
    'greenbelt':           { name: 'Greenbelt', area: AREA_MD, codes: { GR: 'E10', YL: 'E10' } },
    'suitland':            { name: 'Suitland', area: AREA_MD, codes: { GR: 'F10' } },
    'naylor-rd':           { name: 'Naylor Rd', area: AREA_MD, codes: { GR: 'F09' } },
    'branch-ave':          { name: 'Branch Ave', area: AREA_MD, codes: { GR: 'F11' } },
    'rhode-island-ave':    { name: 'Rhode Island Ave-Brentwood', area: AREA_MD, codes: { RD: 'B05' } },
    'takoma':              { name: 'Takoma', area: AREA_MD, codes: { RD: 'B08' } },
    'silver-spring':       { name: 'Silver Spring', area: AREA_MD, codes: { RD: 'B09' } },
    'forest-glen':         { name: 'Forest Glen', area: AREA_MD, codes: { RD: 'B10' } },
    'wheaton':             { name: 'Wheaton', area: AREA_MD, codes: { RD: 'B11' } },
    'glenmont':            { name: 'Glenmont', area: AREA_MD, codes: { RD: 'B12' } },
    'friendship-heights':  { name: 'Friendship Heights', area: AREA_MD, codes: { RD: 'A08' } },
    'bethesda':            { name: 'Bethesda', area: AREA_MD, codes: { RD: 'A09' } },
    'medical-center':      { name: 'Medical Center', area: AREA_MD, codes: { RD: 'A10' } },
    'grosvenor':           { name: 'Grosvenor-Strathmore', area: AREA_MD, codes: { RD: 'A11' } },
    'white-flint':         { name: 'North Bethesda', area: AREA_MD, codes: { RD: 'A12' } },
    'twinbrook':           { name: 'Twinbrook', area: AREA_MD, codes: { RD: 'A13' } },
    'rockville':           { name: 'Rockville', area: AREA_MD, codes: { RD: 'A14' } },
    'shady-grove':         { name: 'Shady Grove', area: AREA_MD, codes: { RD: 'A15' } },

    /* --- DC Red Line (northwest) --- */
    'dupont-circle':       { name: 'Dupont Circle', area: AREA_DC, codes: { RD: 'A03' } },
    'farragut-north':      { name: 'Farragut North', area: AREA_DC, codes: { RD: 'A02' } },
    'woodley-park':        { name: 'Woodley Park-Zoo/Adams Morgan', area: AREA_DC, codes: { RD: 'A04' } },
    'cleveland-park':      { name: 'Cleveland Park', area: AREA_DC, codes: { RD: 'A05' } },
    'van-ness':            { name: 'Van Ness-UDC', area: AREA_DC, codes: { RD: 'A06' } },
    'tenleytown':          { name: 'Tenleytown-AU', area: AREA_DC, codes: { RD: 'A07' } },
    'judiciary-sq':        { name: 'Judiciary Sq', area: AREA_DC, codes: { RD: 'B02' } },
    'union-station':       { name: 'Union Station', area: AREA_DC, codes: { RD: 'B03' } },
    'noma':                { name: 'NoMa-Gallaudet U', area: AREA_DC, codes: { RD: 'B04' } },
    'brookland':           { name: 'Brookland-CUA', area: AREA_DC, codes: { RD: 'B06' } },

    /* --- Fairfax / Loudoun, VA --- */
    'huntington':          { name: 'Huntington', area: AREA_VA, codes: { YL: 'C15' } },
    'franconia-springfield': { name: 'Franconia-Springfield', area: AREA_VA, codes: { BL: 'J03' } },
    'west-falls-church':   { name: 'West Falls Church-VT/UVA', area: AREA_VA, codes: { OR: 'K06' } },
    'dunn-loring':         { name: 'Dunn Loring-Merrifield', area: AREA_VA, codes: { OR: 'K07' } },
    'vienna':              { name: 'Vienna/Fairfax-GMU', area: AREA_VA, codes: { OR: 'K08' } },
    'mclean':              { name: 'McLean', area: AREA_VA, codes: { SV: 'N01' } },
    'tysons-corner':       { name: 'Tysons Corner', area: AREA_VA, codes: { SV: 'N02' } },
    'greensboro':          { name: 'Greensboro', area: AREA_VA, codes: { SV: 'N03' } },
    'spring-hill':         { name: 'Spring Hill', area: AREA_VA, codes: { SV: 'N04' } },
    'wiehle-reston':       { name: 'Wiehle-Reston East', area: AREA_VA, codes: { SV: 'N06' } },
    'herndon':             { name: 'Herndon', area: AREA_VA, codes: { SV: 'N07' } },
    'innovation-center':   { name: 'Innovation Center', area: AREA_VA, codes: { SV: 'N08' } },
    'dulles-airport':      { name: 'Dulles Airport', area: AREA_VA, codes: { SV: 'N09' } },
    'loudoun-gateway':     { name: 'Loudoun Gateway', area: AREA_VA, codes: { SV: 'N10' } },
    'ashburn':             { name: 'Ashburn', area: AREA_VA, codes: { SV: 'N11' } }
};

/* ---------- Line model ---------- */
/* Chains run from terminal A (index 0) to terminal B (last index).
   times[i] = scheduled running minutes between ids[i] and ids[i+1]. */
const LINE_CHAINS = {
    BL: {
        ids: ['franconia-springfield', 'van-dorn-st', 'king-st', 'braddock-rd', 'reagan-airport',
              'crystal-city', 'pentagon-city', 'pentagon', 'arlington-cemetery', 'rosslyn',
              'foggy-bottom', 'farragut-west', 'mcpherson-sq', 'metro-center', 'federal-triangle',
              'smithsonian', 'lenfant-plaza', 'federal-center-sw', 'capitol-south', 'eastern-market',
              'potomac-ave', 'stadium-armory', 'benning-rd', 'capitol-heights', 'addison-rd',
              'morgan-blvd', 'largo'],
        times: [5, 4, 2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 3]
    },
    OR: {
        ids: ['vienna', 'dunn-loring', 'west-falls-church', 'east-falls-church', 'ballston',
              'virginia-sq', 'clarendon', 'court-house', 'rosslyn', 'foggy-bottom', 'farragut-west',
              'mcpherson-sq', 'metro-center', 'federal-triangle', 'smithsonian', 'lenfant-plaza',
              'federal-center-sw', 'capitol-south', 'eastern-market', 'potomac-ave', 'stadium-armory',
              'minnesota-ave', 'deanwood', 'cheverly', 'landover', 'new-carrollton'],
        times: [5, 4, 4, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 3, 3, 3]
    },
    SV: {
        ids: ['ashburn', 'loudoun-gateway', 'dulles-airport', 'innovation-center', 'herndon',
              'wiehle-reston', 'spring-hill', 'greensboro', 'tysons-corner', 'mclean',
              'east-falls-church', 'ballston', 'virginia-sq', 'clarendon', 'court-house', 'rosslyn',
              'foggy-bottom', 'farragut-west', 'mcpherson-sq', 'metro-center', 'federal-triangle',
              'smithsonian', 'lenfant-plaza', 'federal-center-sw', 'capitol-south', 'eastern-market',
              'potomac-ave', 'stadium-armory', 'benning-rd', 'capitol-heights', 'addison-rd',
              'morgan-blvd', 'largo'],
        times: [4, 5, 5, 4, 4, 5, 2, 2, 3, 6, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 3]
    },
    YL: {
        ids: ['huntington', 'eisenhower-av', 'king-st', 'braddock-rd', 'reagan-airport', 'crystal-city',
              'pentagon-city', 'pentagon', 'lenfant-plaza', 'archives', 'gallery-place', 'mt-vernon-sq',
              'shaw', 'u-st', 'columbia-heights', 'georgia-ave', 'fort-totten', 'west-hyattsville',
              'pg-plaza', 'college-park', 'greenbelt'],
        times: [3, 2, 2, 2, 2, 2, 2, 5, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4]
    },
    GR: {
        ids: ['branch-ave', 'suitland', 'naylor-rd', 'southern-ave', 'congress-heights', 'anacostia',
              'navy-yard', 'waterfront', 'lenfant-plaza', 'archives', 'gallery-place', 'mt-vernon-sq',
              'shaw', 'u-st', 'columbia-heights', 'georgia-ave', 'fort-totten', 'west-hyattsville',
              'pg-plaza', 'college-park', 'greenbelt'],
        times: [3, 3, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4]
    },
    RD: {
        ids: ['shady-grove', 'rockville', 'twinbrook', 'white-flint', 'grosvenor', 'medical-center',
              'bethesda', 'friendship-heights', 'tenleytown', 'van-ness', 'cleveland-park', 'woodley-park',
              'dupont-circle', 'farragut-north', 'metro-center', 'gallery-place', 'judiciary-sq',
              'union-station', 'noma', 'rhode-island-ave', 'brookland', 'fort-totten', 'takoma',
              'silver-spring', 'forest-glen', 'wheaton', 'glenmont'],
        times: [3, 3, 2, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 3, 3, 4, 3, 2]
    }
};

/* Headway bands, minutes: [peak, midday, evening, late] */
const HEADWAYS = {
    weekday: {
        RD: [5, 8, 10, 15], OR: [6, 10, 12, 20], BL: [8, 12, 15, 20],
        SV: [10, 15, 20, 25], YL: [8, 12, 15, 20], GR: [8, 12, 15, 20]
    },
    saturday: {
        RD: [9, 10, 12, 18], OR: [10, 12, 15, 22], BL: [12, 15, 18, 25],
        SV: [15, 18, 22, 28], YL: [12, 15, 18, 25], GR: [12, 15, 18, 25]
    },
    sunday: {
        RD: [10, 12, 15, 20], OR: [12, 15, 18, 25], BL: [15, 18, 20, 30],
        SV: [18, 20, 25, 30], YL: [15, 18, 20, 30], GR: [15, 18, 20, 30]
    }
};

/* Service windows in minutes after midnight; weekday/saturday run past midnight (25:00 = 01:00). */
const SERVICE = {
    weekday:  { start: 5 * 60, end: 25 * 60 },
    saturday: { start: 7 * 60, end: 25 * 60 },
    sunday:   { start: 7 * 60, end: 23 * 60 }
};

/* Offsets so the three BOS lines do not leave terminals on the same minute. */
const PHASE = { RD: 0, OR: 2, BL: 0, SV: 4, YL: 1, GR: 3 };

const BAND_LABELS = ['Peak', 'Midday', 'Evening', 'Late'];
const DAY_LABELS = { weekday: 'Weekday', saturday: 'Saturday', sunday: 'Sunday' };

/* Derive ordered offsets, index lookups and totals for each line. */
const LINE_MODEL = {};
Object.keys(LINE_CHAINS).forEach(function (line) {
    const ids = LINE_CHAINS[line].ids;
    const times = LINE_CHAINS[line].times;
    const offsets = [0];
    for (let i = 1; i < ids.length; i++) {
        offsets.push(offsets[i - 1] + (times[i - 1] || 2));
    }
    const index = {};
    ids.forEach(function (id, i) { index[id] = i; });
    LINE_MODEL[line] = {
        line: line,
        ids: ids,
        times: times,
        offsets: offsets,
        index: index,
        total: offsets[ids.length - 1],
        color: LINE_META[line].color
    };
});

/* ---------- Utilities ---------- */
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parseHHMM(value) {
    const parts = String(value || '').split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h)) return 0;
    return h * 60 + (isNaN(m) ? 0 : m);
}

/* GTFS-style minute counter: can pass 24:00 for after-midnight service. */
function formatClock(totalMinutes) {
    const dayOffset = Math.floor(totalMinutes / 1440);
    const mins = ((totalMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const stamp = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    return dayOffset > 0 ? stamp + '<sup class="next-day">+1</sup>' : stamp;
}

function formatClockText(totalMinutes) {
    return formatClock(totalMinutes).replace(/<[^>]+>/g, '');
}

function formatDuration(minutes) {
    const mins = Math.max(0, Math.round(minutes));
    if (mins < 60) return mins + ' min';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? h + ' h ' + m + ' min' : h + ' h';
}

function formatHeadway(minutes) {
    if (minutes < 1) return '<1 min';
    return (Number.isInteger(minutes) ? minutes : minutes.toFixed(1)) + ' min';
}

function todayISO() {
    const now = nowInDC();
    return now.iso;
}

function dayTypeForDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    if (isNaN(d.getTime())) return 'weekday';
    const day = d.getDay();
    if (day === 0) return 'sunday';
    if (day === 6) return 'saturday';
    return 'weekday';
}

/* Washington, DC wall-clock time, independent of the machine's timezone. */
let dcClockFormatter = null;
function getDCClockFormatter() {
    if (!dcClockFormatter) {
        dcClockFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: DC_TZ, hour12: false, hour: '2-digit', minute: '2-digit',
            second: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit'
        });
    }
    return dcClockFormatter;
}

function nowInDC() {
    let parts;
    try {
        parts = getDCClockFormatter().formatToParts(new Date());
    } catch (err) {
        const d = new Date();
        return {
            h: d.getHours(), m: d.getMinutes(), s: d.getSeconds(),
            iso: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
                 String(d.getDate()).padStart(2, '0'),
            total: d.getHours() * 60 + d.getMinutes()
        };
    }
    const get = function (type) {
        const found = parts.find(function (p) { return p.type === type; });
        return found ? found.value : '00';
    };
    const h = parseInt(get('hour'), 10) % 24;
    const m = parseInt(get('minute'), 10);
    const s = parseInt(get('second'), 10);
    return {
        h: h, m: m, s: s,
        iso: get('year') + '-' + get('month') + '-' + get('day'),
        total: h * 60 + m
    };
}

/* Map a wall-clock minute (0..1439) onto the service-day counter used by the
   schedule (05:00 -> 25:00). A time before the first train belongs to the
   previous day's tail, e.g. 00:30 becomes 24:30 = 1470, so late-night trains
   still match. */
function serviceClock(dayType, totalMinutes) {
    const start = (SERVICE[dayType] || SERVICE.weekday).start;
    return totalMinutes < start ? totalMinutes + 1440 : totalMinutes;
}

/* Live board arrival column: 24-hour, zero-padded, Washington-DC wall clock.
   Cached once — updateCountdowns() calls this every second for every row.
   hourCycle 'h23' (not hour12:false) keeps midnight as "00:xx" instead of "24:xx". */
let arrivalClockFormatter = null;
function getArrivalClockFormatter() {
    if (!arrivalClockFormatter) {
        arrivalClockFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: DC_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        });
    }
    return arrivalClockFormatter;
}

function formatArrivalClock(epochMs) {
    return getArrivalClockFormatter().format(new Date(epochMs));
}

function stationLines(id) {
    const station = STATIONS[id];
    if (!station) return [];
    return Object.keys(station.codes).filter(function (line) {
        return LINE_MODEL[line] && LINE_MODEL[line].index[id] !== undefined;
    });
}

function primaryCode(id) {
    const station = STATIONS[id];
    if (!station) return '';
    const lines = stationLines(id);
    return lines.length ? station.codes[lines[0]] : '';
}

/* ---------- Schedule engine ---------- */
function bandIndex(dayType, minuteOfDay) {
    const bands = {
        weekday:  [{ end: 390, i: 3 }, { end: 570, i: 0 }, { end: 900, i: 1 }],
        saturday: [{ end: 540, i: 3 }, { end: 1140, i: 1 }, { end: 1320, i: 2 }],
        sunday:   [{ end: 540, i: 3 }, { end: 1140, i: 1 }, { end: 1320, i: 2 }]
    }[dayType] || [];

    for (let i = 0; i < bands.length; i++) {
        if (minuteOfDay < bands[i].end) return bands[i].i;
    }
    if (dayType === 'weekday') {
        if (minuteOfDay < 1140) return 0;   // PM peak 15:00–19:00
        if (minuteOfDay < 1320) return 2;   // evening 19:00–22:00
        return 3;                           // late night
    }
    if (minuteOfDay < 1320) return 2;
    return 3;
}

function headwayFor(line, dayType, minuteOfDay) {
    const table = HEADWAYS[dayType][line] || HEADWAYS.weekday[line];
    return table[bandIndex(dayType, minuteOfDay)];
}

/* Terminal departures for a line: service start -> end, stepping by the band headway. */
function terminalDepartures(line, dayType) {
    const window = SERVICE[dayType];
    let t = window.start + (PHASE[line] || 0);
    const out = [];
    while (t <= window.end && out.length < 600) {
        out.push(t);
        t += headwayFor(line, dayType, t);
    }
    return out;
}

/* Minute a train reaches a station, given its terminal departure + direction. */
function stationTime(line, stationId, forward, terminalDep) {
    const model = LINE_MODEL[line];
    const i = model.index[stationId];
    if (i === undefined) return null;
    return forward ? terminalDep + model.offsets[i] : terminalDep + (model.total - model.offsets[i]);
}

function sharedLines(originId, destId) {
    return stationLines(originId).filter(function (line) {
        const model = LINE_MODEL[line];
        return model.index[destId] !== undefined && model.index[destId] !== model.index[originId];
    });
}

/* Direct, same-line departures for an origin -> destination pair inside a time window. */
function scheduledDepartures(originId, destId, dayType, fromMin, toMin) {
    const out = [];
    sharedLines(originId, destId).forEach(function (line) {
        const model = LINE_MODEL[line];
        const io = model.index[originId];
        const id = model.index[destId];
        const forward = id > io;
        const headsignId = forward ? model.ids[model.ids.length - 1] : model.ids[0];
        terminalDepartures(line, dayType).forEach(function (terminalDep) {
            const dep = stationTime(line, originId, forward, terminalDep);
            if (dep === null || dep < fromMin || dep > toMin) return;
            const arr = stationTime(line, destId, forward, terminalDep);
            out.push({
                line: line,
                forward: forward,
                dep: dep,
                arr: arr,
                duration: arr - dep,
                stops: Math.abs(id - io) - 1,
                headsign: STATIONS[headsignId].name,
                origin: STATIONS[originId].name,
                dest: STATIONS[destId].name
            });
        });
    });
    out.sort(function (a, b) { return a.dep - b.dep || a.line.localeCompare(b.line); });
    return out;
}

/* Next departures per line from a station, used when the API is unreachable. */
function simulatedPredictions(stationId, dayType) {
    const now = serviceClock(dayType, nowInDC().total);
    const trains = [];

    stationLines(stationId).forEach(function (line) {
        const model = LINE_MODEL[line];
        const idx = model.index[stationId];
        [true, false].forEach(function (forward) {
            const headsignId = forward ? model.ids[model.ids.length - 1] : model.ids[0];
            const calls = [];
            terminalDepartures(line, dayType).forEach(function (terminalDep) {
                const t = stationTime(line, stationId, forward, terminalDep);
                if (t !== null && t >= now - 1 && t <= now + 45) calls.push(t);
            });
            calls.slice(0, 3).forEach(function (t) {
                const minutes = Math.max(0, Math.round(t - now));
                trains.push({
                    line: line,
                    destination: STATIONS[headsignId].name,
                    minutes: minutes,
                    minText: minutes <= 0 ? 'BRD' : String(minutes),
                    cars: '',
                    group: '',
                    atStation: STATIONS[stationId].name,
                    code: primaryCode(stationId),
                    simulated: true,
                    idx: idx
                });
            });
        });
    });

    return trains.sort(function (a, b) { return a.minutes - b.minutes; });
}

/* ---------- Persistence ---------- */
const STORAGE_KEY = 'wmataTimetableKey';
const STORAGE_STATION = 'wmataTimetableStation';
const STORAGE_TRIP = 'wmataTimetableTrip';
const STORAGE_DAY = 'wmataTimetableDay';
// 20s -> ~4,320 calls/day worst case (tab open 24/7), ~9% of WMATA's
// Default Tier limit of 50,000 calls/day. Polls only while the Live tab is
// active and the page is visible, so real usage is far lower.
const REFRESH_SECONDS = 20;

function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
        return fallback;
    }
}

function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        /* storage may be blocked in private mode — ignore */
    }
}

function getApiKey() {
    let saved = '';
    try {
        saved = (localStorage.getItem(STORAGE_KEY) || '').trim();
    } catch (err) {
        saved = '';
    }
    return saved || DEMO_KEY;
}

/* ---------- DOM references ---------- */
const clockEl          = document.getElementById('clock');
const sourceBadge      = document.getElementById('sourceBadge');
const apiKeyInput      = document.getElementById('apiKeyInput');
const saveKeyBtn       = document.getElementById('saveKeyBtn');
const clearKeyBtn      = document.getElementById('clearKeyBtn');
const keyStatusEl      = document.getElementById('keyStatus');
const tabButtons       = Array.prototype.slice.call(document.querySelectorAll('.tab'));
const stationSelect    = document.getElementById('stationSelect');
const directionSelect  = document.getElementById('directionSelect');
const lineChips        = document.getElementById('lineChips');
const refreshBtn       = document.getElementById('refreshBtn');
const keylessBtn       = document.getElementById('keylessBtn');
const liveStatus       = document.getElementById('liveStatus');
const liveMeta         = document.getElementById('liveMeta');
const boardEl          = document.getElementById('board');
const originSelect     = document.getElementById('originSelect');
const destSelect       = document.getElementById('destSelect');
const dateInput        = document.getElementById('dateInput');
const dayTypeSelect    = document.getElementById('dayTypeSelect');
const fromInput        = document.getElementById('fromInput');
const toInput          = document.getElementById('toInput');
const generateBtn      = document.getElementById('generateBtn');
const swapBtn          = document.getElementById('swapBtn');
const ttSummary        = document.getElementById('ttSummary');
const ttMeta           = document.getElementById('ttMeta');
const ttStats          = document.getElementById('ttStats');
const ttList           = document.getElementById('ttList');
const ttHourly         = document.getElementById('ttHourly');
const headwayDaySelect = document.getElementById('headwayDaySelect');
const liveHeadwayBtn   = document.getElementById('liveHeadwayBtn');
const headwayTable     = document.getElementById('headwayTable');
const liveHeadway      = document.getElementById('liveHeadway');
const elevatorToggle   = document.getElementById('elevatorToggle');
const alertsRefreshBtn = document.getElementById('alertsRefreshBtn');
const alertsStatus     = document.getElementById('alertsStatus');
const alertsMeta       = document.getElementById('alertsMeta');
const alertList        = document.getElementById('alertList');

/* ---------- State ---------- */
const state = {
    tab: 'live',
    /* Crystal City (C09) is the default only on a fresh profile or after clearing
       wmataTimetableStation / wmataTimetableTrip — a saved choice always wins (see init()). */
    station: 'crystal-city',
    activeLines: null,       // Set of line codes; null = every line at the station
    destinationFilter: '',
    predictions: [],
    fetchedAt: 0,
    dataSource: 'idle',
    refreshIn: REFRESH_SECONDS,
    alertsLoaded: false,
    trip: {
        origin: 'crystal-city',
        dest: 'metro-center',
        date: '',
        dayType: 'auto',
        from: '06:00',
        to: '09:00'
    },
    headwayDay: 'weekday'
};

/* ---------- Shared rendering helpers ---------- */
function linePill(line) {
    const meta = LINE_META[line];
    if (!meta) {
        return '<span class="line-pill">' + escapeHtml(line) + '</span>';
    }
    return '<span class="line-pill" style="background:' + meta.color + ';color:' + meta.ink + '">' +
           escapeHtml(line) + '</span>';
}

function setSource(source, label) {
    state.dataSource = source;
    sourceBadge.dataset.source = source;
    sourceBadge.textContent = label || source;
}

function stationOptionLabel(id) {
    const station = STATIONS[id];
    const code = primaryCode(id);
    return station.name + (code ? ' · ' + code : '');
}

function populateStations() {
    const groups = {};
    Object.keys(STATIONS).forEach(function (id) {
        const area = STATIONS[id].area;
        if (!groups[area]) groups[area] = [];
        groups[area].push(id);
    });

    const areaOrder = [AREA_ARLINGTON, AREA_DC, AREA_MD, AREA_VA];
    const allIds = [];
    areaOrder.forEach(function (area) {
        (groups[area] || []).forEach(function (id) { allIds.push(id); });
    });

    stationSelect.innerHTML = areaOrder.map(function (area) {
        if (!groups[area]) return '';
        const options = groups[area]
            .slice()
            .sort(function (a, b) { return STATIONS[a].name.localeCompare(STATIONS[b].name); })
            .map(function (id) {
                return '<option value="' + id + '">' + escapeHtml(stationOptionLabel(id)) + '</option>';
            }).join('');
        return '<optgroup label="' + escapeHtml(area) + '">' + options + '</optgroup>';
    }).join('');

    originSelect.innerHTML = allIds
        .slice()
        .sort(function (a, b) { return STATIONS[a].name.localeCompare(STATIONS[b].name); })
        .map(function (id) {
            return '<option value="' + id + '">' + escapeHtml(stationOptionLabel(id)) + '</option>';
        }).join('');

    stationSelect.value = state.station;
    originSelect.value = state.trip.origin;
}

/* Destinations reachable without a transfer, from the selected origin. */
function populateDestinations() {
    const origin = originSelect.value || state.trip.origin;
    const reachable = [];
    const seen = {};

    stationLines(origin).forEach(function (line) {
        LINE_MODEL[line].ids.forEach(function (id) {
            if (id === origin || seen[id]) return;
            seen[id] = true;
            reachable.push(id);
        });
    });

    reachable.sort(function (a, b) { return STATIONS[a].name.localeCompare(STATIONS[b].name); });

    destSelect.innerHTML = reachable.map(function (id) {
        const lines = sharedLines(origin, id);
        const suffix = lines.length ? ' [' + lines.join('/') + ']' : '';
        return '<option value="' + id + '">' +
               escapeHtml(STATIONS[id].name + suffix) + '</option>';
    }).join('');

    if (reachable.indexOf(state.trip.dest) === -1) {
        state.trip.dest = reachable[0] || '';
    }
    destSelect.value = state.trip.dest;
}

function renderLineChips() {
    const lines = stationLines(state.station);
    if (!state.activeLines) {
        state.activeLines = new Set(lines);
    }
    lineChips.innerHTML = lines.map(function (line) {
        const on = state.activeLines.has(line);
        const meta = LINE_META[line];
        const colorStyle = on ? ' style="color:' + meta.color + '"' : '';
        return '<button type="button" class="chip' + (on ? ' is-on' : '') + '" data-line="' + line + '"' +
               ' aria-pressed="' + on + '"' + colorStyle + '>' +
               '<span class="dot"></span>' + escapeHtml(meta.name) + '</button>';
    }).join('');
}

/* ---------- Live board ---------- */
function renderBoard() {
    const active = state.activeLines || new Set(stationLines(state.station));
    const trains = state.predictions.filter(function (t) {
        if (t.line && !active.has(t.line)) return false;
        if (state.destinationFilter && t.destination !== state.destinationFilter) return false;
        return true;
    }).sort(function (a, b) {
        return (a.arrivalAt || 0) - (b.arrivalAt || 0);
    });

    boardEl.setAttribute('aria-busy', 'false');

    if (!trains.length) {
        boardEl.innerHTML = '<div class="empty-state">No trains match these filters right now.' +
            '<br>Try another station, line or direction.</div>';
        return;
    }

    boardEl.innerHTML = trains.map(function (t) {
        const meta = LINE_META[t.line] || { color: '#a0a7ab', ink: '#fff' };
        const isStatic = t.minText === 'ARR' || t.minText === 'BRD';
        const mins = typeof t.minutes === 'number' ? t.minutes : null;
        const soon = isStatic || (mins !== null && mins <= 2);
        const metaBits = [];
        if (t.cars) metaBits.push(escapeHtml(t.cars) + ' cars');
        if (t.simulated) metaBits.push('simulated');
        /* ARR/BRD trains are boarding now, so their clock cell shows the current
           DC time; rows without an arrival time fall back to an em dash. */
        const arrivalText = t.arrivalAt
            ? escapeHtml(formatArrivalClock(t.arrivalAt))
            : (isStatic ? escapeHtml(formatArrivalClock(Date.now())) : '—');

        return '<div class="board-row' + (soon ? ' is-soon' : '') + '"' +
               ' style="border-left-color:' + meta.color + '"' +
               (t.arrivalAt ? ' data-arrival="' + t.arrivalAt + '"' : '') +
               (isStatic ? ' data-boarding="1"' : '') + '>' +
               '<div>' + linePill(t.line) + '</div>' +
               '<div class="board-dest">' +
                   '<div class="dest-name">' + escapeHtml(t.destination || '—') + '</div>' +
                   '<div class="dest-meta">' + (metaBits.length ? metaBits.join(' · ') : '&nbsp;') + '</div>' +
               '</div>' +
               '<div class="minutes' + (t.minText === 'BRD' ? ' is-now' : '') + '">' +
                   (isStatic
                        ? escapeHtml(t.minText)
                        : (mins === 0 ? 'Now' : mins) + '<span class="unit">min</span>') +
               '</div>' +
               '<div class="arrival-clock">' + arrivalText + '</div>' +
               '<div class="cars">' + escapeHtml(t.group || '') + '</div>' +
               '</div>';
    }).join('');

    updateCountdowns();
}

/* Tick the countdowns locally between API polls — no network calls in here. */
function updateCountdowns() {
    const rows = boardEl.querySelectorAll('.board-row');
    Array.prototype.forEach.call(rows, function (row) {
        const arrival = Number(row.dataset.arrival);
        const minutesEl = row.querySelector('.minutes');
        const arrivalEl = row.querySelector('.arrival-clock');

        if (arrival) {
            const mins = Math.max(0, Math.round((arrival - Date.now()) / 60000));
            if (minutesEl) {
                minutesEl.innerHTML = mins <= 0
                    ? 'Now<span class="unit">boarding</span>'
                    : mins + '<span class="unit">min</span>';
                minutesEl.classList.toggle('is-now', mins <= 1);
            }
            row.classList.toggle('is-soon', mins <= 2);
            if (arrivalEl) arrivalEl.textContent = formatArrivalClock(arrival);
            return;
        }

        if (arrivalEl) {
            arrivalEl.textContent = row.dataset.boarding
                ? formatArrivalClock(Date.now())
                : '—';
        }
    });
}

function renderDirectionOptions() {
    const destinations = [];
    state.predictions.forEach(function (t) {
        if (t.destination && destinations.indexOf(t.destination) === -1) {
            destinations.push(t.destination);
        }
    });
    destinations.sort();

    directionSelect.innerHTML = '<option value="">All destinations</option>' +
        destinations.map(function (d) {
            return '<option value="' + escapeHtml(d) + '">' + escapeHtml(d) + '</option>';
        }).join('');

    if (destinations.indexOf(state.destinationFilter) === -1) {
        state.destinationFilter = '';
    }
    directionSelect.value = state.destinationFilter;
}

function updateLiveMeta() {
    if (!state.fetchedAt) {
        liveMeta.textContent = '';
        return;
    }
    const at = new Date(state.fetchedAt);
    const stamp = at.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: DC_TZ
    });
    liveMeta.textContent = 'Updated ' + stamp + ' · refresh in ' + state.refreshIn + 's';
}

/* ---------- Timetable rendering ---------- */
function currentTripSettings() {
    return {
        origin: originSelect.value || state.trip.origin,
        dest: destSelect.value || state.trip.dest,
        date: dateInput.value || todayISO(),
        dayType: dayTypeSelect.value,
        from: parseHHMM(fromInput.value || '06:00'),
        to: parseHHMM(toInput.value || '09:00')
    };
}

function renderTimetable() {
    const trip = currentTripSettings();
    state.trip.origin = trip.origin;
    state.trip.dest = trip.dest;
    state.trip.date = trip.date;
    state.trip.dayType = trip.dayType;
    state.trip.from = fromInput.value || '06:00';
    state.trip.to = toInput.value || '09:00';

    if (!trip.origin || !trip.dest || trip.origin === trip.dest) {
        ttSummary.textContent = 'Pick two different stations.';
        ttStats.innerHTML = '';
        ttList.innerHTML = '';
        ttHourly.innerHTML = '';
        return;
    }

    const dayType = trip.dayType === 'auto' ? dayTypeForDate(trip.date) : trip.dayType;
    /* The schedule counts past midnight (05:00 -> 25:00). Lift the requested
       window onto that counter so an after-midnight span (00:00-01:30) or a
       span drawn across midnight (23:00-00:30) still matches late trains. */
    let from = serviceClock(dayType, trip.from);
    let to = serviceClock(dayType, trip.to);
    if (to < from) to += 1440;
    const departures = scheduledDepartures(trip.origin, trip.dest, dayType, from, to);

    ttSummary.innerHTML = '<strong>' + departures.length + '</strong> direct departures · ' +
        escapeHtml(STATIONS[trip.origin].name) + ' → ' + escapeHtml(STATIONS[trip.dest].name);
    ttMeta.textContent = DAY_LABELS[dayType] + ' schedule · ' + formatClockText(from) + '–' +
        formatClockText(to) + ' · ' + (trip.dayType === 'auto' ? 'auto day type' : 'manual day type');

    const lines = sharedLines(trip.origin, trip.dest);

    if (!departures.length) {
        ttStats.innerHTML = '';
        ttList.innerHTML = '<div class="empty-state">No scheduled trains in this window.<br>' +
            'Metrorail does not run around the clock — try 05:00–01:00.</div>';
        ttHourly.innerHTML = '';
        return;
    }

    const durations = departures.map(function (d) { return d.duration; });
    const gaps = departures.slice(1).map(function (d, i) { return d.dep - departures[i].dep; })
        .filter(function (g) { return g > 0; });
    const avgGap = gaps.length ? gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length : 0;
    const now = nowInDC();
    const nowTotal = serviceClock(dayType, now.total);
    const isToday = trip.date === now.iso;

    ttStats.innerHTML =
        '<div class="stat"><div class="stat-label">Fastest</div>' +
            '<div class="stat-value">' + formatDuration(Math.min.apply(null, durations)) + '</div></div>' +
        '<div class="stat"><div class="stat-label">Average headway</div>' +
            '<div class="stat-value">' + (avgGap ? formatHeadway(Math.round(avgGap)) : '—') + '</div></div>' +
        '<div class="stat"><div class="stat-label">Lines</div>' +
            '<div class="stat-value">' + lines.map(function (l) {
                return '<span style="color:' + LINE_META[l].color + '">' + l + '</span>';
            }).join(' / ') + '</div></div>' +
        '<div class="stat"><div class="stat-label">Service window</div>' +
            '<div class="stat-value" style="font-size:0.95rem">' +
                formatClock(SERVICE[dayType].start) + ' – ' + formatClock(SERVICE[dayType].end) +
            '</div></div>';

    let nextMarked = false;
    ttList.innerHTML = departures.map(function (d) {
        const isNext = isToday && !nextMarked && d.dep >= nowTotal;
        if (isNext) nextMarked = true;
        const inMinutes = isToday ? d.dep - nowTotal : null;

        return '<div class="tt-row' + (isNext ? ' is-next' : '') + '">' +
            '<div class="tt-time">' + formatClock(d.dep) +
                (inMinutes !== null && inMinutes >= 0
                    ? '<div class="dest-meta" style="font-size:0.62rem;font-weight:500">in ' +
                      inMinutes + ' min</div>'
                    : '') +
            '</div>' +
            '<div class="tt-route">' + linePill(d.line) +
                '<span class="tt-toward">toward ' + escapeHtml(d.headsign) + '</span>' +
            '</div>' +
            '<div class="tt-arrive">arr <strong>' + formatClock(d.arr) + '</strong></div>' +
            '<div class="tt-stops">' + d.stops + ' stop' + (d.stops === 1 ? '' : 's') + '</div>' +
            '<div class="tt-stops">' + formatDuration(d.duration) + '</div>' +
            '</div>';
    }).join('');

    renderHourly(departures, from, to, dayType);
}

/* Hour-by-hour view: departures per hour and the effective headway. */
function renderHourly(departures, from, to, dayType) {
    const startHour = Math.floor(from / 60);
    const endHour = Math.floor(to / 60);
    const rows = [];

    for (let hour = startHour; hour <= endHour; hour++) {
        const inHour = departures.filter(function (d) { return Math.floor(d.dep / 60) === hour; });
        if (!inHour.length) continue;
        const uniqueLines = [];
        inHour.forEach(function (d) {
            if (uniqueLines.indexOf(d.line) === -1) uniqueLines.push(d.line);
        });
        const headway = inHour.length > 1
            ? (inHour[inHour.length - 1].dep - inHour[0].dep) / (inHour.length - 1)
            : null;

        rows.push('<tr>' +
            '<td class="hour-cell">' + formatClock(hour * 60) + '</td>' +
            '<td class="pill-cell">' + uniqueLines.map(function (line) {
                return '<span class="mini-pill" style="background:' + LINE_META[line].color +
                       ';color:' + LINE_META[line].ink + '">' + line + '</span>';
            }).join('') + '</td>' +
            '<td class="count-cell">' + inHour.length + ' train' + (inHour.length === 1 ? '' : 's') + '</td>' +
            '<td class="count-cell">' + (headway ? '~' + formatHeadway(Math.round(headway)) : '—') + '</td>' +
            '</tr>');
    }

    ttHourly.innerHTML = rows.length
        ? '<table class="hourly-table"><caption>Hour by hour · ' + DAY_LABELS[dayType] + '</caption>' +
          '<thead><tr><th>Hour</th><th>Lines</th><th>Departures</th><th>Headway</th></tr></thead>' +
          '<tbody>' + rows.join('') + '</tbody></table>'
        : '';
}

/* ---------- Headways ---------- */
function combinedHeadway(lines, dayType, band) {
    const rate = lines.reduce(function (sum, line) {
        const h = HEADWAYS[dayType][line][band];
        return sum + (h > 0 ? 1 / h : 0);
    }, 0);
    return rate > 0 ? 1 / rate : 0;
}

function renderHeadways() {
    const dayType = headwayDaySelect.value || 'weekday';
    state.headwayDay = dayType;
    const service = SERVICE[dayType];
    const lines = Object.keys(LINE_META);

    const rows = lines.map(function (line) {
        const values = HEADWAYS[dayType][line];
        const cells = values.map(function (value, i) {
            const width = Math.max(5, Math.min(100, Math.round((value / 30) * 100)));
            return '<td>' +
                   '<div class="num">' + formatHeadway(value) + '</div>' +
                   '<span class="bar' + (i === 3 ? ' is-late' : '') + '" style="width:' + width + '%"></span>' +
                   '</td>';
        }).join('');
        return '<tr>' +
               '<td>' + linePill(line) + ' ' + escapeHtml(LINE_META[line].name) + '</td>' +
               cells +
               '<td>' + formatClock(service.start) + ' – ' + formatClock(service.end) + '</td>' +
               '</tr>';
    }).join('');

    const bosPeak = combinedHeadway(['BL', 'OR', 'SV'], dayType, 0);
    const bosMid = combinedHeadway(['BL', 'OR', 'SV'], dayType, 1);
    const gtPeak = combinedHeadway(['YL', 'GR'], dayType, 0);

    headwayTable.innerHTML =
        '<table class="headway-table">' +
        '<caption>Headways (minutes) · ' + DAY_LABELS[dayType] + '</caption>' +
        '<thead><tr><th>Line</th>' +
        BAND_LABELS.map(function (band) { return '<th>' + band + '</th>'; }).join('') +
        '<th>Service</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>' +
        '<div class="stats" style="margin-top:0.8rem">' +
            '<div class="stat"><div class="stat-label">BOS trunk · peak</div>' +
                '<div class="stat-value">' + formatHeadway(bosPeak) + ' <small>combined</small></div></div>' +
            '<div class="stat"><div class="stat-label">BOS trunk · midday</div>' +
                '<div class="stat-value">' + formatHeadway(bosMid) + ' <small>combined</small></div></div>' +
            '<div class="stat"><div class="stat-label">Yellow + Green · peak</div>' +
                '<div class="stat-value">' + formatHeadway(gtPeak) + ' <small>downtown</small></div></div>' +
            '<div class="stat"><div class="stat-label">Last trains</div>' +
                '<div class="stat-value">' + formatClock(service.end) + '</div></div>' +
        '</div>';
}

async function loadLiveHeadways() {
    liveHeadway.innerHTML = '<div class="empty-state">Asking MetroPulse for live average frequencies…</div>';
    try {
        const data = await fetchMetroPulseData();
        const frequencies = data.AverageFrequencies || data.averageFrequencies || data.Frequencies;
        if (!frequencies) throw new Error('no AverageFrequencies in response');

        const entries = Array.isArray(frequencies)
            ? frequencies
            : Object.keys(frequencies).map(function (key) {
                const value = frequencies[key];
                return Array.isArray(value)
                    ? { Line: key, Values: value }
                    : Object.assign({ Line: key }, value);
            });

        const cards = entries.map(function (entry) {
            const line = normalizeLineKey(entry.Line || entry.line || entry.LineCode || '');
            const meta = LINE_META[line] || { name: line || 'Line', color: '#a0a7ab' };
            const actual = entry.actualAverageFrequency !== undefined
                ? entry.actualAverageFrequency
                : (entry.ActualAverageFrequency !== undefined ? entry.ActualAverageFrequency : entry.actual);
            const expected = entry.expectedAverageFrequency !== undefined
                ? entry.expectedAverageFrequency
                : entry.ExpectedAverageFrequency;
            const status = entry.status || entry.Status || '';
            const actualNum = Number(actual);
            return '<div class="headway-card" style="border-left-color:' + meta.color + '">' +
                '<div class="hc-line">' + escapeHtml(meta.name) + '</div>' +
                '<div class="hc-value">' + (isNaN(actualNum) ? '—' : formatHeadway(Math.round(actualNum))) + '</div>' +
                '<div class="hc-note">' +
                    (expected !== undefined && !isNaN(Number(expected))
                        ? 'scheduled ~' + formatHeadway(Math.round(Number(expected))) + ' · '
                        : '') +
                    escapeHtml(String(status || 'live')) +
                '</div>' +
            '</div>';
        }).join('');

        liveHeadway.innerHTML = '<table class="headway-table"><caption>Live average frequencies · MetroPulse (keyless)</caption>' +
            '</table><div class="headway-cards">' + cards + '</div>' +
            '<p class="hint">Internal WMATA endpoint with no public contract — treat as best-effort.</p>';
    } catch (err) {
        liveHeadway.innerHTML = '<div class="empty-state">Live headways unavailable (' +
            escapeHtml(err.message) + ').<br>The published headway table above is unaffected.</div>';
    }
}

/* ---------- Alerts ---------- */
async function getApiJson(url, key) {
    const res = await fetch(url, { headers: { api_key: key } });
    if (!res.ok) {
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

function describeApiError(err) {
    if (err && err.status === 401) return 'the API key was rejected';
    if (err && err.status === 403) return 'access forbidden — check your key subscription';
    if (err && err.status === 404) return 'resource not found (the demo key is not subscribed to this product)';
    if (err && err.status === 429) return 'rate limited by the demo key — add your own key';
    if (err && err.name === 'TypeError') return 'network/CORS blocked — open the page over http(s) or use a proxy';
    return (err && err.message) || 'unknown error';
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* WMATA's DateUpdated values ("2026-11-18T12:07:15") are already Washington,
   DC wall-clock time. Format the fields literally instead of re-parsing with
   the browser timezone, which would shift the time for anyone outside DC. */
function formatAlertTime(value) {
    if (!value) return '';
    const text = String(value);
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(text);
    if (!match) return text;
    const month = MONTH_ABBR[Number(match[2]) - 1] || match[2];
    return month + ' ' + Number(match[3]) + ', ' + match[4] + ':' + match[5];
}

async function loadAlerts() {
    alertsStatus.textContent = 'Loading incidents…';
    alertsMeta.textContent = '';
    alertList.innerHTML = '';
    const key = getApiKey();
    const wantsElevators = elevatorToggle.checked;

    try {
        const requests = [getApiJson('https://api.wmata.com/Incidents.svc/json/Incidents', key)];
        if (wantsElevators) {
            requests.push(getApiJson('https://api.wmata.com/Incidents.svc/json/ElevatorIncidents', key));
        }
        const results = await Promise.all(requests);
        const incidents = results[0].Incidents || [];
        const elevators = wantsElevators ? (results[1].ElevatorIncidents || []) : [];

        const normalized = [];

        incidents.forEach(function (item) {
            const text = (item.Description || '') + ' ' + (item.IncidentType || '');
            const severe = /suspend|no service|single ?track|closure|closed|delay/i.test(text);
            const span = [item.StartLocation, item.EndLocation].filter(Boolean).join(' ↔ ');
            normalized.push({
                kind: item.IncidentType || 'Service alert',
                title: span,
                body: item.Description || '',
                lines: String(item.LinesAffected || '').split(/[;,]/)
                    .map(function (l) { return l.trim().toUpperCase(); })
                    .filter(function (l) { return LINE_META[l]; }),
                meta: [
                    item.DateUpdated ? 'updated ' + formatAlertTime(item.DateUpdated) : '',
                    span
                ].filter(Boolean).join(' · '),
                severity: severe ? 'high' : 'warn'
            });
        });

        elevators.forEach(function (item) {
            normalized.push({
                kind: item.UnitType === 'ESCALATOR' ? 'Escalator outage' : 'Elevator outage',
                title: (item.StationName || item.StationCode || 'Station') + ' — ' +
                       (item.UnitType || 'unit') + ' out',
                body: item.SymptomDescription || item.UnitName || '',
                lines: [],
                meta: [
                    item.DateOutOfServ ? 'out since ' + formatAlertTime(item.DateOutOfServ) : '',
                    item.EstimatedReturnToService ? 'back ~' + formatAlertTime(item.EstimatedReturnToService) : ''
                ].filter(Boolean).join(' · '),
                severity: 'outage'
            });
        });


        state.alertsLoaded = true;
        alertsMeta.textContent = incidents.length + ' incident' + (incidents.length === 1 ? '' : 's') +
            (wantsElevators ? ' · ' + elevators.length + ' outage' + (elevators.length === 1 ? '' : 's') : '');
        alertsStatus.innerHTML = normalized.length
            ? 'WMATA service status for the whole system.'
            : 'No active incidents reported by WMATA right now. 🎉';

        if (!normalized.length) {
            alertList.innerHTML = '<div class="empty-state">All clear — no delays, closures or outages in the feed.</div>';
            return;
        }

        alertList.innerHTML = normalized.map(function (item) {
            const sevClass = item.severity === 'high' ? ' sev-high'
                : (item.severity === 'outage' ? ' sev-outage' : '');
            const tagClass = item.severity === 'high' ? ' is-high'
                : (item.severity === 'outage' ? ' is-outage' : '');
            return '<div class="alert-card' + sevClass + '">' +
                '<div class="alert-head">' +
                    '<span class="alert-tag' + tagClass + '">' + escapeHtml(item.kind) + '</span>' +
                    item.lines.map(linePill).join('') +
                    (item.title
                        ? '<span class="alert-title">' + escapeHtml(item.title) + '</span>'
                        : '') +
                '</div>' +
                '<div class="alert-body">' + escapeHtml(item.body) + '</div>' +
                (item.meta ? '<div class="alert-foot">' + escapeHtml(item.meta) + '</div>' : '') +
            '</div>';
        }).join('');
    } catch (err) {
        const reason = describeApiError(err);
        alertsStatus.textContent = 'Could not load alerts — ' + reason + '.';
        alertList.innerHTML = '<div class="empty-state">' +
            'The alerts feed needs a personal WMATA key (the demo key is not subscribed).<br>' +
            'Add your key above and hit refresh, or check ' +
            '<a href="https://www.wmata.com/service/alerts/" target="_blank" rel="noopener">wmata.com alerts</a>.' +
            '</div>';
    }
}

/* ---------- Live data ---------- */
const WMATA_API = 'https://api.wmata.com';
const METROPULSE = 'https://metropulse.wmata.com';

function normalizeLineKey(value) {
    const raw = String(value || '').trim().toUpperCase();
    if (LINE_META[raw]) return raw;
    const map = {
        RED: 'RD', ORANGE: 'OR', BLUE: 'BL', SILVER: 'SV', YELLOW: 'YL', GREEN: 'GR',
        'ORANGE LINE': 'OR', 'BLUE LINE': 'BL', 'SILVER LINE': 'SV', 'RED LINE': 'RD',
        'YELLOW LINE': 'YL', 'GREEN LINE': 'GR'
    };
    if (map[raw]) return map[raw];
    return raw.slice(0, 2);
}

/* StationPrediction: Min is "1"/"ARR"/"BRD" or "" when there is no prediction. */
function normalizePrediction(raw) {
    const minText = String(raw.Min == null ? '' : raw.Min).trim();
    const minutes = /^\d+$/.test(minText) ? parseInt(minText, 10) : null;
    return {
        line: normalizeLineKey(raw.Line),
        destination: raw.DestinationName || raw.Destination || '',
        destinationCode: raw.DestinationCode || '',
        minText: minText === 'ARR' || minText === 'BRD' ? minText
                 : (minutes === null ? '' : String(minutes)),
        minutes: minutes,
        cars: raw.Car ? String(raw.Car) : '',
        group: raw.Group ? String(raw.Group) : '',
        code: raw.LocationCode || '',
        atStation: raw.LocationName || ''
    };
}

async function fetchWmataPredictions(codes) {
    const res = await fetch(WMATA_API + '/StationPrediction.svc/json/GetPrediction/' + codes, {
        headers: { api_key: getApiKey() }
    });
    if (!res.ok) {
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        throw err;
    }
    const data = await res.json();
    return (data && data.Trains) || [];
}

/* MetroPulse (keyless): POST /api/session/init -> token, then GET /api/metro-rail/trains. */
async function fetchMetroPulseData() {
    const init = await fetch(METROPULSE + '/api/session/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    });
    if (!init.ok) throw new Error('session HTTP ' + init.status);
    const session = await init.json();
    const token = session.token || session.Token;
    if (!token) throw new Error('no session token');

    const res = await fetch(METROPULSE + '/api/metro-rail/trains', {
        headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('trains HTTP ' + res.status);
    return res.json();
}

/* Flatten MetroPulse PidsTrains into our board shape for one station. */
function predictionsFromMetroPulse(data, stationId) {
    const codes = Object.keys(STATIONS[stationId].codes).map(function (line) {
        return STATIONS[stationId].codes[line];
    });
    const pids = data && (data.PidsTrains || data.pidsTrains);
    const out = [];
    if (!pids) return out;

    const codeMatches = function (candidate) {
        const value = String(candidate || '');
        return codes.some(function (code) {
            return value === code || value.indexOf(code) !== -1;
        });
    };

    const pushTrain = function (lineKey, train) {
        if (!train) return;
        const calls = train.Stations || train.stations || [];
        let best = null;

        calls.forEach(function (call) {
            if (!codeMatches(call.Code || call.code || call.StopCode)) return;
            const minRaw = call.Min == null ? '' : String(call.Min).trim();
            const etaSec = Number(call.EtaSec != null ? call.EtaSec : call.etaSec);
            let minutes = /^\d+$/.test(minRaw) ? parseInt(minRaw, 10) : null;
            if (minutes === null && !isNaN(etaSec)) minutes = Math.round(etaSec / 60);
            const minText = (minRaw === 'ARR' || minRaw === 'BRD') ? minRaw
                          : (minutes === null ? '' : String(minutes));
            if (minText === '') return;
            if (!best || (minutes !== null && best.minutes !== null && minutes < best.minutes)) {
                best = { minutes: minutes, minText: minText };
            }
        });

        if (!best) return;

        const lastCall = calls.length ? calls[calls.length - 1] : {};
        const destination = train.DestinationName || train.destinationName || train.Destination ||
            lastCall.Name || lastCall.name || '';
        const line = normalizeLineKey(lineKey || train.Line || train.lineCode);

        out.push({
            line: line,
            destination: destination,
            minText: best.minText,
            minutes: best.minutes,
            cars: train.Cars ? String(train.Cars) : '',
            group: '',
            code: primaryCode(stationId),
            atStation: STATIONS[stationId].name
        });
    };

    if (Array.isArray(pids)) {
        pids.forEach(function (entry) {
            const trains = entry.Trains || entry.trains || [];
            trains.forEach(function (train) {
                pushTrain(entry.Line || entry.lineCode || '', train);
            });
        });
    } else {
        Object.keys(pids).forEach(function (lineKey) {
            const value = pids[lineKey];
            const trains = Array.isArray(value) ? value : ((value && (value.Trains || value.trains)) || []);
            trains.forEach(function (train) { pushTrain(lineKey, train); });
        });
    }

    return out;
}

/* Accept either a raw WMATA Train object or one of our normalized predictions. */
function coercePrediction(raw) {
    const normalized = raw && raw.Min === undefined &&
        (raw.minText !== undefined || raw.minutes !== undefined);
    if (!normalized) return normalizePrediction(raw);

    const minutes = typeof raw.minutes === 'number' ? raw.minutes : null;
    return {
        line: normalizeLineKey(raw.line),
        destination: raw.destination || '',
        minText: raw.minText || (minutes === null ? '' : String(minutes)),
        minutes: minutes,
        cars: raw.cars || '',
        group: raw.group || '',
        code: raw.code || '',
        atStation: raw.atStation || '',
        simulated: !!raw.simulated
    };
}

function applyPredictions(rawTrains, source, label) {
    const nowMs = Date.now();
    const trains = rawTrains.map(coercePrediction).filter(function (t) {
        return t.minText !== '' && LINE_META[t.line];
    }).map(function (t) {
        t.arrivalAt = nowMs + (t.minutes || 0) * 60000;
        return t;
    });


    state.predictions = trains;
    state.fetchedAt = nowMs;
    state.refreshIn = REFRESH_SECONDS;
    setSource(source, label);

    const stationName = STATIONS[state.station].name;
    liveStatus.innerHTML = trains.length
        ? '<strong>' + trains.length + '</strong> trains at ' + escapeHtml(stationName)
        : 'No active predictions at ' + escapeHtml(stationName) + ' right now.';

    renderDirectionOptions();
    renderBoard();
    updateLiveMeta();
}

async function fetchLive(options) {
    options = options || {};
    const stationId = state.station;
    const codes = Object.keys(STATIONS[stationId].codes).map(function (line) {
        return STATIONS[stationId].codes[line];
    }).filter(function (code, i, arr) {
        return arr.indexOf(code) === i;
    });

    boardEl.setAttribute('aria-busy', 'true');

    if (!options.keylessOnly) {
        try {
            const raw = await fetchWmataPredictions(codes.join(','));
            applyPredictions(raw, 'live', 'live · WMATA');
            return;
        } catch (err) {
            console.warn('WMATA predictions failed:', describeApiError(err));
            if (!options.quiet) {
                liveStatus.textContent = 'WMATA API unavailable (' + describeApiError(err) +
                    ') — trying the keyless MetroPulse feed…';
            }
        }
    }

    try {
        const data = await fetchMetroPulseData();
        const raw = predictionsFromMetroPulse(data, stationId);
        applyPredictions(raw, 'metropulse', 'keyless · MetroPulse');
        return;
    } catch (err) {
        console.warn('MetroPulse predictions failed:', err.message);
    }

    const simulated = simulatedPredictions(stationId, dayTypeForDate(todayISO()));
    applyPredictions(simulated, 'sim', 'offline model');
    liveStatus.innerHTML = 'Live feeds unreachable — showing the schedule model for ' +
        escapeHtml(STATIONS[stationId].name) + '.';
}

/* ---------- Tabs & live controls ---------- */
function pad2(value) {
    return String(value).padStart(2, '0');
}

function refreshKeyStatus() {
    let saved = '';
    try {
        saved = (localStorage.getItem(STORAGE_KEY) || '').trim();
    } catch (err) {
        saved = '';
    }
    if (saved) {
        apiKeyInput.value = saved;
        keyStatusEl.textContent = 'Using your saved WMATA key (••••' + saved.slice(-4) +
            '). Live predictions, alerts and GTFS are available.';
    } else {
        apiKeyInput.value = '';
        keyStatusEl.textContent = 'Using WMATA public demo key (rate limited). Add your own key for ' +
            'alerts and higher limits.';
    }
}

function switchTab(name) {
    state.tab = name;
    tabButtons.forEach(function (button) {
        const on = button.dataset.tab === name;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-selected', String(on));
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab-panel'), function (panel) {
        panel.classList.toggle('is-hidden', panel.id !== 'panel-' + name);
    });
    if (location.hash !== '#' + name) {
        try { history.replaceState(null, '', '#' + name); } catch (err) { /* file:// may block */ }
    }

    if (name === 'timetable') renderTimetable();
    if (name === 'headways') renderHeadways();
    if (name === 'alerts' && !state.alertsLoaded) loadAlerts();
    if (name === 'live' && !state.fetchedAt) fetchLive();
    if (name === 'live') {
        state.refreshIn = REFRESH_SECONDS;
        updateLiveMeta();
    } else if (!state.fetchedAt) {
        setSource('idle', 'board idle');
    }
}


function tabFromHash() {
    const name = String(location.hash || '').replace('#', '');
    return ['live', 'timetable', 'headways', 'alerts'].indexOf(name) !== -1 ? name : 'live';
}


tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        switchTab(button.dataset.tab);
    });
});

stationSelect.addEventListener('change', function () {
    state.station = stationSelect.value;
    state.activeLines = null;
    state.destinationFilter = '';
    try { localStorage.setItem(STORAGE_STATION, state.station); } catch (err) { /* ignore */ }
    renderLineChips();
    fetchLive();
});

directionSelect.addEventListener('change', function () {
    state.destinationFilter = directionSelect.value;
    renderBoard();
});

lineChips.addEventListener('click', function (event) {
    const button = event.target.closest('.chip');
    if (!button) return;
    const line = button.dataset.line;
    if (!state.activeLines) state.activeLines = new Set(stationLines(state.station));
    if (state.activeLines.has(line)) {
        state.activeLines.delete(line);
    } else {
        state.activeLines.add(line);
    }
    if (state.activeLines.size === 0) state.activeLines.add(line);
    renderLineChips();
    renderBoard();
});

refreshBtn.addEventListener('click', function () {
    state.refreshIn = REFRESH_SECONDS;
    fetchLive();
});

keylessBtn.addEventListener('click', function () {
    fetchLive({ keylessOnly: true });
});

saveKeyBtn.addEventListener('click', function () {
    const value = apiKeyInput.value.trim();
    try {
        if (value) {
            localStorage.setItem(STORAGE_KEY, value);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch (err) { /* ignore */ }
    refreshKeyStatus();
    state.alertsLoaded = false;
    fetchLive();
});

clearKeyBtn.addEventListener('click', function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
    refreshKeyStatus();
    state.alertsLoaded = false;
    fetchLive();
});

/* ---------- Timetable controls ---------- */
function persistTrip() {
    writeJSON(STORAGE_TRIP, {
        origin: originSelect.value,
        dest: destSelect.value,
        date: dateInput.value,
        dayType: dayTypeSelect.value,
        from: fromInput.value,
        to: toInput.value
    });
}

originSelect.addEventListener('change', function () {
    state.trip.origin = originSelect.value;
    populateDestinations();
    persistTrip();
    renderTimetable();
});

destSelect.addEventListener('change', function () {
    state.trip.dest = destSelect.value;
    persistTrip();
    renderTimetable();
});

[dateInput, dayTypeSelect, fromInput, toInput].forEach(function (input) {
    input.addEventListener('change', function () {
        persistTrip();
        renderTimetable();
    });
});

generateBtn.addEventListener('click', function () {
    persistTrip();
    renderTimetable();
});

swapBtn.addEventListener('click', function () {
    const origin = originSelect.value;
    const dest = destSelect.value;
    if (!origin || !dest) return;
    originSelect.value = dest;
    state.trip.origin = dest;
    populateDestinations();
    destSelect.value = origin;
    state.trip.dest = origin;
    persistTrip();
    renderTimetable();
});

/* ---------- Headways & alerts controls ---------- */
headwayDaySelect.addEventListener('change', function () {
    state.headwayDay = headwayDaySelect.value;
    try { localStorage.setItem(STORAGE_DAY, state.headwayDay); } catch (err) { /* ignore */ }
    renderHeadways();
});

liveHeadwayBtn.addEventListener('click', loadLiveHeadways);

alertsRefreshBtn.addEventListener('click', loadAlerts);

elevatorToggle.addEventListener('change', function () {
    state.alertsLoaded = false;
    loadAlerts();
});

/* ---------- Clock & polling ---------- */
function tick() {
    const now = nowInDC();
    clockEl.textContent = pad2(now.h) + ':' + pad2(now.m) + ':' + pad2(now.s);

    if (state.tab !== 'live') return;
    updateCountdowns();
    if (state.refreshIn > 0) state.refreshIn -= 1;
    updateLiveMeta();
    if (state.refreshIn <= 0) {
        state.refreshIn = REFRESH_SECONDS;
        if (!document.hidden) fetchLive({ quiet: true });
    }
}

document.addEventListener('visibilitychange', function () {
    if (!document.hidden && state.tab === 'live') {
        state.refreshIn = REFRESH_SECONDS;
        fetchLive({ quiet: true });
    }
});

/* ---------- Init ---------- */
function init() {
    try {
        const savedStation = localStorage.getItem(STORAGE_STATION);
        if (savedStation && STATIONS[savedStation]) state.station = savedStation;
        const savedDay = localStorage.getItem(STORAGE_DAY);
        if (savedDay && DAY_LABELS[savedDay]) state.headwayDay = savedDay;
    } catch (err) { /* ignore */ }

    const savedTrip = readJSON(STORAGE_TRIP, null);
    if (savedTrip) {
        ['origin', 'dest', 'date', 'dayType', 'from', 'to'].forEach(function (key) {
            if (savedTrip[key]) state.trip[key] = savedTrip[key];
        });
    }
    if (!state.trip.date) state.trip.date = todayISO();
    if (!STATIONS[state.trip.origin]) state.trip.origin = 'crystal-city';
    if (!STATIONS[state.trip.dest] || state.trip.dest === state.trip.origin) state.trip.dest = 'metro-center';

    populateStations();
    stationSelect.value = state.station;
    originSelect.value = state.trip.origin;
    populateDestinations();
    destSelect.value = state.trip.dest;

    dateInput.value = state.trip.date;
    dayTypeSelect.value = state.trip.dayType || 'auto';
    fromInput.value = state.trip.from || '06:00';
    toInput.value = state.trip.to || '09:00';
    headwayDaySelect.value = state.headwayDay || 'weekday';

    renderLineChips();
    renderDirectionOptions();
    renderHeadways();
    refreshKeyStatus();
    updateLiveMeta();

    tick();
    setInterval(tick, 1000);
    switchTab(tabFromHash());
}

window.addEventListener('hashchange', function () {
    switchTab(tabFromHash());
});


init();














