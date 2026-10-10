import { z } from 'zod';

import type {
  CambiosCuentaBancaria,
  CuentaBancaria,
  NuevaCuentaBancaria,
  TipoCuenta,
} from './services/cuentas-bancarias.service';

export const TIPOS_CUENTA: { valor: TipoCuenta; etiqueta: string }[] = [
  { valor: 'corriente', etiqueta: 'Corriente' },
  { valor: 'ahorros', etiqueta: 'Ahorros' },
];

export interface FormularioCuenta {
  banco: string;
  tipo: TipoCuenta;
  numero: string;
  titular: string;
  esPrincipal: boolean;
}

export const FORMULARIO_CUENTA_VACIO: FormularioCuenta = {
  banco: '',
  tipo: 'corriente',
  numero: '',
  titular: '',
  esPrincipal: false,
};

export function formularioDesde(cuenta: CuentaBancaria): FormularioCuenta {
  return {
    banco: cuenta.banco,
    tipo: cuenta.tipo,
    numero: cuenta.numero,
    titular: cuenta.titular,
    esPrincipal: cuenta.es_principal,
  };
}

const esquema = z.object({
  banco: z
    .string()
    .trim()
    .min(2, 'El banco tiene mínimo 2 caracteres.')
    .max(60, 'El banco tiene máximo 60 caracteres.'),
  numero: z
    .string()
    .trim()
    .regex(
      /^[0-9A-Za-z-]{5,30}$/,
      'El número de cuenta lleva de 5 a 30 letras, números o guiones.',
    ),
  titular: z
    .string()
    .trim()
    .min(3, 'El titular tiene mínimo 3 caracteres.')
    .max(120, 'El titular tiene máximo 120 caracteres.'),
});

export interface ErroresCuenta {
  banco?: string | undefined;
  numero?: string | undefined;
  titular?: string | undefined;
}

export function validarCuenta(f: FormularioCuenta): ErroresCuenta {
  const errores: ErroresCuenta = {};
  const r = esquema.safeParse(f);
  if (!r.success) {
    for (const problema of r.error.issues) {
      const campo = problema.path[0];
      if ((campo === 'banco' || campo === 'numero' || campo === 'titular') && !errores[campo]) {
        errores[campo] = problema.message;
      }
    }
  }
  return errores;
}

export function peticionNueva(f: FormularioCuenta): NuevaCuentaBancaria {
  return {
    banco: f.banco.trim(),
    tipo: f.tipo,
    numero: f.numero.trim(),
    titular: f.titular.trim(),
    ...(f.esPrincipal ? { es_principal: true } : {}),
  };
}

/** Solo lo que cambió respecto a la cuenta guardada. `{}` si no cambió nada. */
export function cambiosDe(cuenta: CuentaBancaria, f: FormularioCuenta): CambiosCuentaBancaria {
  const c: CambiosCuentaBancaria = {};
  if (f.banco.trim() !== cuenta.banco) c.banco = f.banco.trim();
  if (f.tipo !== cuenta.tipo) c.tipo = f.tipo;
  if (f.numero.trim() !== cuenta.numero) c.numero = f.numero.trim();
  if (f.titular.trim() !== cuenta.titular) c.titular = f.titular.trim();
  // Solo se puede marcar como principal; quitarla se hace marcando otra
  if (f.esPrincipal && !cuenta.es_principal) c.es_principal = true;
  return c;
}

/** "2100123456" → "•••• 3456" (la lista no muestra el número completo). */
export function numeroEnmascarado(numero: string): string {
  return `•••• ${numero.slice(-4)}`;
}
