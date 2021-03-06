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
  if (response.headers.get('set-cookie')) {
    console.log(`Not caching because of cookie: ${response.headers.get('set-cookie')}`)
    return false
  }
  if (response.headers.has('cache-control')) {
    return !['private', 'no-cache', 'no-store', 'max-age=0'].some((str) =>
      response.headers.get('cache-control')?.includes?.(str),
    )
  } else {
    console.log(`No cache control header for ${response.url}`)
    return false
  }
}

export function buildCacheKey(request: Request, allowedKeys?: Array<string>): string {
  /*
  If an array of allowedKeys is provided, we will remove any other keys before sorting
  */
  const requestUrl = new URL(request.url)
  let href = requestUrl.origin + (requestUrl.pathname || '')
  if (requestUrl.search != '') {
    if (allowedKeys) {
      // filter out extra query string args
      const filteredParams = new URLSearchParams()
      requestUrl.searchParams.forEach((val, key) => {
        if (allowedKeys.includes(key)) {
          filteredParams.append(key, val)
        }
      })
      filteredParams.sort()
      if (filteredParams.toString() != '') {
        href = href + '?' + filteredParams
      }
    } else {
      requestUrl.searchParams.sort()
      href = href + '?' + requestUrl.searchParams
    }
  }
  if (requestUrl.hash) {
    href = href + requestUrl.hash
  }
  return href
}

export function headerHasValue(headers: Headers, headerName: string, search: RegExp): boolean {
  const matches = headers.get(headerName)?.match(search)
  if (matches) {
    return true
  } else {
    return false
  }
}

export function responseHasServerCacheTime(response: Response): boolean {
  if (response.headers.has('cache-control')) {
    return (
      headerHasValue(response.headers, 'cache-control', /s-maxage=(\d+)/) ||
      headerHasValue(response.headers, 'cloudflare-cdn-cache-control', /max-age=(\d+)/) ||
      headerHasValue(response.headers, 'cdn-cache-control', /max-age=(\d+)/)
    )
  } else {
    return false
  }
}

export const defaultCloudflareCacheTime = 600
export const shortCloudflareCacheTime = 60

// https://developers.cloudflare.com/cache/how-to/configure-cache-status-code/#edge-ttl
// We don't want to cache 500s but I am OK with caching redirects and 404s
export function cacheTimeByStatus(status_code: number): number {
  // Cache for a while or until purged
  if ([200, 301, 404].indexOf(status_code) !== -1) {
    return defaultCloudflareCacheTime
  }
  // cache for a short while
  if ([302, 303, 403, 410].indexOf(status_code) !== -1) {
    return shortCloudflareCacheTime
  }
  return 0
}

export async function defaultCacheStrategy(
  request: Request,
  ctx: ExecutionContext,
  cacheKey: string,
): Promise<Response> {
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

    // Cache API respects Cache-Control headers.
    // Any changes made to the response here will be reflected in the cached value
    // Store the fetched response as cacheKey
    // Use waitUntil so you can return the response without blocking on writing to cache
    const cacheTime = cacheTimeByStatus(response.status)
    if (cacheTime > 0 && responseCachable(response)) {
      if (!responseHasServerCacheTime(response)) {
        response.headers.append('cloudflare-cdn-cache-control', 'max-age=' + cacheTime)
        console.log(
          `Adding CF Cache control: ${response.headers.get('cloudflare-cdn-cache-control')} to ${request.url}`,
        )
      }
      console.log(`Caching ${request.url} :  ${response.headers.get('cache-control')}`)
      // response.headers.set('cf-cache-status', 'MISS')
      ctx.waitUntil(cache.put(cacheKey, response.clone()))
    } else {
      console.log(`Not caching ${request.url} : response code ${response.status} : ${responseCachable(response)}`)
    }
    // } else {
    //   console.log(`Cache hit for: ${request.url}.`)
  }
  return response
}
