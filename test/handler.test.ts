import {
  buildCacheKey,
  defaultCacheStrategy,
  errorHandler,
  responseCachable,
} from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'

declare var global: any

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  test('handle GET', async () => {
    const result = await defaultCacheStrategy(
      new Request('/', { method: 'GET' }),
    )
    expect(result.status).toEqual(200)
    const text = await result.text()
    expect(text).toEqual('request method: GET')
  })

  test('error with message', async () => {
    const result = await errorHandler(new Error('Something bad happened'))
    expect(result.status).toEqual(500)
    const text = await result.text()
    expect(text).toEqual('Something bad happened')
  })
})

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
        'set-cookie':
          'sessionid=randomstring; HttpOnly; Path=/; SameSite=lax; Secure',
      },
    })
    expect(responseCachable(response)).toEqual(false)
  })
})

describe('buildCacheKey', () => {
  test('returns string containing the url', () => {
    const request = new Request('/')
    expect(buildCacheKey(request)).toEqual('/')
  })

  test('returns string containing the url', () => {
    const request = new Request('/foo/bar/baz')
    expect(buildCacheKey(request)).toEqual('/foo/bar/baz')
  })

  test('returns url with query string sorted', () => {
    const request = new Request('/search?q=test&order=date')
    expect(buildCacheKey(request)).toEqual('/search?order=date&q=test')
  })
})
