"use client"

import { useEffect, useState } from "react"
import { Save, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import EndpointChip from "@/components/finance/EndpointChip"
import FinancePageShell from "@/components/finance/FinancePageShell"
import { listRates, updateRate } from "@/lib/mocks/financeStore"
import type { FinanceRate } from "@/types/finance"

function formatRange(rate: FinanceRate): string {
  if (rate.maxCapacityTon === null) {
    return `${rate.minCapacityTon}+ Ton`
  }
  return `${rate.minCapacityTon} - ${rate.maxCapacityTon} Ton`
}

export default function FinanceRatesPage() {
  const [rates, setRates] = useState<FinanceRate[]>([])
  const [editedRates, setEditedRates] = useState<Record<number, string>>({})
  const [savingRateId, setSavingRateId] = useState<number | null>(null)

  useEffect(() => {
    const currentRates = listRates()
    setRates(currentRates)

    const defaults = currentRates.reduce<Record<number, string>>((acc, rate) => {
      acc[rate.vehicleTypeId] = rate.ratePerKm.toFixed(2)
      return acc
    }, {})
    setEditedRates(defaults)
  }, [])

  const refreshRates = () => {
    const currentRates = listRates()
    setRates(currentRates)
    setEditedRates(
      currentRates.reduce<Record<number, string>>((acc, rate) => {
        acc[rate.vehicleTypeId] = rate.ratePerKm.toFixed(2)
        return acc
      }, {}),
    )
  }

  const handleSaveRate = async (vehicleTypeId: number) => {
    const rawValue = editedRates[vehicleTypeId]
    const parsed = Number(rawValue)

    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("La tarifa debe ser mayor a 0")
      return
    }

    setSavingRateId(vehicleTypeId)
    try {
      const updated = updateRate(vehicleTypeId, parsed)
      toast.success(`Tarifa ${updated.typeName} actualizada a Q ${updated.ratePerKm.toFixed(2)}`)
      refreshRates()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible actualizar la tarifa"
      toast.error(message)
    } finally {
      setSavingRateId(null)
    }
  }

  return (
    <FinancePageShell
      title="Configuracion Tarifario Base"
      subtitle="Tarifas base por tipo de unidad para contratos y ordenes futuras"
      rightSlot={<EndpointChip endpoint="GET /api/finance/rates" />}
    >
      <div className="space-y-5">
        {rates.map((rate) => (
          <Card key={rate.vehicleTypeId} className="rounded-3xl bg-white/95 border-black/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.15em] text-[#64748B] font-semibold">{rate.typeCode}</p>
                <h2 className="text-2xl font-bold text-[#0A3B7C]">{rate.typeName}</h2>
                <p className="text-sm text-[#64748B]">Rango de capacidad: {formatRange(rate)}</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 md:items-end lg:min-w-[420px]">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-[#0A3B7C] mb-2">Tarifa por KM (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedRates[rate.vehicleTypeId] ?? ""}
                    onChange={(event) =>
                      setEditedRates((current) => ({
                        ...current,
                        [rate.vehicleTypeId]: event.target.value,
                      }))
                    }
                    className="w-full border border-[#0A3B7C]/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-[#0A3B7C]/10 bg-white"
                  />
                </div>

                <Button
                  onClick={() => void handleSaveRate(rate.vehicleTypeId)}
                  loading={savingRateId === rate.vehicleTypeId}
                  className="md:min-w-[170px]"
                >
                  <Save size={16} /> Guardar tarifa
                </Button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-black/5 flex items-center justify-between gap-4 flex-wrap">
              <EndpointChip endpoint={`PATCH /api/finance/rates/${rate.vehicleTypeId}`} />
              <p className="text-xs text-[#64748B]">Los cambios aplican solo para documentos futuros.</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Button variant="outline" onClick={refreshRates}>
          <RotateCcw size={16} /> Refrescar tarifario
        </Button>
      </div>
    </FinancePageShell>
  )
}
