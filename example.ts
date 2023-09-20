import { Hono } from "https://deno.land/x/hono/mod.ts";
import { kvCachesOpen, cacheMiddleware } from "./mod.ts";

// force to always use the fallback, by providing `cacheAPI` option
const CACHE = { open: kvCachesOpen };

const app = new Hono();

app.use(
  "/simulated/*",
  /* { cacheName: 'foo-bar', cacheControl: 'max-age=60', cacheAPI: CACHE } */
  cacheMiddleware({ cacheControl: "max-age=60", cacheAPI: CACHE })
);

// hit two times, and the second will be instant response from the kv cache
app.get("/simulated/foo", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 10_000));

  return c.json({ foo: "bar", date: new Date() });
});

app.get("/", async (c) => {
  return c.html(`
    <h1>deno-httpcache-kv</h1>
    <p>Try to hit <a href="/simulated/foo">/simulated/foo</a> twice, and the second will be instant response from the kv cache.</p>
    <p>Afrer 1 minute it will take 10 seconds again.</p>
  `);
});

Deno.serve(app.fetch);
