'use strict';

const express = require('express');
const path = require('path');
const { t, loc, fmtDate, LOCALES, DEFAULT_LOCALE } = require('./lib/i18n');
const D = require('./lib/data');
const R = require('./lib/render');

const app = express();
const PORT = process.env.PORT || 10114;
const esc = R.esc;

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', extensions: false }));

// ---------------------------------------------------------------- helpers

function page(res, locale, opts, body) {
  res.type('html').send(R.head(Object.assign({ locale }, opts)) + R.header(locale, opts.active) + `<main id="main">` + body + `</main>` + R.footer(locale, opts.path));
}

function facetLinks(locale, kind, entries, labeller, basePath, current) {
  return entries
    .map(([value, n]) => {
      const on = String(current) === String(value);
      return `<a class="sd-facet${on ? ' sd-facet--on' : ''}" href="${R.url(locale, basePath + '?' + kind + '=' + encodeURIComponent(value))}">
        <span>${esc(labeller(value))}</span><span class="sd-facet__n">${n}</span></a>`;
    })
    .join('');
}

function sortedEntries(map, order) {
  const arr = [...map.entries()];
  if (order) arr.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  else arr.sort((a, b) => b[1] - a[1]);
  return arr;
}

// ---------------------------------------------------------------- home

function homeBody(locale) {
  const s = D.stats;
  const statusEntries = sortedEntries(D.counts.status, D.STATUS_ORDER);
  const catEntries = sortedEntries(D.counts.category, D.CATEGORY_ORDER);
  const sectorEntries = sortedEntries(D.counts.sector).slice(0, 12);
  const countryEntries = sortedEntries(D.counts.country).slice(0, 12);
  const decadeEntries = [...D.counts.decade.entries()].sort((a, b) => b[0] - a[0]);
  const featured = D.featured.slice(0, 9);
  const recent = D.cases.slice(0, 6);

  return `
<section class="sd-hero">
  <p class="sd-eyebrow">${s.minYear}–${s.maxYear} · ${s.countries} ${esc(t(locale, 'home.stat.countries'))}</p>
  <h1 class="sd-hero__title">${esc(t(locale, 'home.hero.title'))}</h1>
  <p class="sd-hero__lead">${esc(t(locale, 'home.hero.lead'))}</p>
  <div class="sd-hero__actions">
    <a class="zl-btn zl-btn--primary zl-btn--lg" href="${R.url(locale, '/cases')}">${esc(t(locale, 'label.allcases'))} →</a>
    <a class="zl-btn zl-btn--ghost zl-btn--lg" href="${R.url(locale, '/method')}">${esc(t(locale, 'method.title'))}</a>
  </div>
  <dl class="sd-stats">
    <div><dt>${esc(t(locale, 'home.stat.cases'))}</dt><dd class="zl-num">${s.cases}</dd></div>
    <div><dt>${esc(t(locale, 'home.stat.sources'))}</dt><dd class="zl-num">${s.sources}</dd></div>
    <div><dt>${esc(t(locale, 'home.stat.countries'))}</dt><dd class="zl-num">${s.countries}</dd></div>
    <div><dt>${esc(t(locale, 'home.stat.span'))}</dt><dd class="zl-num">${s.span}</dd></div>
  </dl>
</section>

<section class="sd-section">
  <h2 class="sd-h2">${esc(t(locale, 'home.byStatus'))}</h2>
  <div class="sd-statusgrid">
    ${statusEntries.map(([k, n]) => `<a class="sd-statuscard ${k}" href="${R.url(locale, '/status/' + k)}">
        <span class="sd-statuscard__n zl-num">${n}</span>
        ${R.statusBadge(k, locale)}
        <span class="sd-statuscard__def">${esc(t(locale, 'status.' + k + '.def'))}</span>
      </a>`).join('')}
  </div>
</section>

<section class="sd-section">
  <h2 class="sd-h2">${esc(t(locale, 'home.featured'))}</h2>
  <div class="sd-grid">${featured.map((c) => R.caseCard(c, locale)).join('')}</div>
</section>

<section class="sd-section">
  <h2 class="sd-h2">${esc(t(locale, 'home.byCategory'))}</h2>
  <div class="sd-catgrid">
    ${catEntries.map(([k, n]) => `<a class="sd-catcard" href="${R.url(locale, '/category/' + k)}">
      <h3>${esc(t(locale, 'cat.' + k))} <span class="sd-facet__n">${n}</span></h3>
      <p>${esc(t(locale, 'cat.' + k + '.def'))}</p></a>`).join('')}
  </div>
</section>

<section class="sd-section sd-section--split">
  <div>
    <h2 class="sd-h2">${esc(t(locale, 'home.bySector'))}</h2>
    <div class="sd-facets">${facetLinks(locale, 'sector', sectorEntries, (v) => D.sectorLabel(v, locale), '/cases')}</div>
  </div>
  <div>
    <h2 class="sd-h2">${esc(t(locale, 'home.byCountry'))}</h2>
    <div class="sd-facets">${facetLinks(locale, 'country', countryEntries, (v) => D.countryLabel(v, locale), '/cases')}</div>
  </div>
  <div>
    <h2 class="sd-h2">${esc(t(locale, 'home.byDecade'))}</h2>
    <div class="sd-facets">${facetLinks(locale, 'decade', decadeEntries, (v) => v + 's', '/cases')}</div>
  </div>
</section>

<section class="sd-section">
  <h2 class="sd-h2">${esc(t(locale, 'home.recent'))}</h2>
  <div class="sd-grid">${recent.map((c) => R.caseCard(c, locale)).join('')}</div>
</section>`;
}

