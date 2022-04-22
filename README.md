# Page rules written as a Cloudflare Worker

This project was initially generated using the
[worker-typescript-template](https://github.com/cloudflare/worker-typescript-template).
I have subsequently copied some of the module code and config files from the
[miniflare-typescript-esbuild-jest
repository](https://github.com/mrbbot/miniflare-typescript-esbuild-jest) so I
could use some of miniflare's support for parts of the Cloudflare stack. In
particular, I am interested in having an in memory cache (or a mock cache) so I
can test my caching handlers.

### 👩 💻 Developing

```shell
# Install dependencies
$ npm install
# Format and lint (from the original template)
$ npm run format # uses prettier
$ npm run lint  # Lint complains eslint does not officially support my version of typescript
# Run type checking
$ npm run types:check
```

To start the miniflare environment in debug mode, run the following:

```shell
miniflare --debug --upstream https://example.com/ dist/index.mjs
```

If you don't want to have to use `--upstream` each time, set the upstream url in
the miniflare section of the wrangler.toml file


### 🧪 Testing

`npm test` will run your tests.

The worker-typescript-template template came with jest tests which simply test
that the request handler can handle each request method. The npm test script in
the package.json file was defined as `jest --config jest.config.js --verbose`.

I tried changing this to the version of the test script from the miniflare
example project: `npm run build && node --experimental-vm-modules
node_modules/jest/bin/jest.js` but then I can't get my tests to run at all. The
build part of it works if called separately so it must be the node command that
isn't working. So I went back to the simpler jest script above.

```
 FAIL  test/helpers.test.ts
  ● Test suite failed to run

    ReferenceError: exports is not defined

      3 |
      4 | declare var global: any
    > 5 |
        | ^
      6 | describe('responseCachable', () => {
      7 |   test('responses are not cacheable by default', () => {
      8 |     const response = new Response('throwaway body', {

      at test/helpers.test.ts:5:23

 FAIL  test/handlers.test.ts
  ● Test suite failed to run

    ReferenceError: exports is not defined

      3 | import { Cache } from '@miniflare/cache'
      4 | import { MemoryStorage } from '@miniflare/storage-memory'
    > 5 |
        | ^
      6 | declare var global: any
      7 |
      8 | describe('handle', () => {

      at test/handlers.test.ts:5:23
```

### 🌐 Deploying

The miniflare documentation doesn't have any information about deploying so I
think that means we [use wrangler](https://developers.cloudflare.com/workers/get-started/guide/#7-configure-your-project-for-deployment)
as before.

*CNK TO DO:* figure out how to use environment variables inside my wrangler.toml
file so I can commit most of my configuration but NOT my account_ids and domain
mappings.

```shell
wrangler publish --env test
```

And to remove a worker, first you need the id for the worker, then you can
delete it:

```shell
wrangler route list --env test
wrangler route delete <id>
```

### 🛠 Debugging

The output from wranglers logs is JSON so at minimum you probably want to format
it with `jq`. If you are looking for specific values, you probably want to
filter to show just those items you want to see. For example `jq
.logs[].message` will show all messages from console.log. [Here is a good blog
post](https://earthly.dev/blog/jq-select/) explaining the logic behind jq filters.

```shell
wrangler tail --env test | jq
wrangler tail --env test | jq .logs[].message
```
