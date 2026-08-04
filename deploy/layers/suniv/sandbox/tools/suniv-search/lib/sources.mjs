import { contactEmail, fetchJson, fetchText, SourceError } from "./http.mjs";
import {
  issuedFrom,
  issuedFromDate,
  markSource,
  normalizeDoi,
  reconstructInvertedAbstract,
  splitName,
  stripMarkup,
} from "./csl.mjs";

const OPENALEX_TYPE_TO_CSL = {
  article: "article-journal",
  "journal-article": "article-journal",
  "book-chapter": "chapter",
  book: "book",
  dissertation: "thesis",
  "proceedings-article": "paper-conference",
  preprint: "article",
  dataset: "dataset",
  report: "report",
};

function withParams(base, params) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function politeParam() {
  const mail = contactEmail();
  return mail ? { mailto: mail } : {};
}

async function openalex(query, options) {
  const filters = ["type:article|review|preprint|book-chapter|dissertation"];
  if (options.from) filters.push(`from_publication_date:${options.from}-01-01`);
  if (options.to) filters.push(`to_publication_date:${options.to}-12-31`);
  if (options.openAccess) filters.push("is_oa:true");

  const url = withParams("https://api.openalex.org/works", {
    search: query,
    filter: filters.join(","),
    per_page: Math.min(Math.max(options.limit * 2, 25), 50),
    ...politeParam(),
  });

  const body = await fetchJson("openalex", url);
  return (body.results || []).map((work) => {
    const access = work.open_access || {};
    const openLocation = access.is_oa ? work.best_oa_location || {} : {};
    const item = {
      id: `openalex:${String(work.id || "").split("/").pop()}`,
      type: OPENALEX_TYPE_TO_CSL[work.type] || "article-journal",
      title: stripMarkup(work.display_name),
      author: (work.authorships || [])
        .map((a) => splitName(a.author?.display_name))
        .filter(Boolean),
      issued: issuedFromDate(work.publication_date) || issuedFrom(work.publication_year),
      "container-title": work.primary_location?.source?.display_name || undefined,
      publisher: work.primary_location?.source?.host_organization_name || undefined,
      volume: work.biblio?.volume || undefined,
      issue: work.biblio?.issue || undefined,
      page:
        work.biblio?.first_page && work.biblio?.last_page
          ? `${work.biblio.first_page}-${work.biblio.last_page}`
          : work.biblio?.first_page || undefined,
      DOI: normalizeDoi(work.doi) || undefined,
      URL: work.doi || work.id || undefined,
      abstract: reconstructInvertedAbstract(work.abstract_inverted_index) || undefined,
      custom: {
        suniv: {
          sources: [],
          citedBy: work.cited_by_count,
          openAccessStatus: access.oa_status,
          openAccessUrl: access.oa_url || openLocation.landing_page_url || undefined,
          pdfUrl: openLocation.pdf_url || undefined,
        },
      },
    };
    return markSource(item, "openalex");
  });
}

async function crossref(query, options) {
  const filters = [];
  if (options.from) filters.push(`from-pub-date:${options.from}-01-01`);
  if (options.to) filters.push(`until-pub-date:${options.to}-12-31`);

  const url = withParams("https://api.crossref.org/works", {
    query,
    rows: Math.min(options.limit, 50),
    filter: filters.join(",") || undefined,
    select: "DOI,title,author,issued,container-title,publisher,volume,issue,page,abstract,type,URL,is-referenced-by-count",
    ...politeParam(),
  });

  const body = await fetchJson("crossref", url);
  return (body.message?.items || []).map((work) => {
    const item = {
      id: `doi:${normalizeDoi(work.DOI)}`,
      type: work.type === "journal-article" ? "article-journal" : work.type || "article-journal",
      title: stripMarkup(Array.isArray(work.title) ? work.title[0] : work.title),
      author: (work.author || [])
        .map((a) => (a.family ? { family: a.family, given: a.given } : splitName(a.name)))
        .filter(Boolean),
      issued: work.issued?.["date-parts"]?.[0] ? { "date-parts": work.issued["date-parts"] } : undefined,
      "container-title": Array.isArray(work["container-title"]) ? work["container-title"][0] : undefined,
      publisher: work.publisher || undefined,
      volume: work.volume || undefined,
      issue: work.issue || undefined,
      page: work.page || undefined,
      DOI: normalizeDoi(work.DOI) || undefined,
      URL: work.URL || undefined,
      abstract: stripMarkup(work.abstract) || undefined,
      custom: { suniv: { sources: [], citedBy: work["is-referenced-by-count"] } },
    };
    return markSource(item, "crossref");
  });
}

