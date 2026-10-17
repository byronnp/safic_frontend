import { formatoMoneda } from '@/utils/formato';
import { aCentavos } from '@/utils/dinero';
import { sumarDias } from '@/utils/fecha';

import type { AreaAgenda, Agenda, Solicitud } from './services/agenda.service';
import { diaDeTira, fechaCorta } from './reservas.logica';

export type TipoItemAgenda = 'ok' | 'pend' | 'blk';

export interface ItemAgenda {
  clave: string;
  tipo: TipoItemAgenda;
  /** «12:00–16:00» o «Todo el día» */
  hora: string;
  texto: string;
  /** id de la reserva o del bloqueo */
  id: number;
}

/** El lunes de la semana de una fecha `YYYY-MM-DD`. */
export function lunesDe(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const desdeLunes = (d.getUTCDay() + 6) % 7;
  return sumarDias(fecha, -desdeLunes);
}

/** Los siete días de la semana que empieza en `desde`, para el encabezado de la grilla. */
export function diasDeSemana(desde: string): { fecha: string; dow: string; num: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(desde, i);
    const { semana, numero } = diaDeTira(fecha);
    return { fecha, dow: semana, num: numero };
  });
}

/** «Semana del 28 sep al 4 oct». */
export function tituloSemana(desde: string): string {
  const corto = (f: string): string => fechaCorta(f).split(' ').slice(1).join(' ').toLowerCase();
  return `Semana del ${corto(desde)} al ${corto(sumarDias(desde, 6))}`;
}

/** «60 pers. · $ 50 + $ 100 garantía» / «Gratis · máx. 2 h». */
export function metaDeArea(a: AreaAgenda): string {
  const partes: string[] = [];
  if (a.capacidad !== null) partes.push(`${a.capacidad} pers.`);
  if (aCentavos(a.costo) <= 0) {
    partes.push('Gratis');
    if (a.duracion_max_horas !== null) partes.push(`máx. ${a.duracion_max_horas} h`);
  } else if (aCentavos(a.garantia) > 0) {
    partes.push(`${formatoMoneda(a.costo)} + ${formatoMoneda(a.garantia)} garantía`);
  } else {
    partes.push(`${formatoMoneda(a.costo)} · sin garantía`);
  }
  return partes.join(' · ');
}

/** La grilla: una fila por área y, por día, sus reservas y bloqueos ordenados por hora. */
export function armarGrilla(
  agenda: Agenda,
  dias: { fecha: string }[],
): { area: AreaAgenda; celdas: ItemAgenda[][] }[] {
  return agenda.areas.map((area) => ({
    area,
    celdas: dias.map(({ fecha }) => {
      const reservas: ItemAgenda[] = agenda.reservas
        .filter((r) => r.amenidad_id === area.id && r.fecha === fecha)
        .map((r) => ({
          clave: `r${r.id}`,
          tipo: r.estado === 'pendiente' ? 'pend' : 'ok',
          hora: `${r.inicio}–${r.fin}`,
          texto: r.estado === 'pendiente' ? `${r.unidad} · por aprobar` : r.unidad,
          id: r.id,
        }));
      const bloqueos: ItemAgenda[] = agenda.bloqueos
        .filter((b) => b.amenidad_id === area.id && b.fecha === fecha)
        .map((b) => ({
          clave: `b${b.id}`,
          tipo: 'blk',
          hora: b.inicio && b.fin ? `${b.inicio}–${b.fin}` : 'Todo el día',
          texto: b.motivo,
          id: b.id,
        }));
      return [...reservas, ...bloqueos].sort((a, b) => a.hora.localeCompare(b.hora));
    }),
  }));
}

/** «Vence en 20 h» / «Vence en 41 h» / «Vence pronto». `ahora` en milisegundos. */
export function venceEn(vence: string, ahora: number): string {
  const horas = Math.ceil((new Date(vence).getTime() - ahora) / 3_600_000);
  return horas <= 0 ? 'Vence pronto' : `Vence en ${horas} h`;
}

export const resumenCobro = (s: Pick<Solicitud, 'costo' | 'garantia'>): string => {
  const uso = aCentavos(s.costo) > 0;
  const gar = aCentavos(s.garantia) > 0;
  if (uso && gar) return `uso ${formatoMoneda(s.costo)} y garantía ${formatoMoneda(s.garantia)}`;
  if (uso) return `uso ${formatoMoneda(s.costo)}`;
  return '';
};
