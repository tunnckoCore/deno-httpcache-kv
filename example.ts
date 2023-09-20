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

Deno.serve(app.fetch);
