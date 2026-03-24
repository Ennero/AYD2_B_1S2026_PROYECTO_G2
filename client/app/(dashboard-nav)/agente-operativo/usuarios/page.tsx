"use client"

import { useEffect, useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Select from "@/components/ui/Select"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { toast } from "sonner"
import { Loader2, Users, Search, Pencil } from "lucide-react"

type UserRole =
  | "CLIENTE"
  | "AGENTE_OPERATIVO"
  | "AGENTE_LOGISTICO"
  | "ENCARGADO_PATIO"
  | "PILOTO"
  | "AGENTE_FINANCIERO"
  | "GERENCIA"
  | "CERTIFICADOR_FEL"

type OperationUser = {
  userId: number
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
  role: UserRole
  clientId: number | null
  clientCode: string | null
  clientName: string | null
}

type ListUsersResponse = {
  message: string
  data: OperationUser[]
}

type UpdateUserResponse = {
  message: string
  data: OperationUser
}

const ROLE_LABEL: Record<UserRole, string> = {
  CLIENTE: "Cliente",
  AGENTE_OPERATIVO: "Agente Operativo",
  AGENTE_LOGISTICO: "Agente Logístico",
  ENCARGADO_PATIO: "Encargado de Patio",
  PILOTO: "Piloto",
  AGENTE_FINANCIERO: "Agente Financiero",
  GERENCIA: "Gerencia",
  CERTIFICADOR_FEL: "Certificador FEL",
}

export default function GestionarUsuariosPage() {
  const [users, setUsers] = useState<OperationUser[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedUser, setSelectedUser] = useState<OperationUser | null>(null)
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    isActive: true,
  })

  const roleOptions = useMemo(
    () => [
      { value: "", label: "Todos los roles" },
      ...Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })),
    ],
    [],
  )

  async function loadUsers() {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (search.trim()) query.set("search", search.trim())
      if (roleFilter) query.set("role", roleFilter)

      const endpoint = query.toString()
        ? `${ENDPOINTS.OPERATIONS.USERS}?${query.toString()}`
        : ENDPOINTS.OPERATIONS.USERS

      const response = await api.get<ListUsersResponse>(endpoint)
      setUsers(response.data.data)
    } catch {
      toast.error("No se pudo cargar la lista de usuarios.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openEditModal(user: OperationUser) {
    setSelectedUser(user)
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      isActive: user.isActive,
    })
    setEditOpen(true)
  }

  async function handleSaveUser() {
    if (!selectedUser) return

    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      toast.error("Nombre y correo son obligatorios.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        isActive: editForm.isActive,
      }

      const response = await api.patch<UpdateUserResponse>(
        ENDPOINTS.OPERATIONS.USER(selectedUser.userId),
        payload,
      )

      const updated = response.data.data
      setUsers((prev) =>
        prev.map((item) => (item.userId === updated.userId ? { ...item, ...updated } : item)),
      )

      toast.success("Usuario actualizado correctamente.")
      setEditOpen(false)
      setSelectedUser(null)
    } catch {
      // api client already shows a detailed toast
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 pointer-events-none"
        style={{ backgroundImage: "url('/images/agente-minimal-hd.png')" }}
      />

      <div className="relative z-10 w-full min-h-screen px-6 py-12 md:p-16 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-extrabold text-primary flex items-center gap-3">
            <Users className="text-[#53B73E]" size={36} />
            Gestión de Usuarios
          </h1>
          <p className="text-text-muted text-lg mt-2">
            Visualiza y edita usuarios del sistema desde el módulo de Agente Operativo.
          </p>
        </div>

        <Card className="p-6 md:p-8 rounded-3xl bg-white/95 backdrop-blur-md border-black/5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <Search size={18} />
              </span>
              <Input
                label=""
                placeholder="Buscar por nombre, correo, cliente o NIT"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>

            <Select
              label=""
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end mb-6">
            <Button
              type="button"
              className="bg-primary text-white hover:bg-primary-hover"
              onClick={() => void loadUsers()}
              loading={loading}
            >
              Actualizar listado
            </Button>
          </div>

          {loading ? (
            <div className="py-14 flex items-center justify-center text-primary gap-3">
              <Loader2 className="animate-spin" size={20} />
              Cargando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="py-14 text-center text-text-muted">No se encontraron usuarios con los filtros actuales.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-sm">
                <thead>
                  <tr className="text-left border-b border-black/10 text-text-muted uppercase tracking-wide text-xs">
                    <th className="py-3 px-2">Nombre</th>
                    <th className="py-3 px-2">Correo</th>
                    <th className="py-3 px-2">Rol</th>
                    <th className="py-3 px-2">Cliente</th>
                    <th className="py-3 px-2">Estado</th>
                    <th className="py-3 px-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.userId} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                      <td className="py-3 px-2 font-medium text-primary">{user.fullName}</td>
                      <td className="py-3 px-2">{user.email}</td>
                      <td className="py-3 px-2">{ROLE_LABEL[user.role]}</td>
                      <td className="py-3 px-2">
                        {user.clientCode && user.clientName ? `${user.clientCode} - ${user.clientName}` : "-"}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            user.isActive
                              ? "bg-[#53B73E]/15 text-[#2E6A21]"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-primary text-primary hover:bg-primary hover:text-white"
                          onClick={() => openEditModal(user)}
                        >
                          <Pencil size={14} />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} size="md">
        <div className="-mx-6 -mt-4 mb-6 h-1.5 bg-primary" />

        <h2 className="text-2xl font-heading font-bold text-primary mb-6">Editar Usuario</h2>

        <div className="space-y-4">
          <Input
            label="Nombre completo"
            value={editForm.fullName}
            onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))}
          />

          <Input
            label="Correo"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
          />

          <Input
            label="Teléfono"
            value={editForm.phone}
            onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))}
          />

          <label className="flex items-center gap-3 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(e) => setEditForm((s) => ({ ...s, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-black/20"
            />
            Usuario activo
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-primary text-white hover:bg-primary-hover"
            onClick={() => void handleSaveUser()}
            loading={saving}
          >
            Guardar cambios
          </Button>
        </div>
      </Modal>
    </div>
  )
}
