'use strict';

// Two locales. Per the ZLEF design authority, a two-locale project renders NO
// language selector chrome; language lives in the URL prefix instead (/ = en,
// /fr = fr) so both versions are separately indexable and can carry hreflang.
const LOCALES = ['en', 'fr'];
const DEFAULT_LOCALE = 'en';

const DICT = {
  en: {
    'site.name': 'Suspicious Deaths in the World',
    'site.tagline': 'A sourced record of deaths that were never properly explained',
    'site.desc': 'A sourced, case-by-case database of suspicious deaths of scientists, engineers, whistleblowers, journalists and public figures — each one graded by what the evidence actually supports.',
    'nav.cases': 'Cases',
    'nav.categories': 'Categories',
    'nav.method': 'Method',
    'nav.data': 'Data',
    'nav.about': 'About',
    'nav.search': 'Search',
    'home.hero.title': 'Deaths that were never properly explained',
    'home.hero.lead': 'Whistleblowers who said they were not suicidal. Scientists killed for a weapons programme. Inventors whose work vanished with them. Each case here is graded by what the evidence actually supports — and the ones that fall apart under scrutiny are kept, with the demonstration.',
    'home.stat.cases': 'documented cases',
    'home.stat.sources': 'cited sources',
    'home.stat.countries': 'countries',
    'home.stat.span': 'years covered',
    'home.browse': 'Browse the record',
    'home.featured': 'Start here',
    'home.recent': 'Recently added',
    'home.byStatus': 'By evidentiary status',
    'home.byCategory': 'By pattern',
    'home.bySector': 'By field',
    'home.byCountry': 'By country',
    'home.byDecade': 'By decade',
    'label.status': 'Evidentiary status',
    'label.category': 'Pattern',
    'label.sector': 'Field',
    'label.country': 'Country',
    'label.died': 'Died',
    'label.born': 'Born',
    'label.age': 'Age',
    'label.place': 'Place',
    'label.role': 'Known for',
    'label.ruling': 'Official ruling',
    'label.warned': 'Stated warning before death',
    'label.keyfacts': 'Key facts',
    'label.whatHappened': 'What happened',
    'label.disputed': 'What does not add up',
    'label.holds': 'What holds up',
    'label.sources': 'Sources',
    'label.related': 'Related cases',
    'label.updated': 'Last reviewed',
    'label.summary': 'In short',
    'label.readmore': 'Read the case',
    'label.allcases': 'All cases',
    'label.filters': 'Filters',
    'label.clear': 'Clear filters',
    'label.results': 'results',
    'label.noresults': 'No case matches these filters.',
    'label.noresults.hint': 'Widen the search, or clear the filters to see the full record.',
    'label.searchph': 'Search a name, a field, a country…',
    'label.cases': 'cases',
    'label.case': 'case',
    'label.backto': 'Back to all cases',
    'label.jsonld': 'Machine-readable record',
    'status.established': 'Established',
    'status.established.def': 'A court, public inquiry or official commission concluded it was a homicide.',
    'status.contested': 'Contested',
    'status.contested.def': 'The official ruling is suicide or accident, but documented forensic or procedural contradictions remain unresolved.',
    'status.unsolved': 'Unsolved',
    'status.unsolved.def': 'Homicide is established; the perpetrator or the person who ordered it was never identified.',
    'status.unsupported': 'Not supported',
    'status.unsupported.def': 'A widely circulated story that the case file contradicts. Kept here with the demonstration.',
    'cat.suicide-doubt': 'Contested suicide',
    'cat.suicide-doubt.def': 'A death ruled suicide shortly after the person publicly said they were being watched, threatened — or explicitly said they were not suicidal.',
    'cat.targeted-killing': 'Targeted killing',
    'cat.targeted-killing.def': 'A person killed because of what they researched, published, built or refused to hide.',
    'cat.unexplained': 'Unexplained death or disappearance',
    'cat.unexplained.def': 'A death or disappearance that follows a piece of research or an announced breakthrough and has never been accounted for.',
    'cat.cluster': 'Cluster',
    'cat.cluster.def': 'A series of deaths presented as connected. Some clusters are real patterns; most are artefacts of an elastic list.',
    'method.title': 'Method and grading',
    'about.title': 'About this record',
    'data.title': 'Open data',
    'footer.rights': 'Facts and citations only. Every claim on this site carries the source it rests on.',
    'footer.lang': 'Français',
    'footer.builtby': 'Built and maintained by Claude on zlef.fr',
    'seo.suffix': 'Suspicious Deaths in the World',
    'warned.yes': 'Yes — on the record, before dying',
    'warned.no': 'No public warning on record',
    'sr.skip': 'Skip to content'
  },
  fr: {
    'site.name': 'Morts suspectes dans le monde',
    'site.tagline': 'Un relevé sourcé des morts qui n’ont jamais été expliquées',
    'site.desc': 'Une base de données sourcée, cas par cas, des morts suspectes de scientifiques, d’ingénieurs, de lanceurs d’alerte, de journalistes et de personnalités — chacune notée selon ce que les preuves établissent réellement.',
    'nav.cases': 'Affaires',
    'nav.categories': 'Catégories',
    'nav.method': 'Méthode',
    'nav.data': 'Données',
    'nav.about': 'À propos',
    'nav.search': 'Rechercher',
    'home.hero.title': 'Des morts qui n’ont jamais été expliquées',
    'home.hero.lead': 'Des lanceurs d’alerte qui avaient dit ne pas être suicidaires. Des scientifiques tués pour un programme d’armement. Des inventeurs dont les travaux ont disparu avec eux. Chaque affaire est notée selon ce que les preuves établissent — et celles qui s’effondrent à la vérification sont conservées, avec la démonstration.',
    'home.stat.cases': 'affaires documentées',
    'home.stat.sources': 'sources citées',
    'home.stat.countries': 'pays',
    'home.stat.span': 'années couvertes',
    'home.browse': 'Parcourir le relevé',
    'home.featured': 'Commencer ici',
    'home.recent': 'Ajouts récents',
    'home.byStatus': 'Par statut probatoire',
    'home.byCategory': 'Par schéma',
    'home.bySector': 'Par domaine',
    'home.byCountry': 'Par pays',
    'home.byDecade': 'Par décennie',
    'label.status': 'Statut probatoire',
    'label.category': 'Schéma',
    'label.sector': 'Domaine',
    'label.country': 'Pays',
    'label.died': 'Mort',
    'label.born': 'Naissance',
    'label.age': 'Âge',
    'label.place': 'Lieu',
    'label.role': 'Connu pour',
    'label.ruling': 'Conclusion officielle',
    'label.warned': 'Avertissement énoncé avant la mort',
    'label.keyfacts': 'Faits clés',
    'label.whatHappened': 'Ce qui s’est passé',
    'label.disputed': 'Ce qui ne colle pas',
    'label.holds': 'Ce qui tient',
    'label.sources': 'Sources',
    'label.related': 'Affaires liées',
    'label.updated': 'Dernière vérification',
    'label.summary': 'En bref',
    'label.readmore': 'Lire l’affaire',
    'label.allcases': 'Toutes les affaires',
    'label.filters': 'Filtres',
    'label.clear': 'Effacer les filtres',
    'label.results': 'résultats',
    'label.noresults': 'Aucune affaire ne correspond à ces filtres.',
    'label.noresults.hint': 'Élargissez la recherche, ou effacez les filtres pour voir tout le relevé.',
    'label.searchph': 'Chercher un nom, un domaine, un pays…',
    'label.cases': 'affaires',
    'label.case': 'affaire',
    'label.backto': 'Retour à toutes les affaires',
    'label.jsonld': 'Fiche lisible par machine',
    'status.established': 'Établi',
    'status.established.def': 'Un tribunal, une enquête publique ou une commission officielle a conclu à un homicide.',
    'status.contested': 'Contesté',
    'status.contested.def': 'La conclusion officielle est le suicide ou l’accident, mais des contradictions médico-légales ou procédurales documentées restent sans réponse.',
    'status.unsolved': 'Non résolu',
    'status.unsolved.def': 'L’homicide est établi ; l’auteur ou le commanditaire n’a jamais été identifié.',
    'status.unsupported': 'Non étayé',
    'status.unsupported.def': 'Un récit largement diffusé que le dossier contredit. Conservé ici avec la démonstration.',
    'cat.suicide-doubt': 'Suicide contesté',
    'cat.suicide-doubt.def': 'Une mort classée suicide peu après que la personne a déclaré publiquement être surveillée, menacée — ou explicitement dit qu’elle n’était pas suicidaire.',
    'cat.targeted-killing': 'Assassinat ciblé',
    'cat.targeted-killing.def': 'Une personne tuée pour ce qu’elle cherchait, publiait, construisait ou refusait de taire.',
    'cat.unexplained': 'Mort ou disparition inexpliquée',
    'cat.unexplained.def': 'Une mort ou une disparition qui suit une recherche ou l’annonce d’une percée, et qui n’a jamais été expliquée.',
    'cat.cluster': 'Grappe',
    'cat.cluster.def': 'Une série de morts présentée comme liée. Certaines grappes sont de vrais schémas ; la plupart sont des artefacts de listes extensibles.',
    'method.title': 'Méthode et notation',
    'about.title': 'À propos de ce relevé',
    'data.title': 'Données ouvertes',
    'footer.rights': 'Des faits et des citations, rien d’autre. Chaque affirmation de ce site porte la source sur laquelle elle repose.',
    'footer.lang': 'English',
    'footer.builtby': 'Construit et maintenu par Claude sur zlef.fr',
    'seo.suffix': 'Morts suspectes dans le monde',
    'warned.yes': 'Oui — déclaré avant sa mort',
    'warned.no': 'Aucun avertissement public connu',
    'sr.skip': 'Aller au contenu'
  }
};

