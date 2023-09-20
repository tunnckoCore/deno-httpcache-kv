import { Cache } from "./deno-httpcache.ts";

export async function kvCachesOpen(cacheName?: string): Cache {
  let db = null;

  if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
    db = await Deno.openKv(cacheName || "kv-httpcache-v0");
  } else {
    db = await Deno.openKv(`./.kv-httpcache/${cacheName || "v0"}`);
  }

  return new Cache({
    async get(url: string | URL) {
      const _url = url.toString();
      const result = await db.get(["kv-httpcache", _url], {
        consistency: "strong",
      });

      return result.value;
    },
    async set(url: string | URL, resp: { body: any; policy: any }) {
      const _url = url.toString();

      await db.set(["kv-httpcache", _url], resp);
    },
    async delete(url: string | URL) {
      const _url = url.toString();
      await db.delete(["kv-httpcache", _url]);
    },
    close() {
      db.close();
    },
  });
}
