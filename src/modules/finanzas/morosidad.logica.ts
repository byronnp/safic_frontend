import { sumarDias } from '@/utils/fecha';
import { formatoFechaCorta } from '@/utils/formato';

import { textoRelacion } from './cuotas.logica';
import type { FiltroMorosidad, SituacionMora, UnidadMorosa } from './services/morosidad.service';

export const FILTROS_MOROSIDAD: { valor: FiltroMorosidad; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'en_mora', etiqueta: 'En mora' },
  { valor: 'restringidas', etiqueta: 'Restringidas' },
  { valor: 'convenio', etiqueta: 'Con convenio' },
];

type Tono = 'exito' | 'alerta' | 'error' | 'info' | 'neutro';

/** La situación de una unidad, como se lee en la tabla: «Restringido en áreas comunes», «Convenio al día»… */
export function textoSituacion(s: SituacionMora): { texto: string; tono: Tono } {
  switch (s.tipo) {
    case 'restringida':
      return { texto: 'Restringido en áreas comunes', tono: 'error' };
    case 'notificada':
      return {
        texto: `Notificado · restringe el ${formatoFechaCorta(s.restringe_desde)}`,
        tono: 'alerta',
      };
    case 'convenio':
      return {
        texto: s.al_dia ? 'Convenio al día' : 'Convenio atrasado',
        tono: s.al_dia ? 'exito' : 'alerta',
      };
    case 'recordatorio':
      return { texto: `Recordatorio enviado ${formatoFechaCorta(s.fecha)}`, tono: 'info' };
    default:
      return { texto: 'Sin aviso', tono: 'neutro' };
  }
}

/** «4 cuotas · 126 días» o «Convenio 3 de 6». */
export function detalleDeuda(u: UnidadMorosa): string {
  if (u.situacion.tipo === 'convenio') return `Convenio ${u.situacion.cuota} de ${u.situacion.de}`;
  const cuotas = `${u.cuotas_vencidas} ${u.cuotas_vencidas === 1 ? 'cuota' : 'cuotas'}`;
  return `${cuotas} · ${u.dias_atraso} ${u.dias_atraso === 1 ? 'día' : 'días'}`;
}

export function textoResponsable(u: Pick<UnidadMorosa, 'responsable'>): string {
  return u.responsable
    ? `${u.responsable.nombre} · ${textoRelacion(u.responsable.relacion)}`
    : 'Sin responsable';
}

/** «Se avisa 3 días antes, el día y cada 15 días de atraso.» */
export const TEXTO_RECORDATORIOS = '3 días antes, el día y cada 15 días';

export function textoRestriccion(mesesRestriccion: number): string {
  return `Desde ${mesesRestriccion} ${mesesRestriccion === 1 ? 'mes' : 'meses'} de deuda`;
}

/** Resultado de «Recordar»: lo que se envió y a quién no se pudo. */
export function textoRecordatorios(r: {
  enviados: number;
  sin_correo: number;
  ya_avisadas: number;
}): string {
  const partes = [
    `${r.enviados} ${r.enviados === 1 ? 'recordatorio enviado' : 'recordatorios enviados'}`,
  ];
  if (r.sin_correo > 0) partes.push(`${r.sin_correo} sin correo registrado`);
  if (r.ya_avisadas > 0) partes.push(`${r.ya_avisadas} ya avisadas hoy`);
  return `${partes.join(' · ')}.`;
}

// ---------- Convenio ----------

export interface FormularioConvenio {
  cuotas: string;
  primeraCuotaEl: string;
}

export type ErroresConvenio = Partial<Record<'cuotas' | 'primeraCuotaEl', string | undefined>>;

export const convenioVacio = (hoy: string): FormularioConvenio => ({
  cuotas: '3',
  primeraCuotaEl: sumarDias(hoy, 30),
});

export function validarConvenio(f: FormularioConvenio, hoy: string): ErroresConvenio {
  const e: ErroresConvenio = {};
  const n = Number(f.cuotas);
  if (!/^\d+$/.test(f.cuotas.trim()) || n < 2 || n > 36)
    e.cuotas = 'El convenio es de 2 a 36 cuotas.';
  if (f.primeraCuotaEl === '') e.primeraCuotaEl = 'Elige la fecha de la primera cuota.';
  else if (f.primeraCuotaEl < hoy)
    e.primeraCuotaEl = 'La primera cuota no puede ser una fecha pasada.';
  return e;
}

export function validarMotivo(motivo: string): string | undefined {
  const m = motivo.trim();
  if (m === '') return 'Escribe el motivo.';
  return m.length < 3 ? 'El motivo es muy corto.' : undefined;
}
