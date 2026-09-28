import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea la velocidad de reloj (potenciómetro) de un edificio.
 * 100% = normal, >100% = overclocked, <100% = underclocked.
 */
export function formatClock(speed: number): string {
  return `${speed.toFixed(0)}%`
}

/** Color del texto según la velocidad de reloj. */
export function getClockTextColor(speed: number): string {
  if (speed > 100) return 'text-primary' // overclocked (naranja)
  if (speed < 100) return 'text-blue-400' // underclocked
  return 'text-muted-foreground' // normal 100%
}