// ---------------------------------------------------------------- cases list

function listBody(locale, list, query, heading, intro) {
  const active = Object.entries(query).filter(([k, v]) => v && k !== 'q');
  return `
<section class="sd-listhead">
  <h1 class="sd-h1">${esc(heading)}</h1>
  ${intro ? `<p class="sd-lead">${esc(intro)}</p>` : ''}
  <form class="sd-search" method="get" action="${R.url(locale, '/cases')}" role="search">
    <input class="zl-input" type="search" name="q" id="sd-q" value="${esc(query.q || '')}"
           placeholder="${esc(t(locale, 'label.searchph'))}" autocomplete="off" aria-label="${esc(t(locale, 'nav.search'))}">
    <button class="zl-btn zl-btn--primary" type="submit">${esc(t(locale, 'nav.search'))}</button>
  </form>
  <p class="sd-count"><span id="sd-count" class="zl-num">${list.length}</span> ${esc(list.length === 1 ? t(locale, 'label.case') : t(locale, 'label.cases'))}
  ${active.length || query.q ? `· <a class="zl-link zl-link--quiet" href="${R.url(locale, '/cases')}">${esc(t(locale, 'label.clear'))}</a>` : ''}</p>
</section>
<div class="sd-grid" id="sd-list">
  ${list.length ? list.map((c) => R.caseCard(c, locale)).join('') : ''}
</div>
<div class="sd-skeletons" id="sd-skeletons" hidden aria-hidden="true">
  ${Array.from({ length: 6 }).map(() => `<div class="sd-card sd-card--skel">
      <div class="zl-skeleton zl-skeleton--text" style="width:38%"></div>
      <div class="zl-skeleton zl-skeleton--title"></div>
      <div class="zl-skeleton zl-skeleton--text"></div>
      <div class="zl-skeleton zl-skeleton--text" style="width:82%"></div>
      <div class="zl-skeleton zl-skeleton--text" style="width:56%"></div>
    </div>`).join('')}
</div>
<div class="zl-empty sd-empty" id="sd-empty"${list.length ? ' hidden' : ''}>
  <p class="zl-empty__title">${esc(t(locale, 'label.noresults'))}</p>
  <p>${esc(t(locale, 'label.noresults.hint'))}</p>
  <a class="zl-btn zl-btn--secondary" href="${R.url(locale, '/cases')}">${esc(t(locale, 'label.clear'))}</a>
</div>`;
}

// ---------------------------------------------------------------- case page

