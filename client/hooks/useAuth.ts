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
      // Extraer datos del JWT para no requerir endpoint extra, asumiendo JWT base64
      const token = localStorage.getItem("access_token") || document.cookie.match(/(?:^|; )access_token=([^;]*)/)?.[1]
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          id: payload.sub,
          nombre: payload.fullName,
          email: payload.email,
          rol: payload.role.toLowerCase() as any
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
    const response = await api.post<{ data: { token: string, role: string, fullName: string, userId: string } }>(
      ENDPOINTS.AUTH.LOGIN, 
      { email, password }, 
      { skipAuth: true }
    )
    
    const backendData = response.data.data
    setToken(backendData.token)
    
    const userProfile = {
      id: backendData.userId,
      nombre: backendData.fullName,
      email,
      rol: backendData.role.toLowerCase() as any
    }
    setUser(userProfile)

    // Redirigir según el rol
    const roleRoutes: Record<string, string> = {
      agente_operativo: "/agente-operativo",
      piloto: "/piloto",
      agente_logistico: "/agente-logistico",
      encargado_patio: "/encargado-patio",
      certificador_fel: "/certificador-fel",
    }
    router.push(roleRoutes[userProfile.rol] || "/")
  }

  /** Cerrar sesión */
  const logout = () => {
    removeToken()
    setUser(null)
    router.push("/login")
  }

  return { user, loading, login, logout, refetch: fetchUser }
}
