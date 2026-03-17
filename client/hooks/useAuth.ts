"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { api, setToken, removeToken } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { UserProfile, UserRole } from "@/lib/api/types"

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
      // Extraer datos del JWT para no requerir endpoint extra, asumiendo JWT base64
      const token = localStorage.getItem("access_token") || document.cookie.match(/(?:^|; )access_token=([^;]*)/)?.[1]
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          userId: payload.sub,
          fullName: payload.fullName,
          email: payload.email,
          role: payload.role as UserRole,
        })
      } else {
        setUser(null)
      }
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
    // La respuesta real del backend es { message: string, data: { token, role, fullName, userId, sessionUuid } }
    const response = await api.post<{ data: { token: string, role: UserRole, fullName: string, userId: string } }>(
      ENDPOINTS.AUTH.LOGIN, 
      { email, password }, 
      { skipAuth: true }
    )
    
    const backendData = response.data.data
    setToken(backendData.token)
    
    const userProfile = {
      userId: backendData.userId,
      fullName: backendData.fullName,
      email,
      role: backendData.role,
    }
    setUser(userProfile)

    // Redirigir según el rol
    const roleRoutes: Record<string, string> = {
      ADMIN: "/certificador-fel",
      AGENTE_OPERATIVO: "/agente-operativo",
      PILOTO: "/piloto",
      AGENTE_LOGISTICO: "/agente-logistico",
      ENCARGADO_PATIO: "/encargado-patio",
      CLIENTE: "/cliente",
    }
    router.push(roleRoutes[userProfile.role] || "/")
  }

  /** Cerrar sesión */
  const logout = () => {
    removeToken()
    setUser(null)
    router.push("/login")
  }

  return { user, loading, login, logout, refetch: fetchUser }
}