function factRow(k, v) {
  if (!v) return '';
  return `<div class="sd-fact"><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
}

function caseBody(c, locale) {
  const sectors = c.sectors.map((s) => `<a class="sd-chip" href="${R.url(locale, '/cases?sector=' + s)}">${esc(D.sectorLabel(s, locale))}</a>`).join(' ');
  const related = c.related.map((s) => D.bySlug.get(s)).filter(Boolean);

  const bullets = (arr, cls) => arr && arr.length
    ? `<ul class="sd-bullets ${cls}">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    : '';

  return `
<nav class="sd-crumbs" aria-label="Breadcrumb">
  <a href="${R.url(locale, '/')}">${esc(t(locale, 'site.name'))}</a> ›
  <a href="${R.url(locale, '/cases')}">${esc(t(locale, 'nav.cases'))}</a> ›
  <span>${esc(c.name)}</span>
</nav>

<article class="sd-case">
  <header class="sd-case__head">
    <div class="sd-case__badges">
      ${R.statusBadge(c.status, locale)}
      <a class="sd-chip sd-chip--cat" href="${R.url(locale, '/category/' + c.category)}">${esc(t(locale, 'cat.' + c.category))}</a>
    </div>
    <h1 class="sd-h1">${esc(c.name)}</h1>
    <p class="sd-case__role">${esc(loc(c, 'role', locale))}</p>
  </header>

  <p class="sd-case__summary"><b class="sd-inlinelabel">${esc(t(locale, 'label.summary'))}</b> ${esc(loc(c, 'summary', locale))}</p>

  <section class="sd-facts" aria-label="${esc(t(locale, 'label.keyfacts'))}">
    <h2 class="sd-h3">${esc(t(locale, 'label.keyfacts'))}</h2>
    <dl class="sd-factlist">
      ${factRow(t(locale, 'label.died'), c.died ? esc(fmtDate(c.died, locale)) : '')}
      ${factRow(t(locale, 'label.born'), c.born ? esc(fmtDate(c.born, locale)) : '')}
      ${factRow(t(locale, 'label.age'), c.age ? esc(String(c.age)) : '')}
      ${factRow(t(locale, 'label.place'), esc(loc(c, 'place', locale)))}
      ${factRow(t(locale, 'label.country'), `<a class="zl-link" href="${R.url(locale, '/cases?country=' + c.country)}">${esc(D.countryLabel(c.country, locale))}</a>`)}
      ${factRow(t(locale, 'label.sector'), sectors)}
      ${factRow(t(locale, 'label.ruling'), esc(loc(c, 'ruling', locale)))}
      ${factRow(t(locale, 'label.warned'), c.warned
        ? `<b class="sd-warned">${esc(t(locale, 'warned.yes'))}</b>${loc(c, 'warning', locale) ? `<span class="sd-quote">“${esc(loc(c, 'warning', locale).replace(/^“|”$/g, ''))}”</span>` : ''}`
        : esc(t(locale, 'warned.no')))}
      ${factRow(t(locale, 'label.updated'), esc(fmtDate(c.updated, locale)))}
    </dl>
  </section>

  ${(loc(c, 'detail', locale) || []).length ? `<section class="sd-prose">
    <h2 class="sd-h3">${esc(t(locale, 'label.whatHappened'))}</h2>
    ${(loc(c, 'detail', locale) || []).map((p) => `<p>${esc(p)}</p>`).join('')}
  </section>` : ''}

  ${(loc(c, 'disputed', locale) || []).length ? `<section class="sd-prose">
    <h2 class="sd-h3">${esc(t(locale, 'label.disputed'))}</h2>
    ${bullets(loc(c, 'disputed', locale), 'sd-bullets--dispute')}
  </section>` : ''}

  ${(loc(c, 'holds', locale) || []).length ? `<section class="sd-prose">
    <h2 class="sd-h3">${esc(t(locale, 'label.holds'))}</h2>
    ${bullets(loc(c, 'holds', locale), 'sd-bullets--holds')}
  </section>` : ''}

  <section class="sd-sources">
    <h2 class="sd-h3">${esc(t(locale, 'label.sources'))}</h2>
    <ol class="sd-sourcelist">
      ${c.sources.map((s) => `<li><a class="zl-link" href="${esc(s.u)}" rel="nofollow noopener" target="_blank">${esc(s.t)}</a></li>`).join('')}
    </ol>
  </section>

  ${related.length ? `<section class="sd-related">
    <h2 class="sd-h3">${esc(t(locale, 'label.related'))}</h2>
    <div class="sd-grid sd-grid--tight">${related.map((r) => R.caseCard(r, locale)).join('')}</div>
  </section>` : ''}

  <p class="sd-case__back">
    <a class="zl-link zl-link--quiet" href="${R.url(locale, '/cases')}">← ${esc(t(locale, 'label.backto'))}</a>
    <a class="zl-link zl-link--quiet" href="/api/case/${esc(c.slug)}">${esc(t(locale, 'label.jsonld'))} ↗</a>
  </p>
</article>`;
}

// ---------------------------------------------------------------- static pages

