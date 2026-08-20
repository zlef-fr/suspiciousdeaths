'use strict';

const { t, loc, fmtDate, DEFAULT_LOCALE } = require('./i18n');
const D = require('./data');

const SITE = process.env.SITE_ORIGIN || 'https://suspiciousdeathsinthe.world';
const BUILD = '7';

function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// URL for a path in a given locale: EN lives at the root, FR under /fr.
function url(locale, p) {
  const clean = p === '/' ? '' : p;
  return locale === DEFAULT_LOCALE ? (clean || '/') : '/fr' + (clean || '');
}
function abs(locale, p) { return SITE + url(locale, p); }

const STATUS_CLASS = {
  established: 'st-established',
  contested: 'st-contested',
  unsolved: 'st-unsolved',
  unsupported: 'st-unsupported'
};

function statusBadge(status, locale, size) {
  return `<span class="sd-status ${STATUS_CLASS[status] || ''}${size ? ' sd-status--' + size : ''}">${esc(t(locale, 'status.' + status))}</span>`;
}

function head(opts) {
  const { locale, title, description, path, jsonld, noindex } = opts;
  const other = locale === 'en' ? 'fr' : 'en';
  const fullTitle = title ? `${title} — ${t(locale, 'seo.suffix')}` : `${t(locale, 'site.name')} — ${t(locale, 'site.tagline')}`;
  return `<!doctype html>
<html lang="${locale}" dir="ltr">
<head>
<!--zlef-seo-->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(abs(locale, path))}">
<link rel="alternate" hreflang="en" href="${esc(abs('en', path))}">
<link rel="alternate" hreflang="fr" href="${esc(abs('fr', path))}">
<link rel="alternate" hreflang="x-default" href="${esc(abs('en', path))}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">'}
<meta property="og:type" content="${opts.ogType || 'website'}">
<meta property="og:site_name" content="${esc(t(locale, 'site.name'))}">
<meta property="og:locale" content="${locale === 'fr' ? 'fr_FR' : 'en_GB'}">
<meta property="og:locale:alternate" content="${other === 'fr' ? 'fr_FR' : 'en_GB'}">
<meta property="og:url" content="${esc(abs(locale, path))}">
<meta property="og:title" content="${esc(title || t(locale, 'site.name'))}">
<meta property="og:description" content="${esc(description)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title || t(locale, 'site.name'))}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="https://assets.zlef.fr/favicon.svg" type="image/svg+xml">
<link rel="icon" href="https://assets.zlef.fr/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="https://assets.zlef.fr/apple-touch-icon.png">
<!--/zlef-seo-->
<link rel="alternate" type="application/rss+xml" title="${esc(t(locale, 'site.name'))}" href="/feed.xml">
<link rel="stylesheet" href="https://da.zlef.fr/tokens.css">
<link rel="stylesheet" href="/brand.css?v=${BUILD}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body class="zl-body">
<a class="sd-skip" href="#main">${esc(t(locale, 'sr.skip'))}</a>`;
}

function header(locale, active) {
  const nav = [
    ['/cases', 'nav.cases'],
    ['/categories', 'nav.categories'],
    ['/method', 'nav.method'],
    ['/data', 'nav.data'],
    ['/about', 'nav.about']
  ];
  return `<header class="zl-header sd-header">
  <a class="zl-header__brand sd-brand" href="${url(locale, '/')}">
    <span class="sd-brand__mark" aria-hidden="true"></span>
    <span class="sd-brand__text"><b>suspiciousdeaths</b><i>inthe.world</i></span>
  </a>
  <nav class="zl-header__nav" aria-label="Main">
    ${nav.map(([p, k]) => `<a class="zl-navlink${active === p ? ' zl-navlink--active' : ''}" href="${url(locale, p)}">${esc(t(locale, k))}</a>`).join('')}
  </nav>
</header>`;
}

