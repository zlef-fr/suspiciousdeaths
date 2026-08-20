# Suspicious Deaths in the World

A sourced, case-by-case record of suspicious deaths of scientists, engineers, whistleblowers,
journalists and public figures — 82 cases, 1913 to 2026, 22 countries, 177 cited sources.

Live: https://suspiciousdeaths.zlef.fr

## What it does

Three things qualify a case for inclusion:

1. A suicide finding delivered shortly after the person publicly said they were being watched,
   threatened, or explicitly said they were not suicidal.
2. A killing tied to what the person researched, published or built.
3. An unexplained death or disappearance following a piece of research or an announced
   breakthrough.

Every case carries exactly one evidentiary status:

| Status | Meaning |
|---|---|
| `established` | A court, public inquiry or official commission concluded homicide. |
| `contested` | The official ruling is suicide or accident, but documented forensic or procedural contradictions remain unresolved. |
| `unsolved` | Homicide is established; the perpetrator or the person who ordered it was never identified. |
| `unsupported` | A widely circulated story that the case file contradicts. Kept, with the demonstration. |

Debunked cases stay online. A database that kept only the disturbing cases would itself be a
machine for manufacturing patterns.

## Stack

Node 22 + Express, fully server-rendered. No client-side routing, no template engine, no build
step. Every case page is a complete HTML document without JavaScript.

```
lib/i18n.js     EN/FR dictionaries and localised field lookup
lib/data.js     loads data/cases-*.json, derives facets, search and counts
lib/render.js   SEO head, layout, cards, JSON-LD
server.js       routes mounted twice: English at /, French at /fr
data/cases-*.json   the actual record
```

Adding a case means adding one object to a data file. Facets, sitemap, RSS, the API, the CSV
export and `llms-full.txt` all regenerate from it.

## Endpoints

- `/api/cases` — filterable with `?status= &category= &sector= &country= &q=`
- `/api/case/:slug`, `/api/stats`
- `/data/cases.json`, `/data/cases.csv`
- `/llms.txt`, `/llms-full.txt` — for generative engines
- `/sitemap.xml`, `/feed.xml`

## Run

```bash
docker compose up -d --build   # binds 127.0.0.1:10114
```

Set `SITE_ORIGIN` to the public origin; canonical URLs, hreflang, the sitemap, JSON-LD and
llms.txt all derive from it.

## Licence

Data: CC BY 4.0. Every claim carries the source it rests on.
