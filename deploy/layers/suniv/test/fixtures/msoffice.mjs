const children = {
  value: [
    {
      id: "01ABCTHESIS",
      name: "Memoire-chapitre-3.docx",
      size: 184320,
      webUrl: "https://contoso-my.sharepoint.com/personal/etudiant/Doc.aspx?id=chapitre3",
      lastModifiedDateTime: "2026-07-30T09:12:00Z",
      lastModifiedBy: { user: { displayName: "Marie Dupont" } },
      createdBy: { user: { displayName: "Marie Dupont" } },
      parentReference: { path: "/drive/root:/Memoire" },
    },
    {
      id: "01ABCNOTES",
      name: "notes-reunion.txt",
      size: 2048,
      webUrl: "https://contoso-my.sharepoint.com/personal/etudiant/Doc.aspx?id=notes",
      lastModifiedDateTime: "2026-07-28T16:40:00Z",
      lastModifiedBy: { user: { displayName: "Wei Chen" } },
    },
    {
      id: "01ABCFOLDER",
      name: "Sources",
      folder: { childCount: 12 },
      webUrl: "https://contoso-my.sharepoint.com/personal/etudiant/Doc.aspx?id=sources",
      lastModifiedDateTime: "2026-06-01T08:00:00Z",
    },
  ],
};

const item = {
  id: "01ABCTHESIS",
  name: "Memoire-chapitre-3.docx",
  size: 184320,
  webUrl: "https://contoso-my.sharepoint.com/personal/etudiant/Doc.aspx?id=chapitre3",
  lastModifiedDateTime: "2026-07-30T09:12:00Z",
  lastModifiedBy: { user: { displayName: "Marie Dupont" } },
  createdBy: { user: { displayName: "Marie Dupont" } },
  parentReference: { path: "/drive/root:/Memoire" },
};

const versions = {
  value: [
    {
      id: "4.0",
      size: 184320,
      lastModifiedDateTime: "2026-07-30T09:12:00Z",
      lastModifiedBy: { user: { displayName: "Marie Dupont" } },
    },
    {
      id: "3.0",
      size: 179200,
      lastModifiedDateTime: "2026-07-22T11:05:00Z",
      lastModifiedBy: { user: { displayName: "Pr. Bernard" } },
    },
  ],
};

const permissions = {
  value: [
    {
      id: "perm-1",
      roles: ["write"],
      link: {
        scope: "organization",
        type: "edit",
        webUrl: "https://contoso.sharepoint.com/:w:/g/personal/etudiant/EditLink",
      },
      grantedToIdentitiesV2: [{ user: { displayName: "Pr. Bernard", email: "bernard@contoso.example" } }],
    },
    {
      id: "perm-2",
      roles: ["read"],
      link: { scope: "anonymous", type: "view", webUrl: "https://contoso.sharepoint.com/:w:/g/ViewLink" },
    },
  ],
};

export const routes = [
  { match: "/root/children", body: children },
  { match: "/root:/Memoire:/children", body: children },
  { match: "/root/search(", body: { value: [children.value[0]] } },
  { match: "/versions", body: versions },
  { match: "/permissions", body: permissions },
  { match: "/items/01ABCTHESIS", body: item },
];
