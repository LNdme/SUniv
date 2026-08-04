# SUniv et son noyau

SUniv est une distribution de [QM](https://github.com/yc-software/qm). L'histoire de ce
dépôt commence par un merge de l'histoire de QM, et le remote `upstream` y pointe. QM
apporte le noyau générique — identité, policy, boucle d'agent, mémoire, skills, sandbox,
interfaces — et SUniv apporte le métier : la recherche académique et la rédaction
scientifique.

## La frontière

**Tout ce qui est propre à SUniv vit dans `deploy/layers/suniv/`.** C'est le contrat de
couche de déploiement de QM, décrit dans [`docs/deploy-directory.md`](./docs/deploy-directory.md)
et [`deploy/layers/README.md`](./deploy/layers/README.md) : outils de sandbox, skills,
configuration, plugins de service. Le noyau expose une surface d'outils fixe dont
`execute` ; les capacités SUniv arrivent comme des binaires installés dans la sandbox de
l'étudiant et des skills qui apprennent à l'agent quand les employer.

Tout le reste de l'arbre est du noyau amont et reste **identique à QM**. Trois exceptions,
et elles sont exhaustives :

| Fichier     | Raison                                 |
| ----------- | -------------------------------------- |
| `README.md` | Une distribution se présente elle-même |
| `NOTICE`    | Attribution MIT du travail amont       |
| `SUNIV.md`  | Ce document                            |

Cette discipline n'est pas de la cérémonie : elle est ce qui garde les merges depuis
l'amont petits. Une correction du noyau appliquée ici est une correction à re-résoudre à
chaque sync, indéfiniment.

## Ce qui va où

Une nouvelle capacité de recherche ou de rédaction ? `deploy/layers/suniv/sandbox/tools/`
pour le tuyau, `deploy/layers/suniv/sandbox/skills/` pour le savoir-faire.

Une nouvelle surface (éditeur, add-in Word) ? `deploy/layers/suniv/plugins/<nom>/` avec un
`Dockerfile` — `cli/src/plugins.ts` la découvre et la déploie. Un plugin neuf est purement
additif et n'entre jamais en conflit avec l'amont, contrairement à une édition de
`plugins/web-ui/`.

Un vrai défaut du noyau ? Il se corrige en amont, pas ici. Décrire le besoin dans
[`adrs/`](./adrs/) et l'envoyer à QM, dont la politique de contribution demande du texte
humain plutôt que du code — voir [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Synchroniser avec l'amont

```bash
git fetch upstream main
git merge upstream/main
```

Merger, jamais rebaser : l'histoire de ce dépôt est celle de QM plus la nôtre, et un
rebase la réécrirait. Les conflits attendus se limitent aux trois fichiers du tableau
ci-dessus.

Rien sous `deploy/layers/suniv/` ne remonte jamais vers QM.

## Conventions de code

[`AGENTS.md`](./AGENTS.md) de l'amont s'applique au code écrit ici, y compris dans la
couche. Les deux règles qui surprennent le plus :

- **Zéro commentaire.** L'intention passe par les noms, la structure et les tests ; le
  raisonnement va dans les messages de commit.
- **Corriger toutes les occurrences**, pas seulement celle qui a été signalée.
