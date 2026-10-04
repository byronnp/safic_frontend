import { z } from 'zod';

import type {
  Especie,
  GuardarMascota,
  GuardarVehiculo,
  TipoVehiculo,
} from './services/unidades.service';

export const TIPOS_VEHICULO: { valor: TipoVehiculo; texto: string }[] = [
  { valor: 'auto', texto: 'Auto' },
  { valor: 'moto', texto: 'Moto' },
];

export const ESPECIES: { valor: Especie; texto: string }[] = [
  { valor: 'perro', texto: 'Perro' },
  { valor: 'gato', texto: 'Gato' },
  { valor: 'ave', texto: 'Ave' },
  { valor: 'otro', texto: 'Otro' },
];

export function textoEspecie(especie: Especie): string {
  return ESPECIES.find((e) => e.valor === especie)?.texto ?? especie;
}

/**
 * Placa ecuatoriana (misma regla que PlacaEc del backend): autos PBA-1234 o ABC-123 y
 * motos IA-123B, con o sin guion. Devuelve el formato oficial o null.
 */
export function normalizarPlaca(texto: string): string | null {
  const limpia = texto.replace(/[\s-]/g, '').toUpperCase();
  const auto = /^([A-Z]{3})(\d{3,4})$/.exec(limpia);
  if (auto) return `${auto[1]}-${auto[2]}`;
  const moto = /^([A-Z]{2})(\d{3}[A-Z])$/.exec(limpia);
  if (moto) return `${moto[1]}-${moto[2]}`;
  return null;
}

/** "Kia Rio · Gris" con lo que haya. */
export function descripcionVehiculo(v: {
  marca: string | null;
  modelo: string | null;
  color: string | null;
  tipo: TipoVehiculo;
}): string {
  const texto = [[v.marca, v.modelo].filter(Boolean).join(' '), v.color]
    .filter(Boolean)
    .join(' · ');
  return texto || (v.tipo === 'moto' ? 'Moto' : 'Auto');
}

const opcional = (max: number, mensaje: string) => z.string().trim().max(max, mensaje);
const vacioANull = (v: string) => (v.trim() === '' ? null : v.trim());

export interface FormularioVehiculo {
  placa: string;
  tipo: TipoVehiculo;
  marca: string;
  modelo: string;
  color: string;
}

const esquemaVehiculo = z.object({
  placa: z
    .string()
    .refine(
      (v) => normalizarPlaca(v) !== null,
      'La placa no es válida (ej. PBA-1234 o una moto IA-123B).',
    ),
  tipo: z.enum(['auto', 'moto']),
  marca: opcional(40, 'Máximo 40 caracteres.'),
  modelo: opcional(40, 'Máximo 40 caracteres.'),
  color: opcional(30, 'Máximo 30 caracteres.'),
});

export type Resultado<T, C extends string> =
  { ok: true; datos: T } | { ok: false; errores: Partial<Record<C, string>> };

function errores<C extends string>(issues: z.core.$ZodIssue[]): Partial<Record<C, string>> {
  const salida: Partial<Record<C, string>> = {};
  for (const problema of issues) {
    const campo = problema.path[0] as C;
    salida[campo] ??= problema.message;
  }
  return salida;
}

export function validarVehiculo(
  f: FormularioVehiculo,
): Resultado<GuardarVehiculo, keyof FormularioVehiculo> {
  const r = esquemaVehiculo.safeParse(f);
  if (!r.success) return { ok: false, errores: errores(r.error.issues) };
  return {
    ok: true,
    datos: {
      placa: normalizarPlaca(f.placa)!,
      tipo: f.tipo,
      marca: vacioANull(f.marca),
      modelo: vacioANull(f.modelo),
      color: vacioANull(f.color),
    },
  };
}

export interface FormularioMascota {
  nombre: string;
  especie: Especie;
  raza: string;
}

const esquemaMascota = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de la mascota.')
    .max(40, 'Máximo 40 caracteres.'),
  especie: z.enum(['perro', 'gato', 'ave', 'otro']),
  raza: opcional(40, 'Máximo 40 caracteres.'),
});

export function validarMascota(
  f: FormularioMascota,
): Resultado<GuardarMascota, keyof FormularioMascota> {
  const r = esquemaMascota.safeParse(f);
  if (!r.success) return { ok: false, errores: errores(r.error.issues) };
  return {
    ok: true,
    datos: { nombre: f.nombre.trim(), especie: f.especie, raza: vacioANull(f.raza) },
  };
}
