const epoSearch = {
  "ops:world-patent-data": {
    "ops:biblio-search": {
      "ops:search-result": {
        "exchange-documents": [
          {
            "exchange-document": {
              "@country": "EP",
              "@doc-number": "1234567",
              "@kind": "A1",
              "bibliographic-data": {
                "publication-reference": {
                  "document-id": [
                    {
                      "@document-id-type": "docdb",
                      country: { $: "EP" },
                      "doc-number": { $: "1234567" },
                      kind: { $: "A1" },
                      date: { $: "20210317" },
                    },
                  ],
                },
                "invention-title": [
                  { "@lang": "de", $: "Graphenbasierter Sensor" },
                  { "@lang": "en", $: "Graphene-based gas sensor" },
                ],
                parties: {
                  inventors: {
                    inventor: [
                      { "@data-format": "original", "inventor-name": { name: { $: "DUPONT MARIE" } } },
                      { "@data-format": "epodoc", "inventor-name": { name: { $: "DUPONT, MARIE" } } },
                    ],
                  },
                  applicants: {
                    applicant: [{ "@data-format": "epodoc", "applicant-name": { name: { $: "CNRS" } } }],
                  },
                },
              },
              abstract: {
                p: [
                  {
                    $: "A gas sensor comprising a graphene layer deposited on a dielectric substrate, wherein a resistance change determines analyte concentration.",
                  },
                ],
              },
            },
          },
        ],
      },
    },
  },
};

const patentsview = {
  patents: [
    {
      patent_id: "11024329",
      patent_title: "Word repetition detection",
      patent_date: "2021-06-01",
      patent_abstract:
        "A method for detecting a sign of cognitive decline by measuring word repetition across separate conversations using automatic speech recognition.",
      inventors: [{ inventor_name_first: "Ada", inventor_name_last: "Lovelace" }],
      assignees: [{ assignee_organization: "Example Labs Inc" }],
    },
  ],
};

export const routes = [
  { match: "ops.epo.org/3.2/auth/accesstoken", body: { access_token: "test-token" } },
  { match: "ops.epo.org/3.2/rest-services", body: epoSearch },
  { match: "search.patentsview.org", body: patentsview },
];
