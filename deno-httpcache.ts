import CachePolicy from "https://esm.sh/http-cache-semantics";

export { CachePolicy };

export function cacheRequest(req: Request): CachePolicy.Request {
  return {
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    method: req.method,
  };
}

export interface CachedResponse {
  body: Uint8Array;
  policy: CachePolicy.CachePolicyObject;
}

export interface CacheStorage {
  get(url: string): Promise<CachedResponse | undefined>;
  set(url: string, resp: CachedResponse): Promise<void>;
  delete(url: string): Promise<void>;
  close(): void;
}

export class Cache {
  #storage: CacheStorage;

  constructor(storage: CacheStorage) {
    this.#storage = storage;
  }

  close() {
    this.#storage.close();
  }

  async match(request: RequestInfo): Promise<Response | undefined> {
    const req = request instanceof Request ? request : new Request(request);

    const cached = await this.#storage.get(req.url);
    if (!cached) return;

    const policy = CachePolicy.fromObject(cached.policy);

    const usable = policy.satisfiesWithoutRevalidation(cacheRequest(req));
    if (!usable) return;

    const resp = new Response(cached.body, {
      headers: policy.responseHeaders() as Record<string, string>,
      status: cached.policy.st,
    });

    return resp;
  }

  async put(request: RequestInfo, response: Response): Promise<void> {
    const req = request instanceof Request ? request : new Request(request);
    response = response.clone();

    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());

    const policy = new CachePolicy(
      cacheRequest(req),
      { status, headers },
      {
        shared: true,
      }
    );

    if (!policy.storable()) return;

    const body = await response.arrayBuffer();

    await this.#storage.set(req.url, {
      body: new Uint8Array(body),
      policy: policy.toObject(),
    });
  }

  async delete(request: RequestInfo): Promise<void> {
    const req = request instanceof Request ? request : new Request(request);
    await this.#storage.delete(req.url);
    return Promise.resolve();
  }
}
