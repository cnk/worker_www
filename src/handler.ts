export async function errorHandler(error: Error): Promise<Response> {
  return new Response(error.message || 'Something went wrong.', {
    status: 500,
    statusText: 'Internal Server Error',
  })
}

export function responseCachable(response: Response): boolean {
  /*
  CNK do we want to change this rule to responses with cookies named 'session'?
  I suspect so since that is the equivalent of our current Cache Everything rules
  */
  // console.log(response.headers)
  if (response.headers.get('set-cookie')) {
    return false
  }
  if (response.headers.has('cache-control')) {
    return !['private', 'no-cache', 'no-store', 'max-age=0'].some((str) =>
      response.headers.get('cache-control')?.includes?.(str),
    )
  }
  // default to false just to be sure
  return false
}

export function buildCacheKey(request: Request): string {
  const requestUrl = new URL(request.url)
  let href = requestUrl.origin + (requestUrl.pathname || '')
  if (requestUrl.search != '') {
    requestUrl.searchParams.sort()
    href = href + '?' + requestUrl.searchParams
  }
  if (requestUrl.hash) {
    href = href + requestUrl.hash
  }
  return href
}

// https://developers.cloudflare.com/cache/how-to/configure-cache-status-code/#edge-ttl
export function edgeTTLByStatus(status_code: number): number {
  // Cache for a while or until purged
  if ([200, 301, 404].indexOf(status_code) !== -1) {
    return 600
  }
  // cache for a short while
  if ([302, 303, 403, 410].indexOf(status_code) !== -1) {
    return 60
  }
  return 0
}

export async function defaultCacheStrategy(request: Request, ctx: ExecutionContext): Promise<Response> {
  // Construct the cache key from the cache URL
  const cacheKey = buildCacheKey(request)
  const cache = caches.default

  // Check whether the value is already available in the cache
  // if not, you will need to fetch it from origin, and store it in the cache
  // for future access
  let response = await cache.match(cacheKey)

  if (!response) {
    // If not in cache, get it from the origin server
    response = await fetch(request)

    // Use the Response constructor to inherit all of the response's fields
    response = new Response(response.body, response)

    // Check response status. We don't want to cache 500s but I am OK with
    // caching redirects and 404s
    if (response.headers.get('set-cookie')) {
      console.log(`Cookie from server: ${response.headers.get('set-cookie')}`)
    }

    // Cache API respects Cache-Control headers.
    // Any changes made to the response here will be reflected in the cached value
    // Store the fetched response as cacheKey
    // Use waitUntil so you can return the response without blocking on writing to cache
    const cacheTime = edgeTTLByStatus(response.status)
    if (cacheTime > 0 && responseCachable(response)) {
      response.headers.append('cache-control', 's-maxage=' + cacheTime)
      console.log(`Caching ${request.url} : ${response.headers.get('cache-control')}`)
      // response.headers.set('cf-cache-status', 'MISS')
      ctx.waitUntil(cache.put(cacheKey, response.clone()))
    } else {
      console.log(`Not caching ${request.url} : response code ${response.status}`)
    }
  } else {
    console.log(`Cache hit for: ${request.url}.`)
  }
  return response
}
