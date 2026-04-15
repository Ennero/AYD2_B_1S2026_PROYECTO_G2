import { Plug } from "lucide-react"

interface EndpointChipProps {
  endpoint: string
}

export default function EndpointChip({ endpoint }: EndpointChipProps) {
  return (
    <div className="inline-flex items-center gap-2 bg-[#0A3B7C]/5 text-[#0A3B7C] border border-[#0A3B7C]/20 rounded-full px-4 py-2 text-sm font-bold">
      <Plug size={14} />
      <span>{endpoint}</span>
    </div>
  )
}
