import type { MiddlewareHandler } from "https://deno.land/x/hono/mod.ts";
import { kvCachesOpen } from "./deno-httpcache-kv.ts";

export const cache = (options: {
  cacheName?: string;
  wait?: boolean;
  cacheControl?: string;
  cacheAPI?: CacheStorage | any;
}): MiddlewareHandler => {
  if (options.wait === undefined) {
    options.wait = true;
  }

  const CACHE = options?.cacheAPI || caches || { open: kvCachesOpen };

  const addHeader = (response: Response) => {
    if (options.cacheControl) {
      response.headers.set("Cache-Control", options.cacheControl);
    }
  };

  return async (c, next) => {
    const key = c.req.raw;
    const cache = await CACHE.open(options.cacheName || "default-v0-cache");
    const response = await cache.match(key);
    if (!response) {
      const resp = await next();

      // if (!resp.ok || !c.res.ok) {
      if (!c.res.ok) {
        console.log("not ok");
        return;
      }
      console.log("goin to cache it");

      const _resp = resp || c.res;

      addHeader(c.res);
      await cache.put(key, c.res);
    } else {
      console.log("from cache");
      return new Response(response.body, response);
    }
  };
};
