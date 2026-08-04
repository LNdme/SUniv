const items = [
  { key: "AAAA1111", version: 3, data: { key: "AAAA1111", itemType: "journalArticle", title: "A Team Reference" } },
];

const collections = [{ key: "CCCC2222", version: 1, data: { key: "CCCC2222", name: "Sensors" } }];

export const routes = [
  { match: "localhost:23119", status: 599, body: { error: "no local Zotero in tests" } },
  {
    match: "api.zotero.org/groups/900/items",
    method: "POST",
    body: { successful: { 0: { key: "NEW00001", data: { key: "NEW00001" } } }, failed: {}, unchanged: {} },
  },
  { match: "api.zotero.org/groups/900/collections", body: collections },
  { match: "api.zotero.org/groups/900/items", body: items },
  { match: "api.zotero.org/groups/404404", status: 404, body: { error: "Group not found" } },
  { match: "api.zotero.org/groups/403403", status: 403, body: { error: "Forbidden" } },
  { match: "api.zotero.org/users/", body: items },
];
