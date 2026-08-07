export const routes = [
  {
    match: "graph.microsoft.com",
    status: 403,
    body: { error: { code: "accessDenied", message: "Access denied." } },
  },
];
