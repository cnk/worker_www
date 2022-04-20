// import { ExecutionContext } from '@miniflare/core'
import { defaultCacheStrategy, errorHandler } from '../src/handler'

class ExecutionContext {
  promises: Promise<any>[] = [];
  waitUntil(promise: Promise<any>) { this.promises.push(promise); }
  passThroughOnException() {}
}

describe('handle', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('handle GET', async () => {
    const request = new Request('https://www.test.com/', { method: 'GET' })
    const ctx = new ExecutionContext()
    const result = await defaultCacheStrategy(request, ctx)
    await Promise.all(ctx.promises);

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
