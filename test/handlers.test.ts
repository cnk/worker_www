import { defaultCacheStrategy, errorHandler } from '../src/handler'
import makeServiceWorkerEnv from 'service-worker-mock'
import { Cache } from '@miniflare/cache'
import { MemoryStorage } from '@miniflare/storage-memory'

declare var global: any

describe('handle', () => {
  beforeAll(() => {
    const clock = { timestamp: 1_000_000 } // 1000s
    const clockFunction = () => clock.timestamp
    const storage = new MemoryStorage(undefined, clockFunction)
    // const cache = new Cache(storage, { clock: clockFunction })
  })

  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv())
    jest.resetModules()
  })

  test('handle GET', async () => {
    const result = await defaultCacheStrategy(
      new Request('/', { method: 'GET' }),
      new ExecutionContext(),
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
