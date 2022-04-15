import { Request } from 'itty-router'

export async function errorHandler(error: Error): Promise<Response> {
  return new Response(error.message || 'Something went wrong.', {
    status: 500,
    statusText: 'Internal Server Error',
  })
}

export async function defaultCache(request: Request): Promise<Response> {
  return new Response(`request method: ${request.method}`)
}