function arxivEntries(xml) {
  return xml.split("<entry>").slice(1).map((chunk) => chunk.split("</entry>")[0]);
}

function tagText(chunk, tag) {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(chunk);
  if (!match) return "";
  return stripMarkup(
    match[1]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&"),
  );
}

function tagAll(chunk, tag) {
  const out = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g");
  let match;
  while ((match = re.exec(chunk)) !== null) out.push(stripMarkup(match[1]));
  return out;
}

async function arxiv(query, options) {
  const url = withParams("https://export.arxiv.org/api/query", {
    search_query: `all:${query}`,
    max_results: Math.min(options.limit, 50),
    sortBy: "relevance",
  });

  const xml = await fetchText("arxiv", url, { accept: "application/atom+xml" });
  return arxivEntries(xml).map((chunk) => {
    const absUrl = tagText(chunk, "id");
    const arxivId = absUrl.split("/abs/").pop();
    const doiField = tagText(chunk, "arxiv:doi");
    const item = {
      id: `arxiv:${arxivId}`,
      type: "article",
      title: tagText(chunk, "title"),
      author: tagAll(chunk, "name").map(splitName).filter(Boolean),
      issued: issuedFromDate(tagText(chunk, "published")),
      "container-title": "arXiv",
      DOI: normalizeDoi(doiField) || undefined,
      URL: absUrl || undefined,
      abstract: tagText(chunk, "summary") || undefined,
      custom: {
        suniv: {
          sources: [],
          arxivId,
          openAccessUrl: absUrl || undefined,
          pdfUrl: arxivId ? `https://arxiv.org/pdf/${arxivId}` : undefined,
        },
      },
    };
    return markSource(item, "arxiv");
  });
}

async function semanticscholar(query, options) {
  const fields = [
    "title",
    "abstract",
    "year",
    "publicationDate",
    "venue",
    "externalIds",
    "authors",
    "citationCount",
    "openAccessPdf",
    "publicationTypes",
  ].join(",");
  const url = withParams("https://api.semanticscholar.org/graph/v1/paper/search", {
    query,
    limit: Math.min(options.limit, 50),
    fields,
    year: options.from || options.to ? `${options.from || ""}-${options.to || ""}` : undefined,
  });
  const key = process.env.SEMANTIC_SCHOLAR_API_KEY;
  let body;
  try {
    body = await fetchJson("semanticscholar", url, key ? { headers: { "x-api-key": key } } : {});
  } catch (err) {
    if (!key && /429/.test(err.message)) {
      throw new SourceError(
        "semanticscholar",
        "SEMANTIC_SCHOLAR_API_KEY is not set and the shared anonymous pool refused the request (429) — request a free key at semanticscholar.org/product/api",
      );
    }
    throw err;
  }

  return (body.data || []).map((paper) => {
    const item = {
      id: `s2:${paper.paperId}`,
      type: "article-journal",
      title: stripMarkup(paper.title),
      author: (paper.authors || []).map((a) => splitName(a.name)).filter(Boolean),
      issued: issuedFromDate(paper.publicationDate) || issuedFrom(paper.year),
      "container-title": paper.venue || undefined,
      DOI: normalizeDoi(paper.externalIds?.DOI) || undefined,
      URL: paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : undefined,
      abstract: paper.abstract || undefined,
      custom: {
        suniv: {
          sources: [],
          citedBy: paper.citationCount,
          pdfUrl: paper.openAccessPdf?.url || undefined,
          arxivId: paper.externalIds?.ArXiv || undefined,
        },
      },
    };
    return markSource(item, "semanticscholar");
  });
}

