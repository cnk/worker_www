// import { ExecutionContext } from '@miniflare/core'
import { buildCacheKey, defaultCacheStrategy, errorHandler } from '../src/handler'

// Create a fake ExecutionContext to pass to defaultCacheStrategy
class ExecutionContext {
  promises: Promise<any>[] = []
  waitUntil(promise: Promise<any>) {
    this.promises.push(promise)
  }
  passThroughOnException() {}
}

describe('handle', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('handle GET', async () => {
    const request = new Request('https://test.caltech.edu/about')
    const ctx = new ExecutionContext()
    const cacheKey = buildCacheKey(request)
    const result = await defaultCacheStrategy(request, ctx, cacheKey)
    await Promise.all(ctx.promises)

    expect(result.status).toEqual(200)
    console.log(Array.from(result.headers.entries()))
    expect(result.headers.get('cf-ray')).toBeDefined()
    // const text = await result.text()
    // expect(text).toBeDefined()
  })

  test('error with message', async () => {
    const result = await errorHandler(new Error('Something bad happened'))
    expect(result.status).toEqual(500)
    const text = await result.text()
    expect(text).toEqual('Something bad happened')
  })
})
