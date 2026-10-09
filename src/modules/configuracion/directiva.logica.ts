import type { TonoEstado } from '@/components/EstadoBadge.vue';
import { formatoFecha } from '@/utils/formato';

import type {
  AsignarCargo,
  CandidatoDirectiva,
  CargoClave,
  CargoDirectiva,
  EstadoCargo,
} from './services/directiva.service';

export const ESTADOS_CARGO: Record<EstadoCargo, { texto: string; tono: TonoEstado }> = {
  vigente: { texto: 'Vigente', tono: 'exito' },
  prorrogado: { texto: 'Prorrogado', tono: 'alerta' },
  vacante: { texto: 'Vacante', tono: 'neutro' },
};

const ETIQUETAS_CARGO: Record<CargoClave, string> = {
  presidente: 'presidente',
  vicepresidente: 'vicepresidente',
  secretario: 'secretario',
  tesorero: 'tesorero',
};

/** "Ya es presidente", "Sin correo" o "Disponible" (junto al nombre del candidato). */
export function motivoCandidato(c: CandidatoDirectiva): { texto: string; tono: TonoEstado } {
  if (c.motivo === 'ocupa_cargo') {
    return {
      texto: `Ya es ${c.cargo_actual ? ETIQUETAS_CARGO[c.cargo_actual] : 'parte de la directiva'}`,
      tono: 'error',
    };
  }
  if (c.motivo === 'sin_correo') {
    return { texto: 'Sin correo', tono: 'error' };
  }
  return { texto: 'Disponible', tono: 'exito' };
}

/** "15 mar 2026 – 15 mar 2027" */
export function textoPeriodo(cargo: CargoDirectiva): string {
  return cargo.periodo_inicio && cargo.periodo_fin
    ? `${formatoFecha(cargo.periodo_inicio)} – ${formatoFecha(cargo.periodo_fin)}`
    : '—';
}

export function inicialesPersona(nombre: string): string {
  return nombre
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2);
}

/** Un año adelante: el periodo habitual (el mockup propone «26 sep 2027»). */
export function periodoPorOmision(hoy: string): string {
  const [anio, mes, dia] = hoy.split('-') as [string, string, string];
  return `${Number(anio) + 1}-${mes}-${dia}`;
}

export interface FormularioCargo {
  personaId: number | null;
  acta: string;
  hasta: string;
}

/** Errores por campo (vacío = se puede confirmar). `limite` es hoy + 4 años. */
export function validarCargo(
  f: FormularioCargo,
  hoy: string,
): Partial<Record<keyof FormularioCargo, string>> {
  const errores: Partial<Record<keyof FormularioCargo, string>> = {};
  if (f.personaId === null) {
    errores.personaId = 'Elige a la persona.';
  }
  if (f.acta.trim() === '') {
    errores.acta = 'Escribe el acta que respalda el nombramiento.';
  } else if (f.acta.trim().length > 80) {
    errores.acta = 'El acta tiene máximo 80 caracteres.';
  }
  const [anio, mes, dia] = hoy.split('-') as [string, string, string];
  const limite = `${Number(anio) + 4}-${mes}-${dia}`;
  if (f.hasta === '') {
    errores.hasta = 'Elige hasta cuándo dura el periodo.';
  } else if (f.hasta <= hoy) {
    errores.hasta = 'El periodo debe terminar después de hoy.';
  } else if (f.hasta > limite) {
    errores.hasta = 'El periodo puede durar hasta 4 años.';
  }
  return errores;
}

export function peticionCargo(f: FormularioCargo): AsignarCargo {
  return { persona_id: f.personaId!, acta: f.acta.trim(), periodo_hasta: f.hasta };
}

export const CAMPOS_API_CARGO: Record<string, keyof FormularioCargo> = {
  persona_id: 'personaId',
  acta: 'acta',
  periodo_hasta: 'hasta',
};

/** Mensaje de confirmación tras nombrar (o cambiar) a alguien. */
export function mensajeNombramiento(cargo: CargoDirectiva, anterior: string | null): string {
  const base = `${cargo.etiqueta}: ${cargo.titular?.nombre ?? ''} desde hoy.`;
  return anterior
    ? `${base} El periodo de ${anterior} se cerró y conserva sus demás perfiles, como residente.`
    : base;
}
