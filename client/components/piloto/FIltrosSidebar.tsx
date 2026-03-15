// ============================================================
// components/piloto/FiltrosSidebar.tsx
// Panel lateral de filtros de búsqueda del Dashboard Piloto.
// Campos: rango de fechas, cliente, origen, destino,
//         tipo de mercancía, ordenar por peso.
// ============================================================

import { useState } from "react";
import { FiltrosViaje, OrderStatus } from "@/types/pilot";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { on } from "events";

interface FiltrosSidebarProps {
    filtros: FiltrosViaje
    onChange: (filtros: FiltrosViaje) => void
}

const TIPOS_MERCANCIA = ["General", "Peligrosa", "Refrigerado", "Construcción"]

export default function FiltrosSidebar({ filtros, onChange}: FiltrosSidebarProps) {
    // Estado local del formulario (se aplica solo al hacer click en FILTRAR)
    const [local, setLocal] = useState<FiltrosViaje>(filtros)

    function handleChange(key: keyof FiltrosViaje, value: string) {
        setLocal(prev => ({ ...prev, [key]: value || undefined }))
    }

    function handleAplicar() {
        onChange(local)
    }

    function handleLimpiar() {
        const vacio: FiltrosViaje = {}
        setLocal(vacio)
        onChange(vacio)
    }

    const tieneFiltros = Object.values(local).some(Boolean)

    return (
        <div className="bg-secondary/70 p-6 rounded-xl shadow-md">
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-subheading text-2xl font-bold text-primary">
                Buscar
                </h3>
                {tieneFiltros && (
                <button
                    onClick={handleLimpiar}
                    className="text-text-muted hover:text-error flex items-center gap-1 text-xs font-bold transition-colors"
                >
                    <X size={14} /> Limpiar
                </button>
                )}
            </div>

            {/* Rango de fechas */}
            <div className="flex gap-2">
                <div className="w-1/2">
                    <label className="block text-xs font-bold text-primary mb-1">
                    Fecha Inicio
                    </label>
                    <input
                    type="date"
                    value={local.startDate ?? ""}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className={inputCls}
                    />
                </div>
                <div className="w-1/2">
                    <label className="block text-xs font-bold text-primary mb-1">
                    Fecha Fin
                    </label>
                    <input
                    type="date"
                    value={local.endDate ?? ""}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className={inputCls}
                    />
                </div>
            </div>

            {/* Cliente */}
            <div>
                <label className="block text-xs font-bold text-primary mb-1">
                    Cliente
                </label>
                <input
                    type="text"
                    placeholder="Ej. Cementos Progreso"
                    value={local.clientName ?? ""}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    className={inputCls}
                />
            </div>

            {/* Origen */}
            <div>
                <label className="block text-xs font-bold text-primary mb-1">
                    Origen
                </label>
                <input
                    type="text"
                    placeholder="Ej. Guatemala"
                    value={local.origin ?? ""}
                    onChange={(e) => handleChange("origin", e.target.value)}
                    className={inputCls}
                />
            </div>

            {/* Destino */}
            <div>
                <label className="block text-xs font-bold text-primary mb-1">
                    Destino
                </label>
                <input
                    type="text"
                    placeholder="Ej. Puerto Barrios"
                    value={local.destination ?? ""}
                    onChange={(e) => handleChange("destination", e.target.value)}
                    className={inputCls}
                />
            </div>

            {/* Tipo de mercancía */}
            <div>
                <label className="block text-xs font-bold text-primary mb-1">
                    Tipo de Mercancía
                </label>
                <select
                    value={local.cargoType ?? ""}
                    onChange={(e) => handleChange("cargoType", e.target.value)}
                    className={cn(inputCls, "text-gray-600")}
                >
                    <option value="">Seleccione...</option>
                    {TIPOS_MERCANCIA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                        {tipo}
                    </option>
                    ))}
                </select>
            </div>

            {/* Ordenar por peso */}
            <div className="pt-2 space-y-2">
                <p className="text-xs font-bold text-primary">Ordenar por peso</p>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-primary">
                    <input
                    type="radio"
                    name="sortByWeight"
                    value="ASC"
                    checked={local.sortByWeight === "ASC"}
                    onChange={() => handleChange("sortByWeight", "ASC")}
                    className="accent-primary"
                    />
                    Menor a Mayor
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-primary">
                    <input
                    type="radio"
                    name="sortByWeight"
                    value="DESC"
                    checked={local.sortByWeight === "DESC"}
                    onChange={() => handleChange("sortByWeight", "DESC")}
                    className="accent-primary"
                    />
                    Mayor a Menor
                </label>
                {/* Botón Filtrar */}
                <button
                    onClick={handleAplicar}
                    className="w-full bg-surface hover:bg-[#d4bca9] text-primary font-black py-3 rounded shadow-md mt-4 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                    <Search size={16} />
                    FILTRAR
                </button>
            </div>
        </div>
    )
}

// Clase base reutilizable para los inputs
const inputCls ="w-full p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"