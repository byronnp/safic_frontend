import { z } from 'zod';

import { cedulaValida, rucValido } from '@/utils/identificacion';

import type { GuardarPersona, TipoDocumento } from './services/personas.service';
import type { RelacionOcupante } from './services/unidades.service';

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; texto: string }[] = [
  { valor: 'cedula', texto: 'Cédula' },
  { valor: 'ruc', texto: 'RUC' },
  { valor: 'pasaporte', texto: 'Pasaporte' },
];

export const RELACIONES: { valor: RelacionOcupante; texto: string }[] = [
  { valor: 'propietario', texto: 'Propietario' },
  { valor: 'inquilino', texto: 'Inquilino' },
  { valor: 'residente', texto: 'Residente' },
  { valor: 'contacto_emergencia', texto: 'Contacto de emergencia' },
];

export function textoRelacion(relacion: RelacionOcupante): string {
  return RELACIONES.find((r) => r.valor === relacion)?.texto ?? relacion;
}

export interface FormularioPersona {
  tipoDocumento: TipoDocumento;
  documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
}

export type CampoPersona = keyof FormularioPersona;

/** Nombre del campo en la API → campo del formulario (errores 422). */
export const CAMPOS_API_PERSONA: Record<string, CampoPersona> = {
  tipo_documento: 'tipoDocumento',
  documento: 'documento',
  nombres: 'nombres',
  apellidos: 'apellidos',
  telefono: 'telefono',
  email: 'email',
};

export function personaVacia(): FormularioPersona {
  return {
    tipoDocumento: 'cedula',
    documento: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    email: '',
  };
}

const sinSeparadores = (v: string) => v.replace(/[\s.-]/g, '');

const esquema = z
  .object({
    tipoDocumento: z.enum(['cedula', 'ruc', 'pasaporte']),
    documento: z.string().trim().min(1, 'Escribe el número de documento.'),
    nombres: z.string().trim().min(1, 'Escribe los nombres.').max(80, 'Máximo 80 caracteres.'),
    apellidos: z.string().trim().min(1, 'Escribe los apellidos.').max(80, 'Máximo 80 caracteres.'),
    telefono: z
      .string()
      .refine(
        (v) => /^09\d{8}$/.test(sinSeparadores(v)),
        'El celular tiene 10 dígitos y empieza con 09.',
      ),
    email: z
      .string()
      .refine(
        (v) => v.trim() === '' || z.email().safeParse(v.trim()).success,
        'Escribe un correo válido.',
      ),
  })
  .superRefine((f, ctx) => {
    const documento = sinSeparadores(f.documento);
    const valido =
      f.tipoDocumento === 'cedula'
        ? cedulaValida(documento)
        : f.tipoDocumento === 'ruc'
          ? rucValido(documento)
          : /^[A-Za-z0-9]{5,20}$/.test(documento);
    if (documento !== '' && !valido) {
      ctx.addIssue({
        code: 'custom',
        path: ['documento'],
        message: {
          cedula: 'La cédula no es válida.',
          ruc: 'El RUC no es válido.',
          pasaporte: 'El pasaporte tiene de 5 a 20 letras o números.',
        }[f.tipoDocumento],
      });
    }
  });

export type ResultadoPersona =
  | { ok: true; datos: GuardarPersona }
  | { ok: false; errores: Partial<Record<CampoPersona, string>> };

export function validarPersona(f: FormularioPersona): ResultadoPersona {
  const resultado = esquema.safeParse(f);
  if (!resultado.success) {
    const errores: Partial<Record<CampoPersona, string>> = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] as CampoPersona;
      errores[campo] ??= problema.message;
    }
    return { ok: false, errores };
  }
  return {
    ok: true,
    datos: {
      tipo_documento: f.tipoDocumento,
      documento: sinSeparadores(f.documento).toUpperCase(),
      nombres: f.nombres.trim(),
      apellidos: f.apellidos.trim(),
      telefono: sinSeparadores(f.telefono),
      email: f.email.trim() === '' ? null : f.email.trim().toLowerCase(),
    },
  };
}

/** Fecha de hoy (AAAA-MM-DD) en la zona del condominio; hoy siempre Ecuador. */
export function hoyEcuador(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
}
