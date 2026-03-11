# LOGITRANS — Frontend Client

Next.js 16 + Tailwind CSS v4 + TypeScript

## Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local

# 3. Correr el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Arquitectura

### Estructura de Carpetas

```
client/
├── app/                         ← Rutas (Next.js App Router)
│   ├── (auth)/                  ← Layout centrado (login, register, etc.)
│   ├── (dashboard-nav)/         ← Layout con Navbar superior
│   │   ├── agente-operativo/
│   │   ├── piloto/
│   │   └── agente-logistico/
│   └── (dashboard-sidebar)/     ← Layout con Sidebar lateral
│       ├── encargado-patio/
│       └── certificador-fel/
├── components/
│   ├── layout/                  ← Navbar, Sidebar
│   ├── shared/                  ← Logo, UserMenu, WelcomeCard, StatusBadge
│   └── ui/                     ← Button, Input, Card, Modal, Select
├── hooks/                       ← useAuth
├── lib/
│   ├── api/                     ← API client, endpoints, types
│   └── utils/                   ← cn (classnames)
└── types/                       ← Tipos globales
```

### Route Groups

Los paréntesis `()` son **Route Groups** de Next.js — no afectan la URL:

| Grupo | Layout | Roles |
|---|---|---|
| `(auth)` | Centrado sin nav | Login, Register, Forgot Password |
| `(dashboard-nav)` | Navbar superior | Agente Operativo, Piloto, Agente Logístico |
| `(dashboard-sidebar)` | Sidebar lateral | Encargado de Patio, Certificador FEL |

### Rutas del Frontend

| Ruta | Módulo | Descripción |
|---|---|---|
| `/login` | Auth | Inicio de sesión |
| `/register` | Auth | Registro |
| `/forgot-password` | Auth | Recuperar contraseña |
| `/agente-operativo` | Ag. Operativo | Dashboard de bienvenida |
| `/agente-operativo/registrar-cliente` | Ag. Operativo | Formulario de registrar cliente |
| `/agente-operativo/formalizar-contrato` | Ag. Operativo | Formalizar contrato |
| `/agente-operativo/contrato-generado` | Ag. Operativo | Confirmación de contrato |
| `/piloto` | Piloto | Dashboard Mis Viajes |
| `/piloto/viaje/[id]` | Piloto | Detalle del viaje |
| `/piloto/monitoreo/[id]` | Piloto | Monitoreo de ruta |
| `/piloto/bitacora/[id]` | Piloto | Bitácora de eventos |
| `/agente-logistico` | Ag. Logístico | Dashboard de bienvenida |
| `/agente-logistico/ordenes` | Ag. Logístico | Lista de órdenes |
| `/agente-logistico/ordenes/[id]` | Ag. Logístico | Detalle de orden |
| `/agente-logistico/asignacion-rutas` | Ag. Logístico | Asignar rutas |
| `/encargado-patio` | Enc. Patio | Dashboard de bienvenida |
| `/encargado-patio/cargas` | Enc. Patio | Formalizar cargas |
| `/certificador-fel` | Cert. FEL | Portal certificador |
| `/certificador-fel/bandeja` | Cert. FEL | Bandeja de aprobación |

---

## Design System

### Colores (Tailwind)

```css
bg-primary         /* #074F57 — Botones principales, elementos clave */
bg-primary-hover   /* #077187 — Hover */
bg-primary-active  /* #077187 — Active/pressed */
bg-secondary       /* #74A57F — Acciones secundarias */
bg-accent          /* #9ECE9A — Éxito, acentos */
bg-surface         /* #E4C5AF — Fondos cálidos, tarjetas */
bg-background      /* #F7F5F3 — Fondo de página */
bg-error           /* #D94F4F — Errores */
bg-warning         /* #E6A817 — Advertencias */

text-text-primary  /* #1A1A1A — Texto principal */
text-text-muted    /* #6B6B6B — Texto secundario */
```

### Tipografía

| Uso | Fuente | Tamaño | Clase Tailwind |
|---|---|---|---|
| H1 | Montserrat Alternates | 48px | `font-heading` |
| H2 | Lora | 32px | `font-subheading` |
| H3 | Lora | 24px | `font-subheading` |
| Body | Hind Madurai | 16px | `font-body` |
| Small | Hind Madurai | 14px | `text-small` |

---

## API Client — Cómo hacer fetch

El API client está en `lib/api/client.ts`. Ya incluye:
- ✅ JWT auto-inject en cada request
- ✅ Manejo automático de 401 (redirige a login)
- ✅ Toast de error automático con Sonner
- ✅ Tipado genérico

### Ejemplo básico — GET

```tsx
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

// Dentro de un componente o función:
const { data } = await api.get<Cliente[]>(ENDPOINTS.CLIENTES.LIST)
```

### Ejemplo — POST con body

```tsx
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { toast } from "sonner"

async function crearCliente(formData: Record<string, unknown>) {
  try {
    const { data } = await api.post(ENDPOINTS.CLIENTES.CREATE, formData)
    toast.success("Cliente registrado exitosamente")
    return data
  } catch (error) {
    // El toast de error ya se muestra automáticamente
    console.error(error)
  }
}
```

### Ejemplo — Con parámetro dinámico

```tsx
const { data } = await api.get(ENDPOINTS.VIAJES.GET("viaje-123"))
// → GET /api/v1/viajes/viaje-123
```

### Ejemplo — Login completo

```tsx
"use client"
import { useAuth } from "@/hooks/useAuth"

export default function LoginForm() {
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await login(
      form.get("email") as string,
      form.get("password") as string
    )
    // useAuth redirige automáticamente según el rol
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Iniciar sesión</button>
    </form>
  )
}
```

### Ejemplo — Confirmación con SweetAlert2

```tsx
import Swal from "sweetalert2"

async function eliminarRegistro(id: string) {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#074F57",
    cancelButtonColor: "#D94F4F",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  })

  if (result.isConfirmed) {
    await api.delete(ENDPOINTS.CLIENTES.GET(id))
    toast.success("Registro eliminado")
  }
}
```

---

## Librerías Incluidas

| Librería | Uso | Docs |
|---|---|---|
| [Framer Motion](https://motion.dev/) | Animaciones | `<motion.div animate={...}>` |
| [Sonner](https://sonner.emilkowal.dev/) | Toasts | `toast.success("Guardado")` |
| [SweetAlert2](https://sweetalert2.github.io/) | Modales/confirmaciones | `Swal.fire({...})` |
| [Lucide React](https://lucide.dev/) | Iconos | `<User size={20} />` |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | Classnames | `cn("bg-primary", active && "bg-primary-hover")` |

---

## Variables de Entorno

Copiar `.env.example` → `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Solo las variables con prefijo `NEXT_PUBLIC_` están disponibles en el cliente.
