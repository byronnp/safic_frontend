import { z } from 'zod';

import { aCentavos } from '@/utils/dinero';
import { formatoMoneda } from '@/utils/formato';

import { normalizarMonto } from '../finanzas/cuotas.logica';
import type { AreaComun, ReglasAreaEntrada } from './services/areas.service';

/** Orden de la semana en pantalla: Lun…Dom (1…7 en la API). */
export const DIAS_SEMANA_AREA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export interface FormularioArea {
  abre: string;
  cierra: string;
  duracionMin: string;
  duracionMax: string;
  anticipacionMinHoras: string;
  anticipacionMaxDias: string;
  capacidad: string;
  reservasPorMes: string;
  /** Lun…Dom */
  dias: boolean[];
  costo: string;
  garantia: string;
  reglamento: string;
  requiereAprobacion: boolean;
  restringiblePorMora: boolean;
}

export type ClaveErrorArea =
  | 'abre'
  | 'cierra'
  | 'duracionMin'
  | 'duracionMax'
  | 'anticipacionMinHoras'
  | 'anticipacionMaxDias'
  | 'capacidad'
  | 'reservasPorMes'
  | 'dias'
  | 'costo'
  | 'garantia'
  | 'reglamento';
export type ErroresArea = Partial<Record<ClaveErrorArea, string | undefined>>;

export function formularioDeArea(a: AreaComun): FormularioArea {
  const r = a.reglas;
  return {
    abre: r.abre,
    cierra: r.cierra,
    duracionMin: String(r.duracion_min_horas),
    duracionMax: String(r.duracion_max_horas),
    anticipacionMinHoras: String(r.anticipacion_min_horas),
    anticipacionMaxDias: String(r.anticipacion_max_dias),
    capacidad: r.capacidad === null ? '' : String(r.capacidad),
    reservasPorMes: r.reservas_por_unidad_mes === null ? '' : String(r.reservas_por_unidad_mes),
    dias: DIAS_SEMANA_AREA.map((_, i) => r.dias_semana.includes(i + 1)),
    costo: r.costo,
    garantia: r.garantia,
    reglamento: r.reglamento ?? '',
    requiereAprobacion: a.requiere_aprobacion,
    restringiblePorMora: a.restringible_por_mora,
  };
}

const entero = (min: number, max: number, mensaje: string) =>
  z
    .string()
    .regex(/^\d+$/, mensaje)
    .refine((v) => Number(v) >= min && Number(v) <= max, mensaje);

const esquema = z.object({
  abre: z.string().regex(/^\d{2}:\d{2}$/, 'Indica la hora de apertura.'),
  cierra: z.string().regex(/^\d{2}:\d{2}$/, 'Indica la hora de cierre.'),
  duracionMin: entero(1, 24, 'Entre 1 y 24 horas.'),
  duracionMax: entero(1, 24, 'Entre 1 y 24 horas.'),
  anticipacionMinHoras: entero(0, 720, 'Entre 0 y 720 horas.'),
  anticipacionMaxDias: entero(1, 365, 'Entre 1 y 365 días.'),
  capacidad: z.union([z.literal(''), entero(1, 5000, 'Entre 1 y 5000 personas.')]),
  reservasPorMes: z.union([z.literal(''), entero(1, 60, 'Entre 1 y 60.')]),
  reglamento: z.string().max(2000, 'Máximo 2000 caracteres.'),
});

const MONTO = /^\d{1,8}(\.\d{1,2})?$/;

export function validarArea(f: FormularioArea): ErroresArea {
  const errores: ErroresArea = {};
  const r = esquema.safeParse(f);
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0] as ClaveErrorArea;
      if (!errores[campo]) errores[campo] = p.message;
    }
  }
  if (!errores.abre && !errores.cierra && f.abre >= f.cierra)
    errores.cierra = 'El cierre debe ser posterior a la apertura.';
  if (!errores.duracionMin && !errores.duracionMax && Number(f.duracionMin) > Number(f.duracionMax))
    errores.duracionMax = 'La máxima no puede ser menor a la mínima.';
  if (!f.dias.some(Boolean)) errores.dias = 'Elige al menos un día.';
  for (const campo of ['costo', 'garantia'] as const) {
    if (!MONTO.test(normalizarMonto(f[campo])))
      errores[campo] = 'Escribe un monto válido (0 si no aplica).';
  }
  return errores;
}

export function peticionArea(f: FormularioArea): ReglasAreaEntrada {
  return {
    abre: f.abre,
    cierra: f.cierra,
    duracion_min_horas: Number(f.duracionMin),
    duracion_max_horas: Number(f.duracionMax),
    anticipacion_min_horas: Number(f.anticipacionMinHoras),
    anticipacion_max_dias: Number(f.anticipacionMaxDias),
    capacidad: f.capacidad === '' ? null : Number(f.capacidad),
    reservas_por_unidad_mes: f.reservasPorMes === '' ? null : Number(f.reservasPorMes),
    dias_semana: f.dias.flatMap((activo, i) => (activo ? [i + 1] : [])),
    costo: normalizarMonto(f.costo),
    garantia: normalizarMonto(f.garantia),
    reglamento: f.reglamento.trim() === '' ? null : f.reglamento.trim(),
    requiere_aprobacion: f.requiereAprobacion,
    restringible_por_mora: f.restringiblePorMora,
  };
}

/** «$ 50,00 + $ 100,00 garantía · con aprobación» / «Gratis · máx. 2 h · automática». */
export function resumenArea(a: AreaComun): string {
  const r = a.reglas;
  const partes: string[] = [];
  const conCosto = aCentavos(r.costo) > 0;
  partes.push(conCosto ? formatoMoneda(r.costo) : 'Gratis');
  if (aCentavos(r.garantia) > 0) partes[0] += ` + ${formatoMoneda(r.garantia)} garantía`;
  else if (conCosto) partes.push('sin garantía');
  if (!conCosto) partes.push(`máx. ${r.duracion_max_horas} h`);
  partes.push(a.requiere_aprobacion ? 'con aprobación' : 'automática');
  return partes.join(' · ');
}

/** Cambios sin guardar respecto al estado del área. */
export function hayCambiosArea(a: AreaComun, f: FormularioArea): boolean {
  return JSON.stringify(formularioDeArea(a)) !== JSON.stringify(f);
}
