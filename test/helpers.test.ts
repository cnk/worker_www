import {
  buildCacheKey,
  cacheTimeByStatus,
  headerHasValue,
  responseCachable,
  shortCloudflareCacheTime,
  defaultCloudflareCacheTime,
} from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'

declare var global: any

describe('responseCachable', () => {
  test('responses are not cacheable by default', () => {
    const response = new Response('throwaway body', {
      status: 200,
      headers: {},
    })
    expect(responseCachable(response)).toEqual(false)
  })

  test('public responses are cachable', () => {
    const response = new Response('throwaway body', {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=30, s-max-age=30' },
    })
    expect(responseCachable(response)).toEqual(true)
  })

  test('private responses are not cachable', () => {
    const response = new Response('throwaway body', {
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=0' },
    })
    expect(responseCachable(response)).toEqual(false)
  })

  test('responses with cookies are not cachable', () => {
    const response = new Response('throwaway body', {
      status: 200,
      headers: {
        'set-cookie': 'sessionid=randomstring; HttpOnly; Path=/; SameSite=lax; Secure',
      },
    })
    expect(responseCachable(response)).toEqual(false)
  })
})

describe('buildCacheKey', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  test('returns string containing the homepage url', () => {
    const request = new Request('https://www.test.com/')
    expect(buildCacheKey(request)).toEqual('https://www.test.com/')
  })

  test('returns string containing the full url', () => {
    const request = new Request('https://www.test.com/foo/bar/baz')
    expect(buildCacheKey(request)).toEqual('https://www.test.com/foo/bar/baz')
  })

  test('returns url with query string sorted', () => {
    const request = new Request('https://www.test.com/search?q=test&order=date')
    expect(buildCacheKey(request)).toEqual('https://www.test.com/search?order=date&q=test')
  })

  test('strip all query string parameters', () => {
    const request = new Request('https://www.test.com/search?q=test&order=date')
    expect(buildCacheKey(request, [])).toEqual('https://www.test.com/search')
  })

  test('removes extra query params from url', () => {
    const request = new Request('https://www.test.com/search?q=test&order=date&submit=Search')
    expect(buildCacheKey(request, ['q', 'order'])).toEqual('https://www.test.com/search?order=date&q=test')
  })

  test('keeps multi-valued param', () => {
    // CNK NOTE this does not sort the query values
    const request = new Request('https://www.test.com/search?q=foo&q=bar&submit=Search')
    expect(buildCacheKey(request, ['q'])).toEqual('https://www.test.com/search?q=foo&q=bar')
  })
})

describe('headerHasValue', () => {
  test('returns true if value found', () => {
    const headers = new Headers({
      'cache-control': 'public, max-age=20140, s-maxage=20140',
    })
    expect(headerHasValue(headers, 'cache-control', /s-maxage=(\d+)/)).toBeTruthy()
  })

  test('returns false if value not found', () => {
    const headers = new Headers({
      'cache-control': 'public, max-age=20140, must-revalidate, no-transform',
    })
    expect(headerHasValue(headers, 'cache-control', /s-maxage=(\d+)/)).toBeFalsy()
  })

  test('returns false if value in a different header', () => {
    const headers = new Headers({
      'cache-control': 'public, max-age=20140, must-revalidate, no-transform',
      'cdn-cache-control': 'public, max-age=20140, no-transform',
    })
    expect(headerHasValue(headers, 'cdn-cache-control', /must-revalidate/)).toBeFalsy()
  })
})

describe('cacheTimeByStatus', () => {
  test('cache 202 OK responses', () => {
    expect(cacheTimeByStatus(200)).toEqual(defaultCloudflareCacheTime)
  })

  test('cache 404 Not Found responses', () => {
    expect(cacheTimeByStatus(404)).toEqual(defaultCloudflareCacheTime)
  })

  test('cache 301 Permanent Redirect responses', () => {
    expect(cacheTimeByStatus(301)).toEqual(defaultCloudflareCacheTime)
  })

  test('cache 302 Temporary Redirect responses for a short time', () => {
    expect(cacheTimeByStatus(302)).toEqual(shortCloudflareCacheTime)
  })

  test('cache 403 Forbidden responses for a short time', () => {
    expect(cacheTimeByStatus(403)).toEqual(shortCloudflareCacheTime)
  })

  test('do not cache server errors', () => {
    expect(cacheTimeByStatus(500)).toEqual(0)
  })
})
