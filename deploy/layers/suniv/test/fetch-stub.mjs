import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const { routes } = await import(pathToFileURL(process.env.SUNIV_TEST_FIXTURE).href);
const calls = [];

globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  const method = init.method || "GET";
  calls.push({ url, method, headers: init.headers || {}, body: init.body });
  const route = routes.find(
    (candidate) => url.includes(candidate.match) && (!candidate.method || candidate.method === method),
  );
  if (!route) {
    return new Response(JSON.stringify({ error: `no fixture route for ${url}` }), {
      status: 599,
      headers: { "content-type": "application/json" },
    });
  }
  const body = typeof route.body === "string" ? route.body : JSON.stringify(route.body ?? {});
  return new Response(body, {
    status: route.status ?? 200,
    headers: route.headers ?? { "content-type": "application/json" },
  });
};

process.on("exit", () => {
  if (process.env.SUNIV_TEST_CALLS) writeFileSync(process.env.SUNIV_TEST_CALLS, JSON.stringify(calls));
});
