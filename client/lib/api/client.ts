import { toast } from "sonner"

/* ===========================
   API Client — Fetch Wrapper con JWT
   Patrón Decorator: intercepta cada request
   para inyectar auth headers y manejar errores.
   =========================== */

/**
 * En staging/prod con proxy de Vercel dejamos string vacío para llamar same-origin `/api/...`.
 * En local: NEXT_PUBLIC_API_URL=http://localhost:3006
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL === undefined
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_API_URL

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

/* ---------- Tipos ---------- */

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown | FormData
  /** Si true, no agrega Authorization header */
  skipAuth?: boolean
  /** Si true, no muestra toast de error */
  silentError?: boolean
  /** Reintentos ante cold-start / red (default: true) */
  retry?: boolean
}

interface ApiResponse<T> {
  data: T
  status: number
  ok: boolean
}

interface ApiError {
  message: string
  status: number
  details?: unknown
}

/* ---------- Token helpers ---------- */

function getToken(): string | null {
  if (typeof window === "undefined") return null
  // Usamos api de document.cookie también para poder leer
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
  if (match) return match[1]
  return localStorage.getItem("access_token")
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token)
  // Añadimos a cookies para que lo lea el middleware (30 días)
  document.cookie = `access_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}`
}

export function removeToken(): void {
  localStorage.removeItem("access_token")
  document.cookie = "access_token=; path=/; max-age=0"
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableStatus(status: number) {
  return status === 404 || status === 502 || status === 503 || status === 504
}

/* ---------- Core fetch wrapper ---------- */

async function requestOnce<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, skipAuth = false, silentError = false, retry: _retry, ...fetchOptions } =
    options

  // Build headers
  const headers: HeadersInit = {
    ...(fetchOptions.headers as Record<string, string>),
  }

  // Auto-inject JWT
  if (!skipAuth) {
    const token = getToken()
    if (token) {
      ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
    }
  }

  // Handle JSON body
  if (body && !(body instanceof FormData)) {
    ;(headers as Record<string, string>)["Content-Type"] = "application/json"
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: "include",
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    })

    // Handle 401 — Token expirado (solo redirige si era una petición autenticada)
    if (response.status === 401 && !skipAuth) {
      removeToken()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw { message: "Sesión expirada. Por favor inicia sesión de nuevo.", status: 401 }
    }

    // Parse response
    let data: T
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      data = (await response.text()) as unknown as T
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage =
        (typeof data === "object" &&
          data &&
          ((data as Record<string, string>).message ||
            (data as Record<string, string>).detail)) ||
        `Error ${response.status}`

      throw { message: errorMessage, status: response.status, details: data } as ApiError
    }

    return { data, status: response.status, ok: true }
  } catch (error) {
    // Network / CORS errors (no HTTP status)
    if (!(error as ApiError).status) {
      throw {
        message:
          "El servidor de pruebas está despertando. Espera unos segundos e inténtalo de nuevo.",
        status: 0,
      } as ApiError
    }
    throw error
  }
}

async function request<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { silentError = false, retry = true } = options
  const attempts = retry ? MAX_RETRIES : 1
  let lastError: ApiError | undefined

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await requestOnce<T>(endpoint, options)
    } catch (error) {
      lastError = error as ApiError
      const canRetry =
        retry &&
        attempt < attempts &&
        (lastError.status === 0 || isRetryableStatus(lastError.status))

      if (!canRetry) break

      if (!silentError && typeof window !== "undefined") {
        toast.message(`Conectando al servidor… (${attempt}/${attempts - 1})`)
      }
      await sleep(RETRY_DELAY_MS * attempt)
    }
  }

  if (!silentError && lastError) {
    toast.error(lastError.message || "Error de conexión. Verifica tu internet.")
  }
  throw lastError
}

/** Despierta el API de Render (free tier) antes del login. */
export async function wakeApi(): Promise<boolean> {
  try {
    await requestOnce("/api/health", {
      skipAuth: true,
      silentError: true,
      method: "GET",
    })
    return true
  } catch {
    // Un intento basta; el login hará retries.
    return false
  }
}

/* ---------- Métodos HTTP ---------- */

export const api = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
}

export type { ApiResponse, ApiError, ApiRequestOptions }
