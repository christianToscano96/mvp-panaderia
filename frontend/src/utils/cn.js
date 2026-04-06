import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma segura.
 * Resuelve conflictos entre clases automáticamente.
 *
 * @param {...ClassValue} inputs - Classes, condiciones, arrays
 * @returns {string} Clases combinadas
 *
 * @example
 * // Clases estáticas (no necesita cn)
 * <div className="flex items-center gap-2" />
 *
 * // Con condiciones - USA cn()
 * <div className={cn("btn", isActive && "btn-primary")} />
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}