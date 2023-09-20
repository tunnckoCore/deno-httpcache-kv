# Deno / Deno Deploy HTTP Cache

> Polyfill/patches for Caches API for Deno/Deno Deploy.

Currently, Deno supports limited set of the API in the runtime, and there's no support for even that on the Deno Deploy.
So this uses the `deno_httpcache` by Lucas, with few tweaks, and added a `kvCaches` storage solution which uses the Deno KV both locally and on Deploy.

It exposes the `deno_httpcache` patch, a KV-based cache storage, and a Hono middleware patched.

Try it at https://full-goat-33.deno.dev

## Usage

Try it locally with running `deno run -A --unstable --watch example.ts `

```ts
import { Hono } from "https://deno.land/x/hono/mod.ts";
import {
  kvCachesOpen,
  cacheMiddleware,
} from "http://esm.sh/gh/tunnckoCore/deno-httpcache-kv/mod.ts";

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
```
