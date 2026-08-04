export function normalizeDoi(value) {
  if (!value) return "";
  return String(value)
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:/i, "")
    .toLowerCase();
}

export function titleKey(title) {
  if (!title) return "";
  return String(title)
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function stripMarkup(text) {
  if (!text) return "";
  return String(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitName(display) {
  const clean = String(display || "").trim();
  if (!clean) return null;
  if (clean.includes(",")) {
    const [family, given] = clean.split(",", 2);
    return { family: family.trim(), given: (given || "").trim() };
  }
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { family: parts[0] };
  return { family: parts.at(-1), given: parts.slice(0, -1).join(" ") };
}

export function issuedFrom(year, month, day) {
  const y = Number.parseInt(year, 10);
  if (!Number.isFinite(y)) return undefined;
  const parts = [y];
  const m = Number.parseInt(month, 10);
  if (Number.isFinite(m)) {
    parts.push(m);
    const d = Number.parseInt(day, 10);
    if (Number.isFinite(d)) parts.push(d);
  }
  return { "date-parts": [parts] };
}

export function issuedFromDate(value) {
  const match = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(String(value || ""));
  if (!match) return undefined;
  return issuedFrom(match[1], match[2], match[3]);
}

export function reconstructInvertedAbstract(index) {
  if (!index || typeof index !== "object") return "";
  const slots = [];
  for (const [word, positions] of Object.entries(index)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) slots[position] = word;
  }
  const text = slots.filter((word) => typeof word === "string").join(" ").trim();
  return text.length >= 40 ? text : "";
}

export function yearOf(item) {
  const parts = item?.issued?.["date-parts"]?.[0];
  return Array.isArray(parts) ? parts[0] : undefined;
}

function suniv(item) {
  item.custom = item.custom || {};
  item.custom.suniv = item.custom.suniv || { sources: [] };
  return item.custom.suniv;
}

export function markSource(item, source) {
  const meta = suniv(item);
  if (!meta.sources.includes(source)) meta.sources.push(source);
  return item;
}

function preferLonger(current, candidate) {
  if (!candidate) return current;
  if (!current) return candidate;
  return String(candidate).length > String(current).length ? candidate : current;
}

export function mergeItems(base, incoming) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "custom") continue;
    if (key === "abstract" || key === "title") {
      merged[key] = preferLonger(merged[key], value);
      continue;
    }
    if (key === "author") {
      if (!Array.isArray(merged.author) || merged.author.length < value.length) merged.author = value;
      continue;
    }
    if (merged[key] === undefined) merged[key] = value;
  }
  const meta = suniv(merged);
  const incomingMeta = incoming?.custom?.suniv;
  if (incomingMeta) {
    for (const source of incomingMeta.sources || []) {
      if (!meta.sources.includes(source)) meta.sources.push(source);
    }
    if (incomingMeta.citedBy !== undefined && (meta.citedBy === undefined || incomingMeta.citedBy > meta.citedBy)) {
      meta.citedBy = incomingMeta.citedBy;
    }
    for (const key of ["openAccessUrl", "pdfUrl", "openAccessStatus", "arxivId", "pmcid"]) {
      if (meta[key] === undefined && incomingMeta[key] !== undefined) meta[key] = incomingMeta[key];
    }
  }
  return merged;
}

export function dedupe(items) {
  const byDoi = new Map();
  const byTitle = new Map();
  const ordered = [];

  for (const item of items) {
    const doi = normalizeDoi(item.DOI);
    const key = titleKey(item.title);
    const existingIndex = (doi && byDoi.get(doi)) ?? (key && byTitle.get(key));
    if (existingIndex !== undefined) {
      ordered[existingIndex] = mergeItems(ordered[existingIndex], item);
      const settled = ordered[existingIndex];
      const settledDoi = normalizeDoi(settled.DOI);
      if (settledDoi) byDoi.set(settledDoi, existingIndex);
      const settledKey = titleKey(settled.title);
      if (settledKey) byTitle.set(settledKey, existingIndex);
      continue;
    }
    const index = ordered.push(item) - 1;
    if (doi) byDoi.set(doi, index);
    if (key) byTitle.set(key, index);
  }
  return ordered;
}

export const GROUNDING = {
  fulltext: "fulltext",
  abstract: "abstract",
  metadata: "metadata",
};

export function hasOpenAccessLink(item) {
  const meta = item?.custom?.suniv;
  return Boolean(meta?.pdfUrl || meta?.openAccessUrl);
}

export function isRetrievableText(item) {
  const meta = item?.custom?.suniv;
  return Boolean(meta?.pdfUrl || meta?.pmcid || meta?.arxivId);
}

export function resolveGrounding(item) {
  const meta = suniv(item);
  if (isRetrievableText(item)) meta.grounding = GROUNDING.fulltext;
  else if (item.abstract && String(item.abstract).length >= 40) meta.grounding = GROUNDING.abstract;
  else meta.grounding = GROUNDING.metadata;
  if (meta.grounding === GROUNDING.metadata) {
    meta.groundingNote =
      "Metadata only: no abstract and no open-access full text reached. Do not describe this work's objective or method — say the text was not available and offer the DOI so the reader can obtain it through their library.";
  } else if (meta.grounding === GROUNDING.abstract) {
    meta.groundingNote = hasOpenAccessLink(item)
      ? "Abstract only so far: an open-access landing page exists but no retrievable text. Describe the method the abstract states, attributed as such, and offer to open the landing page."
      : "Abstract only: describe the method the abstract states, attributed as such. Do not infer design details the abstract does not contain.";
  } else {
    meta.groundingNote = "Retrievable open-access text; read it before describing the method, and cite its sections.";
  }
  return item;
}