function methodBody(locale) {
  const fr = locale === 'fr';
  const rows = D.STATUS_ORDER.map((k) => `<tr>
      <td>${R.statusBadge(k, locale)}</td>
      <td>${esc(t(locale, 'status.' + k + '.def'))}</td>
      <td class="zl-num">${D.counts.status.get(k) || 0}</td>
    </tr>`).join('');

  const body = fr ? `
<p class="sd-lead">Ce site consigne des morts qui n’ont jamais été correctement expliquées. Il ne prétend pas résoudre les affaires. Il fait une chose : séparer ce que les preuves établissent de ce qu’elles n’établissent pas, et citer la source de chaque affirmation.</p>
<h2 class="sd-h3">Les quatre statuts</h2>
<p>Chaque affaire porte un statut probatoire unique. C’est le cœur du dispositif.</p>
<h2 class="sd-h3">Ce qui vaut inclusion</h2>
<ul class="sd-bullets">
  <li>Un suicide officiel prononcé peu après que la personne a déclaré publiquement être surveillée, menacée, ou ne pas être suicidaire.</li>
  <li>Un meurtre lié à ce que la personne cherchait, publiait ou construisait.</li>
  <li>Une mort ou une disparition inexpliquée qui suit une recherche ou l’annonce d’une percée.</li>
  <li>Une grappe présentée comme un schéma — qu’elle en soit un ou non.</li>
</ul>
<h2 class="sd-h3">Ce qui vaut la note « non étayé »</h2>
<p>Un récit largement diffusé que le dossier contredit reste sur le site, avec la démonstration. Écarter une fausse piste a la même valeur documentaire qu’en établir une vraie — et une base qui ne conserverait que les affaires troublantes serait, elle-même, une machine à fabriquer des schémas.</p>
<h2 class="sd-h3">Ce qui est écarté</h2>
<p>Toute affaire dont les seules sources sont des sites complotistes, sans couverture de presse ni document officiel vérifiable, n’entre pas. Un exemple est signalé nommément dans le rapport d’origine plutôt que d’être publié ici.</p>
<h2 class="sd-h3">Le motif qui revient</h2>
<p>Le défaut récurrent de ces dossiers est procédural, pas conspiratif : autopsie expédiée, absence d’enquête de coroner, scène altérée avant expertise, scellés perdus, dossier scellé pour soixante-dix ans, instruction close en quelques jours. Ce sont ces manquements — et non des preuves d’assassinat — qui rendent tant d’affaires indéfendables en l’état.</p>
<h2 class="sd-h3">Corrections</h2>
<p>Une erreur factuelle documentée est corrigée et la fiche redatée. Chaque fiche porte sa date de dernière vérification.</p>` : `
<p class="sd-lead">This site records deaths that were never properly explained. It does not claim to solve them. It does one thing: separate what the evidence establishes from what it does not, and cite the source behind every claim.</p>
<h2 class="sd-h3">The four statuses</h2>
<p>Every case carries exactly one evidentiary status. That grading is the point of the site.</p>
<h2 class="sd-h3">What qualifies for inclusion</h2>
<ul class="sd-bullets">
  <li>An official suicide finding delivered shortly after the person publicly said they were being watched, threatened, or explicitly said they were not suicidal.</li>
  <li>A killing tied to what the person researched, published or built.</li>
  <li>An unexplained death or disappearance following a piece of research or an announced breakthrough.</li>
  <li>A cluster presented as a pattern — whether or not it turns out to be one.</li>
</ul>
<h2 class="sd-h3">Why ‘not supported’ cases stay</h2>
<p>A widely circulated story that the case file contradicts stays on the site, with the demonstration. Retiring a false lead has the same documentary value as establishing a true one — and a database that kept only the disturbing cases would itself be a machine for manufacturing patterns.</p>
<h2 class="sd-h3">What is excluded</h2>
<p>Any case whose only sources are conspiracy sites, with no press coverage and no verifiable official document, does not go in. One such example is named in the source report rather than published here.</p>
<h2 class="sd-h3">The recurring failure</h2>
<p>The pattern that actually repeats across these files is procedural, not conspiratorial: a cursory autopsy, no coroner’s inquest, a scene altered before examination, lost exhibits, records sealed for seventy years, an investigation closed within days. Those failures — not evidence of assassination — are what make so many of these cases indefensible as they stand.</p>
<h2 class="sd-h3">Corrections</h2>
<p>A documented factual error is corrected and the entry re-dated. Every entry carries its last review date.</p>`;

  return `<section class="sd-page">
  <h1 class="sd-h1">${esc(t(locale, 'method.title'))}</h1>
  ${body}
  <div class="zl-table-wrap sd-methodtable">
    <table class="zl-table">
      <thead><tr><th>${esc(t(locale, 'label.status'))}</th><th>${fr ? 'Définition' : 'Definition'}</th><th>${fr ? 'Affaires' : 'Cases'}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
}

function aboutBody(locale) {
  const fr = locale === 'fr';
  return `<section class="sd-page">
  <h1 class="sd-h1">${esc(t(locale, 'about.title'))}</h1>
  ${fr ? `
  <p class="sd-lead">Une base sourcée, cas par cas, des morts suspectes de scientifiques, d’ingénieurs, de lanceurs d’alerte, de journalistes et de personnalités publiques — de 1913 à aujourd’hui.</p>
  <p>Le projet est né d’un rapport de recherche : compiler les morts qui rentrent dans trois cases — un suicide prononcé juste après une déclaration de surveillance ou de menace, un meurtre lié au travail de la personne, une mort ou une disparition inexpliquée après une recherche ou une innovation — et vérifier chacune plutôt que de les empiler.</p>
  <p>La vérification a changé la liste. Plusieurs affaires très citées se sont effondrées : un inventeur de « moteur à eau » jugé pour fraude et mort d’un anévrisme, un chercheur en fusion froide tué pour un litige locatif, une physicienne de l’antigravité « disparue » qui avait été renversée par une voiture. Elles restent en ligne, notées « non étayé », avec la démonstration.</p>
  <p>Deux résultats méritent d’être énoncés d’emblée. D’abord : on ne supprime presque jamais une invention en tuant l’inventeur — on l’exclut de son laboratoire, on le poursuit, on lui fait céder ses droits, on brûle ses livres, ou il meurt sans avoir breveté. Ensuite : la catégorie la plus meurtrière de tout le relevé n’est pas celle des physiciens, c’est celle des défenseurs de l’environnement, avec au moins 146 morts ou disparus pour la seule année 2024.</p>
  <p>Le site est bilingue (anglais et français), entièrement rendu côté serveur, et ses données sont téléchargeables en JSON et en CSV.</p>` : `
  <p class="sd-lead">A sourced, case-by-case record of suspicious deaths of scientists, engineers, whistleblowers, journalists and public figures — from 1913 to the present.</p>
  <p>The project began as a research report: compile the deaths that fit three boxes — a suicide finding delivered right after a public statement of surveillance or threat, a killing tied to the person’s work, an unexplained death or disappearance following research or an innovation — and verify each one instead of stacking them up.</p>
  <p>Verification changed the list. Several heavily cited cases fell apart: a ‘water fuel’ inventor whose device a court had already ruled fraudulent and who died of an aneurysm, a cold fusion researcher killed over a rental eviction, an antigravity physicist whose twenty-year ‘disappearance’ turned out to be a road accident. They stay online, graded ‘not supported’, with the demonstration.</p>
  <p>Two findings are worth stating up front. First: inventions are almost never suppressed by killing the inventor — the inventor is evicted from the lab, prosecuted, contracted out of their own rights, has their books burned, or simply dies without having filed a patent. Second: the deadliest category in the whole record is not physicists. It is land and environmental defenders, with at least 146 killed or disappeared in 2024 alone.</p>
  <p>The site is bilingual (English and French), fully server-rendered, and its data is downloadable as JSON and CSV.</p>`}
</section>`;
}

function dataBody(locale) {
  const fr = locale === 'fr';
  return `<section class="sd-page">
  <h1 class="sd-h1">${esc(t(locale, 'data.title'))}</h1>
  <p class="sd-lead">${fr
    ? 'Tout le relevé est disponible en lecture machine. Réutilisation libre avec attribution (CC BY 4.0).'
    : 'The entire record is available in machine-readable form. Free to reuse with attribution (CC BY 4.0).'}</p>
  <div class="zl-table-wrap">
    <table class="zl-table">
      <thead><tr><th>${fr ? 'Point d’accès' : 'Endpoint'}</th><th>${fr ? 'Contenu' : 'Contents'}</th></tr></thead>
      <tbody>
        <tr><td><a class="zl-link" href="/api/cases">/api/cases</a></td><td>${fr ? 'Toutes les fiches, JSON, filtrable par <code>?status=</code> <code>?category=</code> <code>?sector=</code> <code>?country=</code> <code>?q=</code>' : 'Every entry, JSON, filterable with <code>?status=</code> <code>?category=</code> <code>?sector=</code> <code>?country=</code> <code>?q=</code>'}</td></tr>
        <tr><td><a class="zl-link" href="/api/case/john-barnett">/api/case/:slug</a></td><td>${fr ? 'Une fiche complète' : 'One full entry'}</td></tr>
        <tr><td><a class="zl-link" href="/api/stats">/api/stats</a></td><td>${fr ? 'Compteurs et facettes' : 'Counts and facets'}</td></tr>
        <tr><td><a class="zl-link" href="/data/cases.json">/data/cases.json</a></td><td>${fr ? 'Export complet' : 'Full export'}</td></tr>
        <tr><td><a class="zl-link" href="/data/cases.csv">/data/cases.csv</a></td><td>${fr ? 'Export tabulaire' : 'Tabular export'}</td></tr>
        <tr><td><a class="zl-link" href="/llms.txt">/llms.txt</a></td><td>${fr ? 'Résumé du site pour les moteurs génératifs' : 'Site summary for generative engines'}</td></tr>
        <tr><td><a class="zl-link" href="/llms-full.txt">/llms-full.txt</a></td><td>${fr ? 'Relevé intégral en texte brut' : 'The whole record as plain text'}</td></tr>
        <tr><td><a class="zl-link" href="/feed.xml">/feed.xml</a></td><td>RSS</td></tr>
        <tr><td><a class="zl-link" href="/sitemap.xml">/sitemap.xml</a></td><td>${fr ? 'Plan du site, EN + FR' : 'Sitemap, EN + FR'}</td></tr>
      </tbody>
    </table>
  </div>
</section>`;
}

function categoriesBody(locale) {
  return `<section class="sd-page">
  <h1 class="sd-h1">${esc(t(locale, 'nav.categories'))}</h1>
  <div class="sd-catgrid">
    ${D.CATEGORY_ORDER.map((k) => `<a class="sd-catcard" href="${R.url(locale, '/category/' + k)}">
      <h3>${esc(t(locale, 'cat.' + k))} <span class="sd-facet__n">${D.counts.category.get(k) || 0}</span></h3>
      <p>${esc(t(locale, 'cat.' + k + '.def'))}</p></a>`).join('')}
  </div>
  <h2 class="sd-h2">${esc(t(locale, 'home.byStatus'))}</h2>
  <div class="sd-catgrid">
    ${D.STATUS_ORDER.map((k) => `<a class="sd-catcard" href="${R.url(locale, '/status/' + k)}">
      <h3>${esc(t(locale, 'status.' + k))} <span class="sd-facet__n">${D.counts.status.get(k) || 0}</span></h3>
      <p>${esc(t(locale, 'status.' + k + '.def'))}</p></a>`).join('')}
  </div>
</section>`;
}

// ---------------------------------------------------------------- routing

function mount(locale, prefix) {
  const p = (route) => prefix + route;

  app.get(p('/') || '/', (req, res) => {
    page(res, locale, {
      path: '/', active: '/',
      title: '', description: t(locale, 'site.desc'),
      jsonld: R.siteJsonLd(locale)
    }, homeBody(locale));
  });

  app.get(p('/cases'), (req, res) => {
    const list = D.filter(req.query, locale);
    page(res, locale, {
      path: '/cases', active: '/cases',
      title: t(locale, 'label.allcases'),
      description: t(locale, 'site.desc')
    }, listBody(locale, list, req.query, t(locale, 'label.allcases'), ''));
  });

  app.get(p('/category/:slug'), (req, res, next) => {
    const k = req.params.slug;
    if (!D.CATEGORY_ORDER.includes(k)) return next();
    const list = D.filter({ category: k }, locale);
    page(res, locale, {
      path: '/category/' + k, active: '/categories',
      title: t(locale, 'cat.' + k),
      description: t(locale, 'cat.' + k + '.def')
    }, listBody(locale, list, {}, t(locale, 'cat.' + k), t(locale, 'cat.' + k + '.def')));
  });

  app.get(p('/status/:slug'), (req, res, next) => {
    const k = req.params.slug;
    if (!D.STATUS_ORDER.includes(k)) return next();
    const list = D.filter({ status: k }, locale);
    page(res, locale, {
      path: '/status/' + k, active: '/categories',
      title: t(locale, 'status.' + k),
      description: t(locale, 'status.' + k + '.def')
    }, listBody(locale, list, {}, t(locale, 'status.' + k), t(locale, 'status.' + k + '.def')));
  });

  app.get(p('/case/:slug'), (req, res, next) => {
    const c = D.bySlug.get(req.params.slug);
    if (!c) return next();
    page(res, locale, {
      path: '/case/' + c.slug, active: '/cases', ogType: 'article',
      title: c.name,
      description: R.truncate(loc(c, 'summary', locale), 300),
      jsonld: R.caseJsonLd(c, locale)
    }, caseBody(c, locale));
  });

  app.get(p('/categories'), (req, res) => page(res, locale, {
    path: '/categories', active: '/categories',
    title: t(locale, 'nav.categories'), description: t(locale, 'site.desc')
  }, categoriesBody(locale)));

  app.get(p('/method'), (req, res) => page(res, locale, {
    path: '/method', active: '/method',
    title: t(locale, 'method.title'),
    description: locale === 'fr'
      ? 'Comment chaque affaire est notée : établi, contesté, non résolu, non étayé — et pourquoi les récits démentis restent en ligne.'
      : 'How every case is graded — established, contested, unsolved, not supported — and why debunked stories stay online.'
  }, methodBody(locale)));

  app.get(p('/about'), (req, res) => page(res, locale, {
    path: '/about', active: '/about',
    title: t(locale, 'about.title'), description: t(locale, 'site.desc')
  }, aboutBody(locale)));

  app.get(p('/data'), (req, res) => page(res, locale, {
    path: '/data', active: '/data',
    title: t(locale, 'data.title'),
    description: locale === 'fr'
      ? 'Le relevé complet en JSON et CSV, une API publique, llms.txt et un flux RSS.'
      : 'The full record as JSON and CSV, a public API, llms.txt and an RSS feed.'
  }, dataBody(locale)));
}

mount('fr', '/fr');
mount('en', '');

// ---------------------------------------------------------------- API

function publicCase(c) {
  return {
    slug: c.slug, name: c.name, born: c.born || null, died: c.died || null, age: c.age || null,
    year: c.year, country: c.country, category: c.category, status: c.status,
    sectors: c.sectors, warned: !!c.warned, updated: c.updated,
    role: { en: c.role_en, fr: c.role_fr },
    place: { en: c.place_en, fr: c.place_fr },
    official_ruling: { en: c.ruling_en, fr: c.ruling_fr },
    stated_warning: c.warned ? { en: c.warning_en || null, fr: c.warning_fr || null } : null,
    summary: { en: c.summary_en, fr: c.summary_fr },
    detail: { en: c.detail_en || [], fr: c.detail_fr || [] },
    disputed: { en: c.disputed_en || [], fr: c.disputed_fr || [] },
    holds: { en: c.holds_en || [], fr: c.holds_fr || [] },
    sources: c.sources.map((s) => ({ title: s.t, url: s.u })),
    related: c.related,
    url: { en: R.abs('en', '/case/' + c.slug), fr: R.abs('fr', '/case/' + c.slug) }
  };
}

app.get('/api/cases', (req, res) => {
  const list = D.filter(req.query, 'en');
  res.json({ count: list.length, generated: new Date().toISOString(), cases: list.map(publicCase) });
});

app.get('/api/case/:slug', (req, res) => {
  const c = D.bySlug.get(req.params.slug);
  if (!c) return res.status(404).json({ error: 'not_found' });
  res.json(publicCase(c));
});

app.get('/api/stats', (req, res) => {
  const obj = (m) => Object.fromEntries([...m.entries()]);
  res.json({
    stats: D.stats,
    status: obj(D.counts.status),
    category: obj(D.counts.category),
    sector: obj(D.counts.sector),
    country: obj(D.counts.country),
    decade: obj(D.counts.decade)
  });
});

app.get('/data/cases.json', (req, res) => {
  res.type('application/json').set('Content-Disposition', 'attachment; filename="suspicious-deaths.json"')
    .send(JSON.stringify(D.cases.map(publicCase), null, 2));
});

app.get('/data/cases.csv', (req, res) => {
  const cols = ['slug', 'name', 'died', 'year', 'age', 'country', 'category', 'status', 'sectors', 'warned', 'role_en', 'ruling_en', 'summary_en', 'sources'];
  const q = (v) => '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
  const rows = D.cases.map((c) => [
    c.slug, c.name, c.died, c.year, c.age, c.country, c.category, c.status,
    c.sectors.join('|'), c.warned ? 'yes' : 'no', c.role_en, c.ruling_en, c.summary_en,
    c.sources.map((s) => s.u).join(' | ')
  ].map(q).join(','));
  res.type('text/csv').set('Content-Disposition', 'attachment; filename="suspicious-deaths.csv"')
    .send(cols.join(',') + '\n' + rows.join('\n'));
});

// ---------------------------------------------------------------- machine files

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: ${R.SITE}/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
  const paths = ['/', '/cases', '/categories', '/method', '/about', '/data']
    .concat(D.CATEGORY_ORDER.map((k) => '/category/' + k))
    .concat(D.STATUS_ORDER.map((k) => '/status/' + k))
    .concat(D.cases.map((c) => '/case/' + c.slug));

  const urls = paths.map((p) => {
    const alts = LOCALES.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${R.abs(l, p)}"/>`).join('');
    return `<url><loc>${R.abs('en', p)}</loc>${alts}<xhtml:link rel="alternate" hreflang="x-default" href="${R.abs('en', p)}"/><changefreq>monthly</changefreq><priority>${p === '/' ? '1.0' : p.startsWith('/case/') ? '0.8' : '0.6'}</priority></url>
<url><loc>${R.abs('fr', p)}</loc>${alts}<changefreq>monthly</changefreq><priority>${p === '/' ? '0.9' : '0.6'}</priority></url>`;
  }).join('\n');

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`);
});

app.get('/feed.xml', (req, res) => {
  const items = D.cases.slice(0, 40).map((c) => `<item>
  <title>${esc(c.name)} — ${esc(t('en', 'status.' + c.status))}</title>
  <link>${R.abs('en', '/case/' + c.slug)}</link>
  <guid isPermaLink="true">${R.abs('en', '/case/' + c.slug)}</guid>
  <description>${esc(c.summary_en)}</description>