function footer(locale, path) {
  const other = locale === 'en' ? 'fr' : 'en';
  return `<footer class="zl-footer sd-footer">
  <p class="sd-footer__line">${esc(t(locale, 'footer.rights'))}</p>
  <nav class="sd-footer__nav">
    <a class="zl-link zl-link--quiet" href="${url(locale, '/method')}">${esc(t(locale, 'method.title'))}</a>
    <a class="zl-link zl-link--quiet" href="${url(locale, '/data')}">${esc(t(locale, 'data.title'))}</a>
    <a class="zl-link zl-link--quiet" href="/api/cases">API</a>
    <a class="zl-link zl-link--quiet" href="/llms.txt">llms.txt</a>
    <a class="zl-link zl-link--quiet" href="/feed.xml">RSS</a>
    <a class="zl-link zl-link--quiet" href="${url(other, path)}" hreflang="${other}" rel="alternate">${esc(t(locale, 'footer.lang'))}</a>
  </nav>
  <p class="sd-footer__meta">${esc(t(locale, 'footer.builtby'))}</p>
</footer>
<script defer src="https://assets.zlef.fr/track.js"></script>
<script defer src="/app.js?v=${BUILD}"></script>
</body></html>`;
}

// ---- cards ----------------------------------------------------------------

function caseCard(c, locale) {
  const sectors = c.sectors.slice(0, 2).map((s) => `<span class="sd-chip">${esc(D.sectorLabel(s, locale))}</span>`).join('');
  return `<article class="sd-card">
  <a class="sd-card__link" href="${url(locale, '/case/' + c.slug)}">
    <div class="sd-card__top">
      ${statusBadge(c.status, locale, 'sm')}
      <span class="sd-card__year">${c.year || ''}</span>
    </div>
    <h3 class="sd-card__name">${esc(c.name)}</h3>
    <p class="sd-card__role">${esc(loc(c, 'role', locale))}</p>
    <p class="sd-card__sum">${esc(truncate(loc(c, 'summary', locale), 168))}</p>
    <div class="sd-card__foot">
      ${sectors}
      <span class="sd-chip sd-chip--geo">${esc(D.countryLabel(c.country, locale))}</span>
      ${c.warned ? '<span class="sd-chip sd-chip--warn" title="Stated a warning before dying">⚑</span>' : ''}
    </div>
  </a>
</article>`;
}

function truncate(s, n) {
  const str = String(s || '');
  if (str.length <= n) return str;
  return str.slice(0, n).replace(/\s+\S*$/, '') + '…';
}

// ---- JSON-LD --------------------------------------------------------------

function caseJsonLd(c, locale) {
  const person = {
    '@type': 'Person',
    name: c.name,
    description: loc(c, 'role', locale)
  };
  if (c.born) person.birthDate = c.born;
  if (c.died) person.deathDate = c.died;
  if (c.place_en) person.deathPlace = { '@type': 'Place', name: loc(c, 'place', locale) };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': abs(locale, '/case/' + c.slug) + '#article',
        headline: c.name + ' — ' + loc(c, 'role', locale),
        description: loc(c, 'summary', locale),
        inLanguage: locale,
        datePublished: c.updated,
        dateModified: c.updated,
        mainEntityOfPage: abs(locale, '/case/' + c.slug),
        about: person,
        isPartOf: { '@type': 'Dataset', '@id': SITE + '/#dataset' },
        citation: c.sources.map((s) => ({ '@type': 'CreativeWork', name: s.t, url: s.u })),
        publisher: { '@type': 'Organization', name: 'Suspicious Deaths in the World', url: SITE }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t(locale, 'site.name'), item: abs(locale, '/') },
          { '@type': 'ListItem', position: 2, name: t(locale, 'nav.cases'), item: abs(locale, '/cases') },
          { '@type': 'ListItem', position: 3, name: c.name, item: abs(locale, '/case/' + c.slug) }
        ]
      }
    ]
  };
}

function siteJsonLd(locale) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': SITE + '/#website',
        url: SITE,
        name: t(locale, 'site.name'),
        description: t(locale, 'site.desc'),
        inLanguage: locale,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: SITE + '/cases?q={search_term_string}' },
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Dataset',
        '@id': SITE + '/#dataset',
        name: t(locale, 'site.name'),
        description: t(locale, 'site.desc'),
        url: SITE + '/data',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: { '@type': 'Organization', name: 'Suspicious Deaths in the World', url: SITE },
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: SITE + '/data/cases.json' },
          { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: SITE + '/data/cases.csv' }
        ],
        variableMeasured: ['name', 'date of death', 'country', 'field', 'official ruling', 'evidentiary status', 'sources']
      }
    ]
  };
}

module.exports = {
  SITE, BUILD, esc, url, abs, head, header, footer, caseCard, statusBadge,
  truncate, caseJsonLd, siteJsonLd
};
