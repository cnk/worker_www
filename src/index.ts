import { buildCacheKey, defaultCacheStrategy, errorHandler } from './handler'
import { Router } from 'itty-router'

// Create a new router
const router = Router()

// Autocompleter urls that have 'never_cache' decorators; all take q and forward
//   const allowedQueryKeys = ['forward', 'q']
// /core/division_autocomplete
// /map/location_autocomplete
// /master_calendar/event_series_autocomplete
// /master_calendar/event_sponsor_autocomplete

// News hub - filter allowed parameters
router.all('/about/news', (request, ctx) => {
  const allowedQueryKeys = ['category', 'ordering', 'p', 'search', 'submit', 'tag', 'year']
  return defaultCacheStrategy(request, ctx, buildCacheKey(request, allowedQueryKeys))
})

// In The Media - filter allowed parameters
router.all('/about/caltech-media', (request, ctx) => {
  return defaultCacheStrategy(request, ctx, buildCacheKey(request, ['p']))
})

// Calendar - filter allowed parameters
router.all('/campus-life-events/calendar/filter', (request, ctx) => {
  const allowedQueryKeys = [
    'date_start',
    'date_end',
    'divisions',
    'ical',
    'locations',
    'mc',
    'past',
    'p',
    'search',
    'sponsors',
    'type',
  ]
  return defaultCacheStrategy(request, ctx, buildCacheKey(request, allowedQueryKeys))
})

// Make sure we don't cache ical when we mean event and vice versa
router.all('/campus-life-events/calendar/*', (request, ctx) => {
  const allowedQueryKeys = ['ical']
  return defaultCacheStrategy(request, ctx, buildCacheKey(request, allowedQueryKeys))
})

// Campus Announcements - filter allowed parameters
router.all('/campus-life-events/campus-announcements', (request, ctx) => {
  const allowedQueryKeys = ['institute', 'p', 'section_id']
  return defaultCacheStrategy(request, ctx, buildCacheKey(request, allowedQueryKeys))
})

// Search should allow an optional 'q' and nothing else
router.all('/search', (request, ctx) => {
  return defaultCacheStrategy(request, ctx, buildCacheKey(request, ['q']))
})

/*
Define default route that will check cache and if page not found,
request it from our origin server, cache it based on the Cache-Control
headers sent from our server, and then return it to the user.
*/
router.all('*', (request, ctx) => {
  return defaultCacheStrategy(request, ctx, buildCacheKey(request, ['*']))
})

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where our routes are called and the response is sent.
*/
export async function handleRequest(request: Request, _env: Bindings, ctx: ExecutionContext): Promise<Response> {
  return router.handle(request, ctx).catch(errorHandler)
}

const worker: ExportedHandler<Bindings> = { fetch: handleRequest }

export default worker