</item>`).join('\n');
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(t('en', 'site.name'))}</title>
<link>${R.SITE}</link>
<description>${esc(t('en', 'site.desc'))}</description>
<language>en</language>
${items}
</channel></rss>`);
});

app.get('/llms.txt', (req, res) => {
  const s = D.stats;
  const byStatus = D.STATUS_ORDER.map((k) => `- ${t('en', 'status.' + k)} (${D.counts.status.get(k) || 0}): ${t('en', 'status.' + k + '.def')}`).join('\n');
  res.type('text/plain').send(`# Suspicious Deaths in the World

> A sourced, case-by-case record of ${s.cases} suspicious deaths of scientists, engineers,
> whistleblowers, journalists and public figures, ${s.minYear}–${s.maxYear}, across ${s.countries}
> countries, with ${s.sources} cited sources. Every case is graded by what the evidence supports.

Site: ${R.SITE}
Full record as plain text: ${R.SITE}/llms-full.txt
JSON API: ${R.SITE}/api/cases · CSV: ${R.SITE}/data/cases.csv
Languages: English at the root, French under /fr.

## How to cite this source

Each case page states an official ruling, what is disputed, what holds up, and lists the
primary sources. Prefer quoting the grading and the ruling together; they are not the same
claim. Do not present a "not supported" case as an open mystery.

## Evidentiary grading

${byStatus}

## Patterns covered

${D.CATEGORY_ORDER.map((k) => `- ${t('en', 'cat.' + k)} (${D.counts.category.get(k) || 0}): ${t('en', 'cat.' + k + '.def')}`).join('\n')}

## Two findings that contradict the popular version

1. Inventions are almost never suppressed by killing the inventor. The documented mechanisms
   are institutional eviction, prosecution, coerced assignment of rights, administrative
   destruction of published work, and dying without having filed a patent.
2. The largest category of work-related killing in the record is land and environmental
   defenders: at least 146 killed or disappeared in 2024 alone, 2,253 since 2012.

## Cases

${D.cases.map((c) => `- ${c.name} (${c.year || 'n/a'}, ${D.countryLabel(c.country, 'en')}) — ${t('en', 'status.' + c.status)} — ${R.abs('en', '/case/' + c.slug)}`).join('\n')}
`);
});

