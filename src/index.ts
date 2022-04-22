import { defaultCacheStrategy, errorHandler } from './handler'
import { Router } from 'itty-router'

// Create a new router
const router = Router()

/*
Define default route that will check cache and if page not found,
request it from our origin server, cache it based on the Cache-Control
headers sent from our server, and then return it to the user.
*/
router.all('*', (request, ctx) => defaultCacheStrategy(request, ctx))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where our routes are called and the response is sent.
*/
export async function handleRequest(
  request: Request,
  _env: Bindings,
  ctx: ExecutionContext,
): Promise<Response> {
  return router.handle(request, ctx).catch(errorHandler)
}

const worker: ExportedHandler<Bindings> = { fetch: handleRequest }

export default worker
