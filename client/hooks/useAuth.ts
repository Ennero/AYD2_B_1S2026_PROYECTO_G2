"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { api, setToken, removeToken } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { UserProfile, LoginResponse } from "@/lib/api/types"

/**
 * Hook de autenticación.
 * Maneja login, logout, y estado del usuario actual.
 *
 * @example
 * const { user, loading, login, logout } = useAuth()
 */
export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  /** Obtener perfil del usuario actual */
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get<UserProfile>(ENDPOINTS.AUTH.ME, { silentError: true })
      setUser(response.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  /** Login con email y contraseña */
  const login = async (email: string, password: string) => {
    const response = await api.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, { email, password }, { skipAuth: true })
    setToken(response.data.access_token)
    setUser(response.data.user)

    // Redirigir según el rol
    const roleRoutes: Record<string, string> = {
      agente_operativo: "/agente-operativo",
      piloto: "/piloto",
      agente_logistico: "/agente-logistico",
      encargado_patio: "/encargado-patio",
      certificador_fel: "/certificador-fel",
    }
    router.push(roleRoutes[response.data.user.rol] || "/")
  }

  /** Cerrar sesión */
  const logout = () => {
    removeToken()
    setUser(null)
    router.push("/login")
  }

  return { user, loading, login, logout, refetch: fetchUser }
}
