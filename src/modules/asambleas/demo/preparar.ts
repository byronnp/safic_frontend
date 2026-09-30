// Datos de ejemplo del mockup F5Preparar.dc.html. Se reemplazan por la API cuando exista el endpoint.

import type { TonoEstado } from '@/components/EstadoBadge.vue';

export type TipoPunto = 'inf' | 'vot' | 'ele' | 'ref';

export interface PuntoOrdenDia {
  titulo: string;
  tipo: TipoPunto;
  mayoria: string;
  adjunto: string;
}

export const TIPOS_PUNTO: Record<TipoPunto, { nombre: string; tono: TonoEstado }> = {
  inf: { nombre: 'Informativo', tono: 'neutro' },
  vot: { nombre: 'Votación', tono: 'exito' },
  ele: { nombre: 'Elección', tono: 'info' },
  ref: { nombre: 'Reforma de reglamento', tono: 'alerta' },
};

export const MAYORIAS_PUNTO = ['—', 'Simple · presentes', '[% legal] · total'] as const;

export const TIPOS_ASAMBLEA = ['Ordinaria', 'Extraordinaria'] as const;

export const MODALIDADES_ASAMBLEA = ['Presencial con voto en la app', 'Mixta', 'Virtual'] as const;

export const BORRADOR_ASAMBLEA = {
  titulo: 'Asamblea ordinaria 2026',
  tipo: 'Ordinaria',
  modalidad: 'Presencial con voto en la app',
  fechaHora: 'Sáb 17 oct 2026 · 19:00',
  lugar: 'Salón comunal',
};

export const AVISO_ANTICIPACION =
  'Cumple la anticipación legal: hay que convocar a más tardar el mar 6 oct (8 días hábiles descontando el feriado del 9 de octubre, Art. 37). Segunda convocatoria automática a las 20:00.';

export const PUNTOS_ORDEN_DIA: PuntoOrdenDia[] = [
  { titulo: 'Constatación del quórum', tipo: 'inf', mayoria: '—', adjunto: '' },
  { titulo: 'Informe de la administración 2025–2026', tipo: 'inf', mayoria: '—', adjunto: 'PDF' },
  {
    titulo: 'Aprobación de estados financieros',
    tipo: 'vot',
    mayoria: 'Simple · presentes',
    adjunto: 'PDF',
  },
  {
    titulo: 'Presupuesto 2027 y valor de alícuotas',
    tipo: 'vot',
    mayoria: 'Simple · presentes',
    adjunto: 'PDF',
  },
  { titulo: 'Elección de directiva 2027', tipo: 'ele', mayoria: 'Simple · presentes', adjunto: '' },
  {
    titulo: 'Reforma del reglamento: horario de áreas',
    tipo: 'ref',
    mayoria: '[% legal] · total',
    adjunto: 'PDF',
  },
];

export const PADRON_ASAMBLEA = {
  unidadesConPropietario: 148,
  sumaAlicuotas: '100,00 %',
  enMora: '6 · 4,12 %',
  quorum: '> 50 % alícuotas',
};
