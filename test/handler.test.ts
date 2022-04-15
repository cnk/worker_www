import { defaultCache, errorHandler } from '../src/handler'
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
