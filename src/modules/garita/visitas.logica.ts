import { z } from 'zod';

import { fechaCorta } from '@/modules/reservas/reservas.logica';
import { sumarDias } from '@/utils/fecha';

import type {
  NuevaVisita,
  TipoVisita,
  VisitaAutorizada,
  VisitaPublica,
} from './services/visitas.service';

/** Lunes … domingo (1…7 en la API). */
export const DIAS_VISITA = [
  { id: 1, letra: 'L', nombre: 'Lunes', corto: 'lun' },
  { id: 2, letra: 'M', nombre: 'Martes', corto: 'mar' },
  { id: 3, letra: 'M', nombre: 'Miércoles', corto: 'mié' },
  { id: 4, letra: 'J', nombre: 'Jueves', corto: 'jue' },
  { id: 5, letra: 'V', nombre: 'Viernes', corto: 'vie' },
  { id: 6, letra: 'S', nombre: 'Sábado', corto: 'sáb' },
  { id: 7, letra: 'D', nombre: 'Domingo', corto: 'dom' },
] as const;

export interface FormularioVisita {
  tipo: TipoVisita;
  unidadId: number | null;
  nombre: string;
  cedula: string;
  placa: string;
  fecha: string;
  desde: string;
  hasta: string;
  /** Recurrente: último día de vigencia */
  vigenteHasta: string;
  dias: number[];
}

export type ErroresVisita = Partial<
  Record<
    | 'unidadId'
    | 'nombre'
    | 'cedula'
    | 'placa'
    | 'fecha'
    | 'desde'
    | 'hasta'
    | 'vigenteHasta'
    | 'dias',
    string | undefined
  >
>;

export function visitaVacia(hoy: string): FormularioVisita {
  return {
    tipo: 'unica',
    unidadId: null,
    nombre: '',
    cedula: '',
    placa: '',
    fecha: hoy,
    desde: '15:00',
    hasta: '20:00',
    vigenteHasta: sumarDias(hoy, 90),
    dias: [1, 2, 3, 4, 5],
  };
}

const esquema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'Escribe el nombre del visitante.')
    .max(120, 'Máximo 120 letras.'),
  cedula: z.union([
    z.literal(''),
    z.string().regex(/^[A-Za-z0-9]{5,20}$/, 'La cédula o el documento no es válido.'),
  ]),
  placa: z.union([
    z.literal(''),
    z.string().regex(/^[A-Za-z]{2,3}-?\d{3,4}$/, 'La placa no es válida (ej. PDQ-3321).'),
  ]),
});

export function validarVisita(f: FormularioVisita, hoy: string, ahora: string): ErroresVisita {
  const errores: ErroresVisita = {};
  const r = esquema.safeParse({ nombre: f.nombre, cedula: f.cedula.trim(), placa: f.placa.trim() });
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0] as 'nombre' | 'cedula' | 'placa';
      if (!errores[campo]) errores[campo] = p.message;
    }
  }
  if (f.unidadId === null) errores.unidadId = 'Elige la unidad.';
  if (f.fecha === '') errores.fecha = 'Elige la fecha.';
  else if (f.fecha < hoy) errores.fecha = 'La fecha no puede ser anterior a hoy.';
  if (f.desde === '') errores.desde = 'Indica la hora de inicio.';
  if (f.hasta === '') errores.hasta = 'Indica la hora final.';
  if (!errores.desde && !errores.hasta && f.desde >= f.hasta) {
    errores.hasta = 'La hora final debe ser posterior a la inicial.';
  }
  if (
    f.tipo === 'unica' &&
    !errores.fecha &&
    !errores.hasta &&
    f.fecha === hoy &&
    f.hasta <= ahora
  ) {
    errores.hasta = 'Ese horario de hoy ya pasó.';
  }
  if (f.tipo === 'recurrente') {
    if (f.dias.length === 0) errores.dias = 'Elige al menos un día.';
    if (f.vigenteHasta === '') errores.vigenteHasta = 'Indica hasta cuándo vale.';
    else if (f.vigenteHasta < f.fecha)
      errores.vigenteHasta = 'Debe ser posterior a la fecha de inicio.';
    else if (f.vigenteHasta > sumarDias(hoy, 365))
      errores.vigenteHasta = 'Puede durar hasta un año.';
  }
  return errores;
}

