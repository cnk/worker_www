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
  let href = requestUrl.pathname || ''
  if (requestUrl.search != '') {
    requestUrl.searchParams.sort()
    href = href + '?' + requestUrl.searchParams
  }
  if (requestUrl.hash) {
    href = href + requestUrl.hash
  }
  return href
}

export async function defaultCacheStrategy(
  request: Request,
): Promise<Response> {
  // Construct the cache key from the cache URL
  const cacheKey = new Request(buildCacheKey(request), request)
  const cache = caches.default

  // Check whether the value is already available in the cache
  // if not, you will need to fetch it from origin, and store it in the cache
  // for future access
  const response = await cache.match(cacheKey)

  console.log(response)

  return new Response(`request method: ${request.method}`)
}
