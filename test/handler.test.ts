import { defaultCache, errorHandler, responseCachable } from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'

declare var global: any

describe('handle', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  test('handle GET', async () => {
    const result = await defaultCache(new Request('/', { method: 'GET' }))
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
  test('private responses not cachable', () => {
    const response = new Response(
      'throwaway body',
      {'status': 200, 'headers': {'Cache-Control': 'public'}}
    )
    expect(responseCachable(response)).toEqual(false)
  })
})