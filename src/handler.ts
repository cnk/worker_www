import { Request } from 'itty-router'

export async function errorHandler(error: Error): Promise<Response> {
  return new Response(error.message || 'Something went wrong.', {
    status: 500,
    statusText: 'Internal Server Error',
  })
}

export function responseCachable(response: Response) {
  if (response.headers.get('set-cookie')) {
    return false
  }
  if (response.headers.has('cache-control')) {
    return !['private', 'no-cache', 'no-store', 'max-age=0'].some(
      (str) => response.headers.get('cache-control')?.includes?.(str)
    )
  }
  // default to false just to be sure
  return false
}

export async function defaultCache(request: Request): Promise<Response> {
  return new Response(`request method: ${request.method}`)
}
