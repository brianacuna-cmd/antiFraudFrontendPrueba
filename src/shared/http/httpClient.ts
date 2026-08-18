import { useSettingsStore } from '@shared/settings/settingsStore'
import { mapErrorResponse } from './errors'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | string[] | undefined>
  /** Pass a FormData body untouched (skips JSON encoding / content-type header). */
  isFormData?: boolean
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v))
    } else {
      params.append(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { userId, organizationId, apiBase } = useSettingsStore.getState()

  const headers: Record<string, string> = {}
  if (userId) headers['x-actor-user-id'] = userId
  if (organizationId) headers['x-actor-organization-id'] = organizationId

  let body: BodyInit | undefined
  if (options.isFormData) {
    body = options.body as FormData
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const url = `${apiBase}${path}${buildQuery(options.query)}`
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body,
  })

  if (!response.ok) {
    const errorBody = await safeParseJson(response)
    throw mapErrorResponse(response.status, errorBody)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }
  return (await response.blob()) as T
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

export const httpClient = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  postForm: <T>(path: string, formData: FormData, query?: RequestOptions['query']) =>
    request<T>(path, { method: 'POST', body: formData, isFormData: true, query }),
}
