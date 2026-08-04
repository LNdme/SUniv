const scopus = {
  "search-results": {
    entry: [
      {
        "dc:identifier": "SCOPUS_ID:85123456789",
        eid: "2-s2.0-85123456789",
        "dc:title": "Calibration Of Low-Cost Air Quality Sensors",
        "dc:creator": "Dupont M.",
        "prism:coverDate": "2023-07-15",
        "prism:publicationName": "Sensors and Actuators B",
        "prism:volume": "380",
        "prism:issueIdentifier": "2",
        "prism:pageRange": "133-145",
        "prism:doi": "10.1016/j.snb.2023.133145",
        "dc:description":
          "Low-cost air quality sensors drift over time. We evaluate three calibration strategies across two field campaigns and report their error bounds.",
        "citedby-count": "37",
      },
      {
        "dc:identifier": "SCOPUS_ID:85987654321",
        "dc:title": "A Record With Neither DOI Nor Abstract",
        "dc:creator": "Van Der Berg A.B.",
        "prism:coverDate": "2019-01-01",
        "prism:publicationName": "Obscure Symposium",
        "citedby-count": "0",
      },
      {
        "dc:identifier": "SCOPUS_ID:85111111111",
        "dc:title": "A Record Whose Creator Carries A Comma",
        "dc:creator": "Bernard, Alice",
        "prism:coverDate": "2020-05-05",
        "prism:publicationName": "Journal of Commas",
        "citedby-count": "3",
      },
      { error: "Result set was empty" },
    ],
  },
};

const ieee = {
  articles: [
    {
      article_number: "9876543",
      title: "A Conference Paper On Graph Learning",
      content_type: "Conferences",
      publication_title: "2024 IEEE Conference on Everything",
      publication_date: "1 June 2024",
      publication_year: "2024",
      start_page: "10",
      end_page: "18",
      doi: "10.1109/CONF.2024.9876543",
      html_url: "https://ieeexplore.ieee.org/document/9876543",
      abstract:
        "We present a graph learning method for irregular meshes and evaluate it against three baselines on two public datasets.",
      authors: { authors: [{ full_name: "Wei Chen" }, { full_name: "Ada Lovelace" }] },
      citing_paper_count: 12,
    },
    {
      article_number: "1234567",
      title: "A Journal Article Without An Abstract",
      content_type: "Journals",
      publication_title: "IEEE Transactions on Things",
      publication_year: "2021",
      volume: "7",
      issue: "3",
      start_page: "1",
      authors: { authors: [{ full_name: "Marie Dupont" }] },
    },
  ],
};

export const routes = [
  { match: "api.elsevier.com", body: scopus },
  { match: "ieeexploreapi.ieee.org", body: ieee },
];
