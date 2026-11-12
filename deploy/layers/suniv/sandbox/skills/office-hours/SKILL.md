---
name: office-hours
description: The signature front-door advisory session for any research project (inspired by YC office hours). Pressure-test the research idea, identify real literature gaps, enforce feasibility scope cuts, and produce an actionable Research Brief before writing code or drafts.
---

# office-hours — pressure-test the research question before committing

A weak research question or an uncontrolled scope wastes months of lab time and writing. `/office-hours` is the mandatory front door: a structured, intensive interrogation by the virtual Advisor / Principal Investigator to turn a vague ambition into a sharp, defensible, and feasible research project.

## The Six Forcing Questions

Walk the researcher through these questions sequentially. Push back on vague answers:

1. **The Time Horizon & Resource Reality Check**
   - What is the hard deadline (weeks, months)?
   - What datasets, lab hardware, compute, or ethical approvals are already secured?
   - What will have to be acquired or learned from scratch? If acquiring it takes more than 20% of the project time, cut the requirement.

2. **The One-Sentence Contribution (The "Why")**
   - State the core contribution in a single sentence: *"We show that [X] improves [Y] under condition [Z] by doing [W]."*
   - If it takes a paragraph to explain the goal, the scope is too broad.

3. **The Literature & Gap Sanity Check**
   - What is the closest existing work?
   - Run an immediate targeted sanity scan:
     ```bash
     suniv-search "<core keywords>" --limit 10 --from 2023 --sort citations
     ```
   - Does a 2023–2025 paper already answer this? If so, shift the angle immediately (e.g. robustness check, new domain, ablation, efficiency).

4. **The Minimum Viable Experiment (MVP) / Core Proof**
   - What is the single decisive experiment or mathematical proof that proves or disproves the core hypothesis?
   - How can we get to this first result within the first 14 days?

5. **The Pre-Mortem & Fallback Plan**
   - What is the most likely reason this project fails (e.g. data noise, negative result, model divergence, unresolvable copyright/ethics)?
   - What is the fallback angle that still produces a publishable or defendable result?

6. **The Patent & Disclosure Assessment**
   - Is there a commercial invention, algorithm, or hardware design worth protecting?
   - If yes, invoke `disclosure-guard` rules immediately: zero preprint upload or public presentation before filing.

## Immediate Action: Seed the Project

During the session:
1. File the initial 5 to 10 foundational papers directly into Zotero:
   ```bash
   suniv-search "<terms>" --limit 10 --csl > /tmp/seed_refs.json
   suniv-zotero add --file /tmp/seed_refs.json --collection "Seed-Literature"
   ```
2. Write the **Research Cadrage Brief** to the project's durable memory / lab notebook (`lab-notebook`).

## Output: The Research Cadrage Brief

At the end of `/office-hours`, deliver:
- **Title & Core Hypothesis**: Crisp, unambiguous statement.
- **Scope Boundaries**: Explicit list of what is IN scope and what is strictly OUT of scope.
- **Target Venue & Format**: (e.g., Master Thesis 50p, IEEE Conference 4p, NeurIPS Workshop).
- **Milestone Timeline**: 3 to 4 concrete milestones with deadlines.
- **Initial Seed Bibliography**: Verified references filed in Zotero.
