import { defaultCache, errorHandler } from './handler'
import { Router } from 'itty-router'

// Create a new router
const router = Router()

/*
Define default route that will check cache and if page not found,
request it from our origin server, cache it based on the Cache-Control
headers sent from our server, and then return it to the user.
*/
router.all('*', (request) => defaultCache(request))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where our routes are called and the response is sent.
*/
addEventListener('fetch', (event) => {
  event.respondWith(router.handle(event.request).catch(errorHandler))
})
