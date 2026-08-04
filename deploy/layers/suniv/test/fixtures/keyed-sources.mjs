const semanticscholar = {
  data: [
    {
      paperId: "s2paper1",
      title: "A Semantic Scholar Record With Everything",
      abstract:
        "We evaluate three retrieval strategies on a public benchmark and report their precision at several cut-offs.",
      year: 2022,
      publicationDate: "2022-11-04",
      venue: "Journal of Retrieval",
      externalIds: { DOI: "10.9/s2complete", ArXiv: "2211.00001" },
      authors: [{ name: "Marie Dupont" }, { name: "Wei Chen" }],
      citationCount: 88,
      openAccessPdf: { url: "https://oa.example/s2.pdf" },
    },
    {
      paperId: "s2paper2",
      title: "A Semantic Scholar Record Without External Identifiers",
      year: 2018,
      venue: "Workshop on Missing Metadata",
      authors: [{ name: "Alice Bernard" }],
      citationCount: 2,
    },
  ],
};

const core = {
  results: [
    {
      id: 55501,
      title: "A CORE Record With A Download",
      authors: [{ name: "Bernard, Alice" }],
      publishedDate: "2021-03-09",
      yearPublished: 2021,
      publisher: "University Press",
      doi: "10.7/coredownload",
      abstract: "An open repository record whose full text can be downloaded directly from the aggregator.",
      downloadUrl: "https://core.example/55501.pdf",
    },
    {
      id: 55502,
      title: "A CORE Record Without Any Full Text",
      authors: [{ name: "Martin, Jean" }],
      yearPublished: 2015,
      abstract: "A repository record that exposes metadata and an abstract but no retrievable document.",
    },
  ],
};

export const routes = [
  { match: "api.semanticscholar.org", body: semanticscholar },
  { match: "api.core.ac.uk", body: core },
  { match: "api.unpaywall.org", body: {} },
];
