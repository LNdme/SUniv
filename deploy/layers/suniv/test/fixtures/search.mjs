function inverted(sentence) {
  const index = {};
  sentence.split(" ").forEach((word, position) => {
    (index[word] = index[word] || []).push(position);
  });
  return index;
}

const PAYWALLED_ABSTRACT =
  "This study evaluates a calibration procedure across three independent cohorts and reports the resulting error bounds.";

const openalex = {
  results: [
    {
      id: "https://openalex.org/W1",
      doi: "https://doi.org/10.1/shared",
      display_name: "Shared Work Across Sources",
      publication_date: "2023-04-05",
      publication_year: 2023,
      type: "article",
      cited_by_count: 120,
      authorships: [{ author: { display_name: "Marie Dupont" } }],
      primary_location: { source: { display_name: "Journal of Tests" } },
      open_access: { is_oa: true, oa_status: "gold", oa_url: "https://oa.example/shared" },
      best_oa_location: { pdf_url: "https://oa.example/shared.pdf", landing_page_url: "https://oa.example/shared" },
      abstract_inverted_index: inverted("An open access work whose full text can actually be retrieved by the reader."),
    },
    {
      id: "https://openalex.org/W2",
      doi: "https://doi.org/10.2/paywalled",
      display_name: "Paywalled Work With Abstract",
      publication_date: "2022-01-01",
      publication_year: 2022,
      type: "article",
      cited_by_count: 40,
      authorships: [{ author: { display_name: "Jean Martin" } }],
      primary_location: {
        source: { display_name: "Closed Journal" },
        landing_page_url: "https://publisher.example/paywalled",
      },
      open_access: { is_oa: false, oa_status: "closed" },
      abstract_inverted_index: inverted(PAYWALLED_ABSTRACT),
    },
    {
      id: "https://openalex.org/W3",
      doi: "https://doi.org/10.3/bare",
      display_name: "Bare Record Without Abstract",
      publication_date: "2019-09-09",
      publication_year: 2019,
      type: "article",
      cited_by_count: 5,
      authorships: [{ author: { display_name: "Alice Bernard" } }],
      primary_location: { source: { display_name: "Obscure Proceedings" }, landing_page_url: "https://x.example/bare" },
      open_access: { is_oa: false },
    },
  ],
};

const crossref = {
  message: {
    items: [
      {
        DOI: "10.1/shared",
        title: ["Shared Work Across Sources"],
        type: "journal-article",
        author: [{ family: "Dupont", given: "Marie" }],
        issued: { "date-parts": [[2023, 4, 5]] },
        "container-title": ["Journal of Tests"],
        "is-referenced-by-count": 118,
      },
    ],
  },
};

const arxivAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2401.00001v1</id>
    <published>2024-01-02T00:00:00Z</published>
    <title>Preprint Without Any DOI</title>
    <summary>A preprint that carries no DOI at all, which is the normal case on arXiv and the exact record that used to disappear.</summary>
    <author><name>Chen Wei</name></author>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2401.00002v1</id>
    <published>2024-02-03T00:00:00Z</published>
    <title>Preprint Number Two, Also Without A DOI</title>
    <summary>Another preprint with no DOI, sharing a first author, a year and a leading title word so that its citation key collides.</summary>
    <author><name>Chen Wei</name></author>
  </entry>
</feed>`;

export const routes = [
  { match: "api.openalex.org", body: openalex },
  { match: "api.crossref.org", body: crossref },
  { match: "export.arxiv.org", body: arxivAtom, headers: { "content-type": "application/atom+xml" } },
  { match: "api.unpaywall.org", body: {} },
];
