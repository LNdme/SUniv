---
name: prior-art-scan
description: Search patents, papers and preprints together to see whether an idea is already known. Use when a team asks if their invention is novel, before filing, before committing engineering effort to an approach, or when preparing to meet a patent attorney.
---

# prior-art-scan — what is already known, from every direction at once

An examiner does not care whether prior art appeared in a patent, a journal, a
preprint or a conference proceeding. A team searching only one of those is
building a false picture of its own novelty.

## Search all of it, and say so

```bash
suniv-patent "<technical terms>" --limit 25
suniv-search "<technical terms>" --limit 25
suniv-search "<technical terms>" --from <year> --sort year --limit 15
```

Patent language is not paper language. The same invention is a "graphene-based
gas sensor" in a paper and "a sensing element comprising a carbon monolayer" in
a patent — deliberately broad, because breadth is what a claim buys. Search both
vocabularies: run the team's own words first, then re-search with the phrasing
that comes back from the patent hits.

Search the function, not just the implementation. Prior art that solves the same
problem a different way still bears on obviousness.

## What the results can and cannot tell you

`suniv-patent` returns bibliographic data. **A patent's scope is defined by its
claims, and the claims are not retrieved.** An abstract describes what the
invention is about; it does not delimit what is covered. Never tell a team they
are clear of a patent, or blocked by one, from an abstract. Point them at the
publication number and say the claims need reading.

Two silences that are not evidence of absence:

- **The eighteen-month window.** Applications publish about a year and a half
  after filing. The most relevant prior art may exist and be invisible today.
  This alone makes any agent-run search provisional.
- **Vocabulary.** Not finding something usually means not having guessed the
  right term.

So report the outcome as a search, with its bounds: what was queried, in which
databases, with which terms, and what came back. "I found nothing" is a
statement about the search. "There is nothing" is a claim no one can make here.

## Reading what you find

For each relevant hit, say plainly why it bears on the idea:

- **the same thing** — same problem, same mechanism;
- **the same mechanism elsewhere** — which is what makes an invention obvious,
  and is the most commonly missed category;
- **the same problem, differently solved** — context for the argument, and often
  the strongest position the team can build from;
- **adjacent** — worth knowing, not a threat.

Distinguish what is granted and in force from what is merely published or
abandoned; an expired patent is free to use, and teams routinely mistake one for
the other.

Where a patent and a paper describe the same work, say so — an inventor
publishing their own work is common, and it collapses two apparent hits into one.

## Close by handing the work forward

Give the team what their attorney will ask for: the closest art with publication
numbers, the terms searched, the databases covered, and where the picture is
thin. Then say clearly what this was not — not a freedom-to-operate opinion, not
a clearance search, not legal advice. It is the preparation that makes the paid
hour productive.

If the idea looks novel and the team is about to publish, `disclosure-guard`
applies immediately, and it is more urgent than anything in this skill.
