import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mswServer'

// jsdom's built-in File/Blob/FormData do not implement the stream methods
// that MSW's node interceptor (built on undici) needs to read a multipart
// request body — `request.formData()` hangs forever without this. Swap in
// Node's own implementations, which are undici-compatible.
// https://mswjs.io/docs/faq#requestformdata-hangs-in-jsdom
import { Blob, File } from 'node:buffer'
import { FormData, Headers, Request, Response, fetch } from 'undici'

Object.defineProperties(globalThis, {
  File: { value: File, writable: true, configurable: true },
  Blob: { value: Blob, writable: true, configurable: true },
  FormData: { value: FormData, writable: true, configurable: true },
  Headers: { value: Headers, writable: true, configurable: true },
  Request: { value: Request, writable: true, configurable: true },
  Response: { value: Response, writable: true, configurable: true },
  fetch: { value: fetch, writable: true, configurable: true },
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