export function peticionVisita(f: FormularioVisita): NuevaVisita {
  const recurrente = f.tipo === 'recurrente';
  return {
    unidad_id: f.unidadId as number,
    visitante: f.nombre.trim(),
    documento: f.cedula.trim() === '' ? null : f.cedula.trim(),
    placa: f.placa.trim() === '' ? null : f.placa.trim().toUpperCase(),
    tipo: f.tipo,
    fecha_desde: f.fecha,
    fecha_hasta: recurrente ? f.vigenteHasta : null,
    hora_desde: f.desde,
    hora_hasta: f.hasta,
    dias_semana: recurrente ? [...f.dias].sort((a, b) => a - b) : null,
  };
}

/** «Lun a vie» / «Lun, mié y vie» / «Todos los días». */
export function textoDias(dias: number[] | null): string {
  const ids = [...(dias ?? [])].sort((a, b) => a - b);
  if (ids.length === 7) return 'Todos los días';
  const nombres = ids.map((i) => DIAS_VISITA[i - 1]?.corto ?? '');
  const seguidos = ids.length >= 3 && ids.every((d, i) => i === 0 || d === (ids[i - 1] ?? 0) + 1);
  const texto = seguidos
    ? `${nombres[0]} a ${nombres[nombres.length - 1]}`
    : nombres.length > 1
      ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
      : (nombres[0] ?? '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

type Vigencia = Pick<
  VisitaAutorizada,
  'tipo' | 'fecha_desde' | 'fecha_hasta' | 'hora_desde' | 'hora_hasta' | 'dias_semana'
>;

/** «Hoy · 18:00 – 22:00» / «Sáb 17 oct · 18:00 – 22:00» / «Lun, mié y vie · 07:00 – 16:00». */
export function cuandoVisita(v: Vigencia, hoy: string): string {
  const horas = `${v.hora_desde} – ${v.hora_hasta}`;
  if (v.tipo === 'recurrente') return `${textoDias(v.dias_semana)} · ${horas}`;
  return `${v.fecha_desde === hoy ? 'Hoy' : fechaCorta(v.fecha_desde)} · ${horas}`;
}

/** «Hoy 26 sep · 15:00–20:00 · un solo ingreso» / «Lun a vie · 08:00–17:00 · hasta 31 dic 2026». */
export function vigenciaVisita(v: Vigencia): string {
  const horas = `${v.hora_desde}–${v.hora_hasta}`;
  if (v.tipo === 'unica') return `${fechaCorta(v.fecha_desde)} · ${horas} · un solo ingreso`;
  const fin = fechaCorta(v.fecha_hasta).split(' ').slice(1).join(' ');
  return `${textoDias(v.dias_semana)} · ${horas} · hasta el ${fin}`;
}

/** El enlace público del QR que se comparte con el visitante. */
export const urlPublicaVisita = (token: string, origen: string): string =>
  `${origen}/visita/${encodeURIComponent(token)}`;

export const primerNombre = (nombre: string): string => nombre.trim().split(/\s+/)[0] ?? '';

/** El mensaje que le llega al visitante (por WhatsApp). */
export function mensajeParaVisitante(
  v: Pick<VisitaAutorizada, 'visitante' | 'unidad' | 'token'>,
  condominio: string,
  origen: string,
): string {
  return `Hola ${primerNombre(v.visitante)}, te espero en ${condominio}, ${v.unidad}. Muestra este QR en la garita.\n${urlPublicaVisita(v.token, origen)}`;
}

/** «Cómo llegar»: Google Maps y Waze, por coordenadas o, si faltan, por la dirección. */
export function enlacesComoLlegar(
  c: VisitaPublica['condominio'],
): { maps: string; waze: string } | null {
  if (c.latitud !== null && c.longitud !== null) {
    const lat = encodeURIComponent(c.latitud);
    const lng = encodeURIComponent(c.longitud);
    return {
      maps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    };
  }
  if (c.direccion) {
    const q = encodeURIComponent(`${c.nombre}, ${c.direccion}`);
    return {
      maps: `https://www.google.com/maps/search/?api=1&query=${q}`,
      waze: `https://waze.com/ul?q=${q}&navigate=yes`,
    };
  }
  return null;
}