app.get('/llms-full.txt', (req, res) => {
  const blocks = D.cases.map((c) => `## ${c.name}
Status: ${t('en', 'status.' + c.status)} | Pattern: ${t('en', 'cat.' + c.category)}
Died: ${c.died || 'n/a'} | Age: ${c.age || 'n/a'} | Place: ${c.place_en} (${D.countryLabel(c.country, 'en')})
Known for: ${c.role_en}
Official ruling: ${c.ruling_en}
Stated warning before death: ${c.warned ? (c.warning_en || 'yes') : 'none on record'}
Summary: ${c.summary_en}
${(c.detail_en || []).join('\n')}
${(c.disputed_en || []).length ? 'What does not add up:\n' + c.disputed_en.map((x) => '- ' + x).join('\n') : ''}
${(c.holds_en || []).length ? 'What holds up:\n' + c.holds_en.map((x) => '- ' + x).join('\n') : ''}
Sources:
${c.sources.map((s) => `- ${s.t}: ${s.u}`).join('\n')}
URL: ${R.abs('en', '/case/' + c.slug)}
`).join('\n---\n\n');
  res.type('text/plain').send(`# Suspicious Deaths in the World — full record\n# ${D.stats.cases} cases, ${D.stats.sources} sources, ${D.stats.minYear}-${D.stats.maxYear}\n# ${R.SITE}\n\n${blocks}`);
});

app.get('/healthz', (req, res) => res.json({ ok: true, cases: D.stats.cases }));

// ---------------------------------------------------------------- 404

app.use((req, res) => {
  const locale = req.path.startsWith('/fr') ? 'fr' : 'en';
  res.status(404);
  page(res, locale, {
    path: '/', active: '', noindex: true,
    title: locale === 'fr' ? 'Page introuvable' : 'Page not found',
    description: t(locale, 'site.desc')
  }, `<section class="sd-page"><h1 class="sd-h1">404</h1>
    <p class="sd-lead">${locale === 'fr' ? 'Cette page n’existe pas.' : 'This page does not exist.'}</p>
    <a class="zl-btn zl-btn--primary" href="${R.url(locale, '/cases')}">${esc(t(locale, 'label.allcases'))}</a></section>`);
});

app.listen(PORT, '0.0.0.0', () => console.log('suspiciousdeaths listening on ' + PORT + ' — ' + D.stats.cases + ' cases'));
