import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza una fecha a formato 'yyyy-MM-dd'
 * Acepta Date, string (ISO o 'yyyy-MM-dd'), o cualquier formato válido
 */
export function normalizeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Si ya está en formato 'yyyy-MM-dd', devolverlo directamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
        return date.trim();
      }
      // Intentar parsear como ISO
      dateObj = parseISO(date);
    } else {
      return '';
    }
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
}
