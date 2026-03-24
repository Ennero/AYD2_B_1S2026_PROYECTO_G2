"use client"

import { useState, useEffect, useMemo } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/shared/StatusBadge"
import { CheckCircle2, Circle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils/cn"
import { api } from "@/lib/api/client"

type CargaReal = {
  id: string
  codigo: string
  unitId: string | null
  pilotName: string
  vehicleModel: string
  plateNumber: string
  fecha: string
  origen: string
  destino: string
  estado: "PENDIENTE" | "FORMALIZADO"
  peso: string
  estibaValida: boolean
}

export default function FormalizarCargasPage() {
  const [allCargas, setAllCargas] = useState<CargaReal[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros state
  const [piloto, setPiloto] = useState("")
  const [placa, setPlaca] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [orden, setOrden] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchCargas = async () => {
      try {
        setLoading(true)
        const response = await api.get<{ message: string, data: CargaReal[] }>('/api/operations/cargas')
        if (response.ok) {
          setAllCargas(response.data.data)
        }
      } catch (error) {
        toast.error("Error cargando las órdenes del servidor")
      } finally {
        setLoading(false)
      }
    }
    fetchCargas()
  }, [])

  const cargas = useMemo(() => {
    let filtered = [...allCargas]

    if (piloto.trim()) {
      const term = piloto.trim().toLowerCase()
      filtered = filtered.filter(c =>
        c.pilotName.toLowerCase().includes(term) ||
        c.codigo.toLowerCase().includes(term) ||
        c.vehicleModel.toLowerCase().includes(term) ||
        c.plateNumber.toLowerCase().includes(term) ||
        c.origen.toLowerCase().includes(term) ||
        c.destino.toLowerCase().includes(term)
      )
    }

    if (placa.trim()) {
      const term = placa.trim().toLowerCase()
      filtered = filtered.filter(c => c.plateNumber.toLowerCase().includes(term))
    }

    if (fechaInicio) {
      filtered = filtered.filter(c => c.fecha >= fechaInicio)
    }

    if (fechaFin) {
      filtered = filtered.filter(c => c.fecha <= fechaFin)
    }

    filtered.sort((a, b) =>
      orden === "asc"
        ? a.fecha.localeCompare(b.fecha)
        : b.fecha.localeCompare(a.fecha)
    )

    return filtered
  }, [allCargas, piloto, placa, fechaInicio, fechaFin, orden])

  const handleClearFilters = () => {
    setPiloto("")
    setPlaca("")
    setFechaInicio("")
    setFechaFin("")
    setOrden("desc")
  }

  const handleFormalizar = async (id: string, carga: CargaReal) => {
    const weight = Number(carga.peso)
    if (!carga.unitId || !Number.isFinite(weight) || weight <= 0 || !carga.estibaValida) {
      toast.error("Debes tener unit_id asignado, registrar peso > 0 y validar estiba")
      return
    }

    try {
      const response = await api.patch(`/api/operations/cargas/${id}/formalizar`, {
        loadedWeightTon: weight,
        stowageConfirmed: carga.estibaValida
      })

      if (response.ok) {
        setAllCargas(prev => prev.map(c => c.id === id ? { ...c, estado: "FORMALIZADO" as const } : c))
        toast.success(`Carga ${carga.codigo} formalizada correctamente`)
      }
    } catch (error) {
      // Notificación automática por el api client si falla
    }
  }

  const updateCargaField = (id: string, field: keyof CargaReal, value: any) => {
    setAllCargas(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-black/10 pb-4 mb-6 relative">
        <h1 className="text-3xl font-heading font-bold text-center text-primary">
          Cargas a Formalizar
        </h1>
        {/* Adorno superior central para simular el wireframe */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-[80%] h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Filter Options */}
      <Card className="mb-8 p-6 bg-white border border-black/5 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Input 
            label="Piloto" 
            placeholder="Ej. Pablo" 
            value={piloto}
            onChange={(e) => setPiloto(e.target.value)}
          />
          <Input 
            label="Número de Placa" 
            placeholder="Ej. C123XXX" 
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
          />
          <Input 
            type="date" 
            label="Fecha Inicio" 
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <Input 
            type="date" 
            label="Fecha Fin" 
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-primary">
              <input 
                type="radio" 
                name="orden" 
                value="asc" 
                checked={orden === "asc"}
                onChange={() => setOrden("asc")}
                className="w-4 h-4 text-primary accent-primary" 
              />
              Orden Ascendente
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-primary">
              <input 
                type="radio" 
                name="orden" 
                value="desc" 
                checked={orden === "desc"}
                onChange={() => setOrden("desc")}
                className="w-4 h-4 text-primary accent-primary" 
              />
              Orden Descendente
            </label>
          </div>

          <Button
            onClick={handleClearFilters}
            className="rounded-full px-4 h-10 text-sm bg-black/10 hover:bg-black/20 text-text-primary shadow-sm"
          >
            Limpiar
          </Button>
        </div>
      </Card>

      {/* Lista de Cargas */}
      <div className="space-y-12 mt-10">
        {cargas.map((carga) => {
          const isFormalizado = carga.estado === "FORMALIZADO"
          const hasAssignedUnit = Boolean(carga.unitId)

          return (
            <div key={carga.id} className="relative">
              {/* Badge superior centrado usando el design system */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <StatusBadge 
                  variant={isFormalizado ? "success" : "warning"}
                  className="px-6 py-1 text-sm shadow-sm bg-surface"
                >
                  {isFormalizado ? "Formalizado" : "Pendiente"}
                </StatusBadge>
              </div>

              {/* Contenedor principal de la carga (Usa secondary o dark primary segun wireframe) */}
              <div className={`p-6 pt-8 rounded-2xl shadow-lg border relative overflow-hidden transition-colors duration-300 ${
                isFormalizado ? "bg-primary text-white border-primary-active/50" : "bg-[#0A474D] text-white border-[#08383D]/50"
              }`}>
                
                {/* Decoration */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-1 h-3/4 rounded-full bg-white/20 border-l border-white/20 border-dashed" />

                <div className="pl-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Codigo y titulo placa */}
                  <div className="lg:col-span-3">
                    <div className="bg-[#DBCFB0] text-text-primary px-4 py-2 rounded-xl text-center font-bold text-xl mb-3 w-max mx-auto shadow-inner">
                      {carga.codigo}
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 text-center sm:text-left mb-4 sm:mb-0">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Unidad Asignada</p>
                      <p className="font-bold text-lg wrap-break-word leading-tight">{carga.vehicleModel}</p>
                      <p className="text-xs text-white/70 break-all">Placa: {carga.plateNumber}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Piloto</p>
                      <p className="font-bold text-lg wrap-break-word leading-tight">{carga.pilotName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Fecha</p>
                      <p className="font-bold text-lg whitespace-nowrap">{carga.fecha}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Origen</p>
                      <p className="font-bold text-lg wrap-break-word leading-tight">{carga.origen}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-white/70 font-bold mb-1">Destino</p>
                      <p className="font-bold text-lg wrap-break-word leading-tight">{carga.destino}</p>
                    </div>
                  </div>

                  {/* Action Row - Inputs and buttons */}
                  <div className="lg:col-span-12 flex flex-wrap items-center justify-center lg:justify-end gap-x-6 gap-y-4 pt-4 border-t border-white/10 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">ID de orden:</span>
                      <input 
                        type="text" 
                        value={carga.id}
                        readOnly
                        className="w-48 px-3 py-1.5 text-center text-text-primary font-bold rounded bg-white shadow-inner disabled:opacity-80"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Peso en Báscula:</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={carga.peso}
                          onChange={(e) => updateCargaField(carga.id, 'peso', e.target.value)}
                          disabled={isFormalizado}
                          className="w-20 px-3 py-1.5 text-center text-text-primary font-bold rounded bg-white shadow-inner disabled:opacity-80"
                        />
                        <span className="text-sm font-bold">TON</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-0 sm:ml-auto">
                      <span className="text-sm font-bold">Estiba Válida:</span>
                      <button 
                         type="button" 
                         disabled={isFormalizado}
                         onClick={() => updateCargaField(carga.id, 'estibaValida', !carga.estibaValida)}
                         className="focus:outline-none"
                      >
                         {carga.estibaValida ? (
                           <CheckCircle2 className="text-secondary w-7 h-7 bg-white rounded-full p-0.5" />
                         ) : (
                           <Circle className="text-white w-7 h-7 fill-white cursor-pointer" />
                         )}
                      </button>
                    </div>

                    <Button 
                      disabled={isFormalizado || !hasAssignedUnit}
                      onClick={() => handleFormalizar(carga.id, carga)}
                      className={cn(
                        "font-bold py-2.5 px-6 rounded shadow-md transition-all",
                        isFormalizado || !hasAssignedUnit
                          ? "bg-white/20 text-white/50 border border-white/10 cursor-not-allowed hover:bg-white/20 hover:text-white/50" 
                          : "bg-[#DBCFB0] text-text-primary hover:bg-[#c9bea1]"
                      )}
                    >
                      Listo para Despacho
                    </Button>
                  </div>

                </div>
              </div>
            </div>
          )
        })}
        
        {!loading && cargas.length === 0 && (
          <div className="text-center py-12 text-black/50">
            No hay cargas pendientes de formalizar.
          </div>
        )}
        
        {loading && (
          <div className="text-center py-12 text-primary font-bold animate-pulse">
            Cargando órdenes del servidor...
          </div>
        )}
      </div>
    </div>
  )
}