function t(locale, key) {
  const d = DICT[locale] || DICT[DEFAULT_LOCALE];
  if (d[key] !== undefined) return d[key];
  return DICT[DEFAULT_LOCALE][key] !== undefined ? DICT[DEFAULT_LOCALE][key] : key;
}

// Pick a field written as `foo_en` / `foo_fr`, falling back to English.
function loc(obj, field, locale) {
  if (!obj) return '';
  const v = obj[field + '_' + locale];
  if (v !== undefined && v !== null && v !== '') return v;
  const f = obj[field + '_' + DEFAULT_LOCALE];
  return f === undefined ? '' : f;
}

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
};

// Accepts YYYY, YYYY-MM, YYYY-MM-DD.
function fmtDate(iso, locale) {
  if (!iso) return '';
  const p = String(iso).split('-');
  const y = p[0];
  if (p.length === 1) return y;
  const m = MONTHS[locale] ? MONTHS[locale][parseInt(p[1], 10) - 1] : p[1];
  if (p.length === 2) return locale === 'fr' ? `${m} ${y}` : `${m} ${y}`;
  const d = parseInt(p[2], 10);
  if (locale === 'fr') return `${d === 1 ? '1er' : d} ${m} ${y}`;
  return `${m} ${d}, ${y}`;
}

module.exports = { LOCALES, DEFAULT_LOCALE, DICT, t, loc, fmtDate };
