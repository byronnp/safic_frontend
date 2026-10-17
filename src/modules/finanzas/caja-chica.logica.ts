import { z } from 'zod';

import { aCentavos } from '@/utils/dinero';

import { normalizarMonto } from './cuotas.logica';

export const MAX_RESPALDO = 5 * 1024 * 1024;
export const TIPOS_RESPALDO = ['image/jpeg', 'image/png', 'application/pdf'];

export interface FormularioGastoCaja {
  concepto: string;
  comercio: string;
  monto: string;
  fecha: string;
  respaldo: File | null;
}

export type ErroresGastoCaja = Partial<
  Record<'concepto' | 'monto' | 'fecha' | 'respaldo', string | undefined>
>;

export const gastoCajaVacio = (hoy: string): FormularioGastoCaja => ({
  concepto: '',
  comercio: '',
  monto: '',
  fecha: hoy,
  respaldo: null,
});

const esquemaGasto = z.object({
  concepto: z.string().trim().min(3, 'Escribe en qué se gastó.').max(120, 'Máximo 120 letras.'),
  monto: z
    .string()
    .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Escribe un monto válido, con hasta dos decimales.'),
});

/** `disponible` es lo que queda del fondo: un gasto mayor se avisa antes de enviar. */
export function validarGastoCaja(
  f: FormularioGastoCaja,
  hoy: string,
  disponible: string,
): ErroresGastoCaja {
  const errores: ErroresGastoCaja = {};
  const monto = normalizarMonto(f.monto);
  const r = esquemaGasto.safeParse({ concepto: f.concepto, monto });
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0];
      if ((campo === 'concepto' || campo === 'monto') && !errores[campo])
        errores[campo] = p.message;
    }
  }
  if (!errores.monto) {
    if (aCentavos(monto) <= 0) errores.monto = 'El monto debe ser mayor a cero.';
    else if (aCentavos(monto) > aCentavos(disponible))
      errores.monto = 'Supera lo disponible en la caja chica. Pide que se reponga el fondo.';
  }
  if (f.fecha === '') errores.fecha = 'Elige la fecha del gasto.';
  else if (f.fecha > hoy) errores.fecha = 'La fecha no puede ser futura.';
  if (f.respaldo === null) errores.respaldo = 'La foto del respaldo es obligatoria.';
  else if (!TIPOS_RESPALDO.includes(f.respaldo.type))
    errores.respaldo = 'Sube una foto (JPG o PNG) o un PDF.';
  else if (f.respaldo.size > MAX_RESPALDO) errores.respaldo = 'El respaldo pesa más de 5 MB.';
  return errores;
}

export interface FormularioFondo {
  fondo: string;
  responsable: string;
}

export type ErroresFondo = Partial<Record<'fondo' | 'responsable', string | undefined>>;

/** `gastado` es lo ya gastado desde la última reposición: el fondo no puede quedar por debajo. */
export function validarFondo(f: FormularioFondo, gastado: string): ErroresFondo {
  const errores: ErroresFondo = {};
  const fondo = normalizarMonto(f.fondo);
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(fondo)) errores.fondo = 'Escribe un monto válido.';
  else if (aCentavos(fondo) <= 0) errores.fondo = 'El fondo debe ser mayor a cero.';
  else if (aCentavos(fondo) < aCentavos(gastado))
    errores.fondo = 'El fondo no puede ser menor a lo ya gastado.';
  if (f.responsable.trim().length < 3) errores.responsable = 'Escribe quién queda a cargo.';
  return errores;
}

/** Porcentaje del fondo ya gastado (0–100), para la barra. */
export function porcentajeGastado(fondo: string, gastado: string): number {
  const total = aCentavos(fondo);
  if (total <= 0) return 0;
  return Math.min(100, Math.round((aCentavos(gastado) / total) * 100));
}
