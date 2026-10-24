import { z } from 'zod';

import type { TonoEstado } from '@/components/EstadoBadge.vue';
import { cedulaValida } from '@/utils/identificacion';

import type {
  CargarPoder,
  EstadoPoder,
  PoderAsamblea,
  TipoPoder,
} from './services/asambleas.service';

export const TIPOS_PODER: { valor: TipoPoder; etiqueta: string }[] = [
  { valor: 'carta', etiqueta: 'Carta firmada' },
  { valor: 'notarial', etiqueta: 'Poder notarial' },
];

export const ESTADOS_PODER: Record<EstadoPoder, { nombre: string; tono: TonoEstado }> = {
  pendiente: { nombre: 'Por validar', tono: 'alerta' },
  validado: { nombre: 'Validado', tono: 'exito' },
  rechazado: { nombre: 'Rechazado', tono: 'error' },
  revocado: { nombre: 'Retirado', tono: 'neutro' },
};

export const nombreTipoPoder = (t: TipoPoder): string =>
  TIPOS_PODER.find((x) => x.valor === t)?.etiqueta ?? t;

/** 10 MB, como el servidor. */
export const MAXIMO_PDF = 10 * 1024 * 1024;

export interface FormularioPoder {
  unidadId: number | null;
  tipo: TipoPoder;
  nombre: string;
  tipoDocumento: 'cedula' | 'pasaporte';
  documento: string;
  archivo: File | null;
}

export type ErroresPoder = Partial<
  Record<'unidadId' | 'nombre' | 'documento' | 'archivo', string | undefined>
>;

export const poderVacio = (unidadId: number | null = null): FormularioPoder => ({
  unidadId,
  tipo: 'carta',
  nombre: '',
  tipoDocumento: 'cedula',
  documento: '',
  archivo: null,
});

const esquema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'Escribe el nombre del representante.')
    .max(120, 'Máximo 120 letras.'),
});

export function validarPoder(f: FormularioPoder): ErroresPoder {
  const errores: ErroresPoder = {};
  if (f.unidadId === null) errores.unidadId = 'Elige la unidad.';
  const r = esquema.safeParse(f);
  if (!r.success) errores.nombre = r.error.issues[0]?.message;

  const documento = f.documento.trim();
  if (f.tipoDocumento === 'cedula') {
    if (!cedulaValida(documento)) errores.documento = 'La cédula no es válida (10 dígitos).';
  } else if (documento.length < 5 || documento.length > 20) {
    errores.documento = 'El pasaporte debe tener entre 5 y 20 caracteres.';
  }

  if (f.archivo === null) errores.archivo = 'Sube el poder o la carta en PDF.';
  else if (f.archivo.type !== 'application/pdf' && !f.archivo.name.toLowerCase().endsWith('.pdf'))
    errores.archivo = 'Debe ser un PDF.';
  else if (f.archivo.size > MAXIMO_PDF) errores.archivo = 'El PDF pesa más de 10 MB.';
  return errores;
}

/** Lo que se envía a la API (ya validado). */
export function aSolicitudPoder(f: FormularioPoder): CargarPoder {
  return {
    unidad_id: f.unidadId as number,
    tipo: f.tipo,
    representante_nombre: f.nombre.trim(),
    representante_tipo_documento: f.tipoDocumento,
    representante_documento: f.documento.trim(),
    archivo: f.archivo as File,
  };
}

/** Qué le dice la administración al propietario según el estado de su poder. */
export function mensajeDePoder(p: { estado: EstadoPoder; motivo_rechazo: string | null }): string {
  if (p.estado === 'pendiente') return 'La administración lo está revisando.';
  if (p.estado === 'rechazado') return `Rechazado: ${p.motivo_rechazo ?? 'sin motivo'}. Sube otro.`;
  if (p.estado === 'validado') return 'Validado: tu representante vota por tu unidad.';
  return 'Retirado.';
}

/** ¿Se puede retirar o resolver? Solo los vigentes. */
export const poderVigente = (p: Pick<PoderAsamblea, 'estado'>): boolean =>
  p.estado === 'pendiente' || p.estado === 'validado';
