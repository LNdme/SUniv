export const routes = [
  {
    match: "graph.microsoft.com",
    status: 401,
    body: { error: { code: "InvalidAuthenticationToken", message: "Access token has expired." } },
  },
];
