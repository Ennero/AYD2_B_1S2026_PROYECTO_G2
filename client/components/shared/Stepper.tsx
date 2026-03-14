import { cn } from "@/lib/utils/cn"

const defaultSteps = ["Cuenta", "Dirección", "Confirmación"]

type StepperProps = {
  current: number
  steps?: string[]
  className?: string
}

export default function Stepper({ current, steps = defaultSteps, className }: StepperProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            aria-current={index === current ? "step" : undefined}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full border text-sm font-medium",
              index <= current
                ? "bg-primary text-white border-primary"
                : "bg-white text-text-muted border-black/20"
            )}
          >
            {index + 1}
          </div>

          {index < steps.length - 1 && (
            <div className="w-16 h-1 bg-black/10"></div>
          )}
        </div>
      ))}
    </div>
  )
}