async function europepmc(query, options) {
  const bounded = [query];
  if (options.from) bounded.push(`FIRST_PDATE:[${options.from}-01-01 TO ${options.to || 3000}-12-31]`);
  const url = withParams("https://www.ebi.ac.uk/europepmc/webservices/rest/search", {
    query: bounded.join(" AND "),
    format: "json",
    pageSize: Math.min(options.limit, 50),
    resultType: "core",
  });

  const body = await fetchJson("europepmc", url);
  return (body.resultList?.result || []).map((record) => {
    const isOpen = record.isOpenAccess === "Y" && record.pmcid;
    const item = {
      id: record.doi ? `doi:${normalizeDoi(record.doi)}` : `epmc:${record.id}`,
      type: "article-journal",
      title: stripMarkup(record.title),
      author: String(record.authorString || "")
        .split(",")
        .map((name) => splitName(name))
        .filter(Boolean),
      issued: issuedFromDate(record.firstPublicationDate) || issuedFrom(record.pubYear),
      "container-title": record.journalTitle || undefined,
      volume: record.journalVolume || undefined,
      issue: record.issue || undefined,
      page: record.pageInfo || undefined,
      DOI: normalizeDoi(record.doi) || undefined,
      URL: record.doi ? `https://doi.org/${record.doi}` : undefined,
      abstract: stripMarkup(record.abstractText) || undefined,
      custom: {
        suniv: {
          sources: [],
          citedBy: record.citedByCount,
          pmcid: record.pmcid || undefined,
          openAccessUrl: isOpen ? `https://europepmc.org/article/PMC/${record.pmcid}` : undefined,
          pdfUrl: isOpen
            ? `https://www.ebi.ac.uk/europepmc/webservices/rest/${record.pmcid}/fullTextXML`
            : undefined,
        },
      },
    };
    return markSource(item, "europepmc");
  });
}

async function hal(query, options) {
  const filters = [];
  if (options.from) filters.push(`producedDateY_i:[${options.from} TO ${options.to || "*"}]`);
  const url = withParams("https://api.archives-ouvertes.fr/search/", {
    q: query,
    fq: filters.join(" AND ") || undefined,
    wt: "json",
    rows: Math.min(options.limit, 50),
    fl: "docid,label_s,title_s,authFullName_s,producedDateY_i,journalTitle_s,doiId_s,uri_s,abstract_s,fileMain_s,openAccess_bool",
  });

  const body = await fetchJson("hal", url);
  return (body.response?.docs || []).map((doc) => {
    const item = {
      id: `hal:${doc.docid}`,
      type: "article-journal",
      title: stripMarkup(Array.isArray(doc.title_s) ? doc.title_s[0] : doc.title_s),
      author: (doc.authFullName_s || []).map(splitName).filter(Boolean),
      issued: issuedFrom(doc.producedDateY_i),
      "container-title": doc.journalTitle_s || undefined,
      DOI: normalizeDoi(doc.doiId_s) || undefined,
      URL: doc.uri_s || undefined,
      abstract: stripMarkup(Array.isArray(doc.abstract_s) ? doc.abstract_s[0] : doc.abstract_s) || undefined,
      custom: {
        suniv: {
          sources: [],
          openAccessUrl: doc.openAccess_bool ? doc.uri_s : undefined,
          pdfUrl: doc.fileMain_s || undefined,
        },
      },
    };
    return markSource(item, "hal");
  });
}

async function core(query, options) {
  const key = process.env.CORE_API_KEY;
  if (!key) throw new SourceError("core", "CORE_API_KEY is not set — skipped (register at core.ac.uk/services/api)");

  const body = await fetchJson("core", "https://api.core.ac.uk/v3/search/works", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ q: query, limit: Math.min(options.limit, 50) }),
  });

  return (body.results || []).map((work) => {
    const item = {
      id: `core:${work.id}`,
      type: "article-journal",
      title: stripMarkup(work.title),
      author: (work.authors || []).map((a) => splitName(a.name)).filter(Boolean),
      issued: issuedFromDate(work.publishedDate) || issuedFrom(work.yearPublished),
      "container-title": work.publisher || undefined,
      DOI: normalizeDoi(work.doi) || undefined,
      URL: work.doi ? `https://doi.org/${work.doi}` : work.sourceFulltextUrls?.[0],
      abstract: stripMarkup(work.abstract) || undefined,
      custom: {
        suniv: { sources: [], pdfUrl: work.downloadUrl || work.sourceFulltextUrls?.[0] || undefined },
      },
    };
    return markSource(item, "core");
  });
}

export async function unpaywall(doi) {
  const mail = contactEmail();
  if (!mail) throw new SourceError("unpaywall", "SUNIV_CONTACT_EMAIL is not set — Unpaywall requires an email");
  const url = withParams(`https://api.unpaywall.org/v2/${encodeURIComponent(doi)}`, { email: mail });
  const body = await fetchJson("unpaywall", url);
  const best = body.best_oa_location;
  if (!best) return null;
  return {
    openAccessUrl: best.url_for_landing_page || best.url || undefined,
    pdfUrl: best.url_for_pdf || undefined,
    openAccessStatus: body.oa_status || undefined,
  };
}

export const SOURCES = {
  openalex,
  crossref,
  arxiv,
  semanticscholar,
  europepmc,
  hal,
  core,
};

export const DEFAULT_SOURCES = ["openalex", "crossref", "arxiv", "semanticscholar", "europepmc"];
