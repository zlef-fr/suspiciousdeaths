'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const STATUS_ORDER = ['established', 'unsolved', 'contested', 'unsupported'];
const CATEGORY_ORDER = ['suicide-doubt', 'targeted-killing', 'unexplained', 'cluster'];

function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
}

const taxonomy = readJSON('taxonomy.json');

const cases = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.startsWith('cases-') && f.endsWith('.json'))
  .sort()
  .flatMap((f) => readJSON(f));

// ---- derived fields -------------------------------------------------------

function yearOf(iso) {
  if (!iso) return null;
  const y = parseInt(String(iso).slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

for (const c of cases) {
  c.year = yearOf(c.died) || yearOf(c.born);
  c.decade = c.year ? Math.floor(c.year / 10) * 10 : null;
  c.sectors = c.sectors || [];
  c.sources = c.sources || [];
  c.related = c.related || [];
}

// Newest death first; undated entries last.
cases.sort((a, b) => (b.year || 0) - (a.year || 0) || a.name.localeCompare(b.name));

const bySlug = new Map(cases.map((c) => [c.slug, c]));

// Drop related-slugs that point at nothing, so no page ever renders a dead link.
for (const c of cases) c.related = c.related.filter((s) => bySlug.has(s) && s !== c.slug);

function countBy(key) {
  const m = new Map();
  for (const c of cases) {
    const vals = Array.isArray(c[key]) ? c[key] : [c[key]];
    for (const v of vals) {
      if (v === null || v === undefined || v === '') continue;
      m.set(v, (m.get(v) || 0) + 1);
    }
  }
  return m;
}

const counts = {
  status: countBy('status'),
  category: countBy('category'),
  sector: countBy('sectors'),
  country: countBy('country'),
  decade: countBy('decade')
};

const sourceCount = cases.reduce((n, c) => n + c.sources.length, 0);
const years = cases.map((c) => c.year).filter(Boolean);

const stats = {
  cases: cases.length,
  sources: sourceCount,
  countries: counts.country.size,
  minYear: Math.min.apply(null, years),
  maxYear: Math.max.apply(null, years),
  warned: cases.filter((c) => c.warned).length
};
stats.span = stats.maxYear - stats.minYear;

// ---- lookup helpers -------------------------------------------------------

function sectorLabel(id, locale) {
  const s = taxonomy.sectors.find((x) => x.id === id);
  return s ? s[locale] || s.en : id;
}
function countryLabel(code, locale) {
  const c = taxonomy.countries[code];
  return c ? c[locale] || c.en : code;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Free-text search across the fields a visitor would plausibly type.
function searchIndex(c, locale) {
  return norm(
    [
      c.name,
      c.slug,
      c.role_en, c.role_fr,
      c.place_en, c.place_fr,
      c.summary_en, c.summary_fr,
      countryLabel(c.country, locale),
      c.sectors.map((s) => sectorLabel(s, locale)).join(' '),
      c.year
    ].join(' ')
  );
}

function filter(query, locale) {
  let out = cases.slice();
  if (query.status) out = out.filter((c) => c.status === query.status);
  if (query.category) out = out.filter((c) => c.category === query.category);
  if (query.sector) out = out.filter((c) => c.sectors.includes(query.sector));
  if (query.country) out = out.filter((c) => c.country === query.country);
  if (query.decade) out = out.filter((c) => String(c.decade) === String(query.decade));
  if (query.warned === '1') out = out.filter((c) => c.warned);
  if (query.q) {
    const needle = norm(query.q);
    if (needle) out = out.filter((c) => searchIndex(c, locale).includes(needle));
  }
  return out;
}

const featured = cases.filter((c) => c.featured);

module.exports = {
  cases, bySlug, taxonomy, counts, stats, featured, filter,
  sectorLabel, countryLabel,
  STATUS_ORDER, CATEGORY_ORDER
};
