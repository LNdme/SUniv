# SUniv

Un agent coworker pour les étudiants et les chercheurs. Il cherche la littérature, la
classe, l'explique, et aide à rédiger le mémoire ou l'article.

SUniv est à un mémoire ce qu'un agent de code est à un dépôt : il ne remplace ni Word, ni
LaTeX, ni Zotero — il travaille avec eux, et il suit le travail sur toute sa durée.

## Ce qu'il fait

- **Cherche** dans les sources académiques ouvertes (OpenAlex, Crossref, arXiv, Semantic
  Scholar, Europe PMC, HAL, CORE) et, avec la clé de l'étudiant, dans Scopus et IEEE Xplore.
- **Explique** un article proposé : objectif, méthode, données, résultats, limites — et
  dit franchement quand il n'a pas le texte pour le faire, au lieu de deviner.
- **Classe** dans Zotero : collections, tags, métadonnées propres.
- **Rédige** avec l'étudiant : plan, sections, citations rattachées à des références
  réelles, export .docx / .tex / PDF.
- **Suit** : mémoire du sujet, des échéances, du style de citation imposé, et veille
  hebdomadaire sur les nouveautés du domaine.

## Le principe qui gouverne tout

Aucune référence n'entre dans un document sans résoudre à un DOI réellement retourné par
une recherche. Aucune méthodologie n'est décrite sans le texte qui la contient. Un agent
qui invente une bibliographie ou devine la méthode d'un article qu'il n'a pas lu produit
une revue de littérature fausse et confiante — ce qui est pire qu'inutile pour un
chercheur. SUniv préfère dire qu'il ne sait pas.

## Architecture

SUniv est une distribution de [QM](https://github.com/yc-software/qm), un harness d'agent
multi-joueurs sous licence MIT. QM apporte le noyau : boucle d'agent multi-modèles, scopes
personnels et partagés, mémoire, keychain, skills, crons, sandbox durable par utilisateur,
politique de sécurité et audit, et une interface web.

Tout ce qui est propre à SUniv vit dans [`deploy/layers/suniv/`](./deploy/layers/suniv/) :
les outils de recherche académique et le savoir-faire de rédaction. Le cœur reste
identique à l'amont, ce qui permet de continuer à en recevoir les améliorations. La
frontière est décrite dans [`SUNIV.md`](./SUNIV.md).

## Démarrer

```bash
npm install
node cli/bin/qm.ts check --config deploy/layers/suniv/qm.config.jsonc
npm run dev-instance
```

L'architecture du noyau, ses postures de sécurité et son contrat de déploiement sont
documentés en amont : [`docs/getting-started.md`](./docs/getting-started.md),
[`docs/deploy-directory.md`](./docs/deploy-directory.md), [`SECURITY.md`](./SECURITY.md).

## État

MVP en construction. La couche de recherche et de rédaction est en place ; l'éditeur
intégré, l'add-in Word et l'application desktop suivent.

## Licence

[MIT](./LICENSE). Voir [`NOTICE`](./NOTICE) pour l'attribution du travail amont.
