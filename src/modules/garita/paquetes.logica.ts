import { z } from 'zod';

import { diaDe, horaDe } from './garita.logica';
import type { MiPaquete, PaqueteEnGarita } from './services/paquetes.service';

export const MAX_FOTO = 5 * 1024 * 1024;
export const TIPOS_FOTO = ['image/jpeg', 'image/png'];

export interface FormularioPaquete {
  unidad: string;
  empresa: string;
  descripcion: string;
  foto: File | null;
}

export type ErroresPaquete = Partial<
  Record<'unidad' | 'empresa' | 'descripcion' | 'foto', string | undefined>
>;

export const paqueteVacio = (): FormularioPaquete => ({
  unidad: '',
  empresa: '',
  descripcion: '',
  foto: null,
});

const esquema = z.object({
  unidad: z.string().trim().min(1, 'Indica la unidad.').max(20, 'Máximo 20 caracteres.'),
  empresa: z
    .string()
    .trim()
    .min(2, 'Escribe la empresa o quién lo envía.')
    .max(80, 'Máximo 80 letras.'),
  descripcion: z.string().trim().max(60, 'Máximo 60 letras.'),
});

export function validarPaquete(f: FormularioPaquete): ErroresPaquete {
  const errores: ErroresPaquete = {};
  const r = esquema.safeParse(f);
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0] as 'unidad' | 'empresa' | 'descripcion';
      if (!errores[campo]) errores[campo] = p.message;
    }
  }
  if (f.foto === null) errores.foto = 'La foto del paquete es obligatoria.';
  else if (!TIPOS_FOTO.includes(f.foto.type)) errores.foto = 'La foto debe ser JPG o PNG.';
  else if (f.foto.size > MAX_FOTO) errores.foto = 'La foto pesa más de 5 MB.';
  return errores;
}

/** «Caja mediana · Hoy 09:20» / «Sobre · Ayer 18:05». */
export function detallePaquete(
  p: Pick<PaqueteEnGarita, 'descripcion' | 'recibido_en'>,
  hoy: string,
): string {
  const cuando = `${diaDe(p.recibido_en, hoy)} ${horaDe(p.recibido_en)}`;
  return p.descripcion ? `${p.descripcion} · ${cuando}` : cuando;
}

/** «hace 8 días» / «hace 1 día» / «hoy». */
export function haceDias(dias: number): string {
  if (dias <= 0) return 'hoy';
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

/** Para el residente: «Servientrega · Caja mediana». */
export function tituloMiPaquete(p: Pick<MiPaquete, 'empresa' | 'descripcion'>): string {
  return p.descripcion ? `${p.empresa} · ${p.descripcion}` : p.empresa;
}

/** Quién retira: exactamente uno de los dos. */
export function validarRetira(
  modo: 'ocupante' | 'autorizado',
  ocupanteId: number | null,
  autorizado: string,
  hayFirma: boolean,
): string | null {
  if (modo === 'ocupante' && ocupanteId === null) return 'Elige quién retira.';
  if (modo === 'autorizado' && autorizado.trim().length < 3)
    return 'Escribe el nombre de quien retira.';
  if (!hayFirma) return 'Falta la firma de quien retira.';
  return null;
}
