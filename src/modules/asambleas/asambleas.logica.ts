import { z } from 'zod';

import type { TonoEstado } from '@/components/EstadoBadge.vue';

import type {
  AnticipacionConvocatoria,
  EstadoAsamblea,
  GuardarAsamblea,
  GuardarPunto,
  ModalidadAsamblea,
  PuntoAsamblea,
  TipoAsamblea,
  TipoPunto,
} from './services/asambleas.service';

export const TIPOS_ASAMBLEA: { valor: TipoAsamblea; etiqueta: string }[] = [
  { valor: 'ordinaria', etiqueta: 'Ordinaria' },
  { valor: 'extraordinaria', etiqueta: 'Extraordinaria' },
];

export const MODALIDADES: { valor: ModalidadAsamblea; etiqueta: string }[] = [
  { valor: 'presencial', etiqueta: 'Presencial con voto en la app' },
  { valor: 'mixta', etiqueta: 'Mixta' },
  { valor: 'virtual', etiqueta: 'Virtual' },
];

export const TIPOS_PUNTO: Record<TipoPunto, { nombre: string; tono: TonoEstado }> = {
  informativo: { nombre: 'Informativo', tono: 'neutro' },
  votacion: { nombre: 'Votación', tono: 'exito' },
  eleccion: { nombre: 'Elección', tono: 'info' },
  reforma_reglamento: { nombre: 'Reforma de reglamento', tono: 'alerta' },
};

export const ESTADOS: Record<EstadoAsamblea, { nombre: string; tono: TonoEstado }> = {
  borrador: { nombre: 'Borrador', tono: 'neutro' },
  convocada: { nombre: 'Convocada', tono: 'info' },
  en_registro: { nombre: 'En registro', tono: 'alerta' },
  instalada: { nombre: 'Instalada', tono: 'exito' },
  en_votacion: { nombre: 'En votación', tono: 'exito' },
  cerrada: { nombre: 'Cerrada', tono: 'neutro' },
  acta_firmada: { nombre: 'Acta firmada', tono: 'exito' },
  cancelada: { nombre: 'Cancelada', tono: 'error' },
};

export const nombreModalidad = (m: ModalidadAsamblea): string =>
  MODALIDADES.find((x) => x.valor === m)?.etiqueta ?? m;

export const nombreTipo = (t: TipoAsamblea): string =>
  TIPOS_ASAMBLEA.find((x) => x.valor === t)?.etiqueta ?? t;

/** «66.67» → «66,67 %». */
export function porcentaje(valor: string | number): string {
  return `${new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(valor))} %`;
}

/** Cómo se decide un punto, como en el mockup: «—», «Simple · presentes», «66,67 % · total». */
export function textoMayoria(p: Pick<PuntoAsamblea, 'mayoria' | 'umbral_pct' | 'base'>): string {
  if (p.mayoria === 'ninguna') return '—';
  if (p.mayoria === 'simple') return 'Simple · presentes';
  return `${p.umbral_pct === null ? '—' : porcentaje(p.umbral_pct)} · ${p.base === 'presentes' ? 'presentes' : 'total'}`;
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function partes(fecha: string): { y: number; m: number; d: number } {
  const [y = 0, m = 1, d = 1] = fecha.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

/** «2026-10-17» → «sáb 17 oct» (sin depender de la zona del navegador). */
export function diaCorto(fecha: string): string {
  const { y, m, d } = partes(fecha);
  return `${DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d} ${MESES[m - 1]}`;
}

/** «2026-10-17T19:00» → «sáb 17 oct 2026 · 19:00». */
export function fechaHoraLarga(fechaHora: string): string {
  return `${diaCorto(fechaHora)} ${partes(fechaHora).y} · ${fechaHora.slice(11, 16)}`;
}

/** «2026-10-09» → «9 de octubre». */
function diaMesLargo(fecha: string): string {
  const { m, d } = partes(fecha);
  const nombres = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${d} de ${nombres[m - 1]}`;
}

/** El aviso de anticipación del mockup. El cálculo (feriados, días hábiles) lo hace el servidor. */
export function mensajeAnticipacion(a: AnticipacionConvocatoria): string {
  const feriados = a.feriados.map((f) => diaMesLargo(f.fecha));
  const descontando =
    feriados.length === 0
      ? ''
      : feriados.length === 1
        ? `, descontando el feriado del ${feriados[0]}`
        : `, descontando los feriados del ${feriados.slice(0, -1).join(', ')} y ${feriados.at(-1)}`;

  return a.cumple
    ? `Cumple la anticipación legal: hay que convocar a más tardar el ${diaCorto(a.ultimo_dia)} (${a.minimo} días hábiles${descontando}, Art. 37). Segunda convocatoria automática a las ${a.segunda_convocatoria}.`
    : `Ya no hay ${a.minimo} días hábiles de anticipación (Art. 37): había que convocar a más tardar el ${diaCorto(a.ultimo_dia)}. Cambia la fecha de la asamblea.`;
}

/** La hora de ahora en Ecuador como la pide el campo de fecha y hora: `YYYY-MM-DDTHH:MM`. */
export function ahoraLocal(ahora: Date = new Date()): string {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(ahora);
  const v = (t: string) => f.find((p) => p.type === t)?.value ?? '';
  return `${v('year')}-${v('month')}-${v('day')}T${v('hour')}:${v('minute')}`;
}

export interface FormularioAsamblea {
  titulo: string;
  tipo: TipoAsamblea;
  modalidad: ModalidadAsamblea;
  fechaHora: string;
  lugar: string;
  enlaceVideo: string;
}

export const asambleaVacia = (): FormularioAsamblea => ({
  titulo: '',
  tipo: 'ordinaria',
  modalidad: 'presencial',
  fechaHora: '',
  lugar: '',
  enlaceVideo: '',
});

export type ErroresAsamblea = Partial<
  Record<
    'titulo' | 'tipo' | 'modalidad' | 'fechaHora' | 'lugar' | 'enlaceVideo',
    string | undefined
  >
>;

const esquemaAsamblea = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'Escribe el título de la asamblea.')
    .max(120, 'Máximo 120 letras.'),
  fechaHora: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Indica la fecha y la hora.'),
  lugar: z.string().trim().max(160, 'Máximo 160 letras.'),
});

/** `permiteVirtual`: el reglamento del condominio permite asambleas virtuales o mixtas (reglas de asamblea). */
export function validarAsamblea(
  f: FormularioAsamblea,
  permiteVirtual: boolean,
  ahora: string = ahoraLocal(),
): ErroresAsamblea {
  const errores: ErroresAsamblea = {};
  const r = esquemaAsamblea.safeParse(f);
  if (!r.success) {
    for (const i of r.error.issues) {
      const campo = i.path[0] as keyof ErroresAsamblea;
      errores[campo] ??= i.message;
    }
  }
  if (errores.fechaHora === undefined && f.fechaHora <= ahora) {
    errores.fechaHora = 'La fecha y la hora deben ser futuras.';
  }
  if (f.modalidad !== 'presencial' && !permiteVirtual) {
    errores.modalidad =
      'El reglamento del condominio no permite asambleas virtuales o mixtas. Actívalo en las reglas de asamblea si sí lo permite.';
  }
  if (f.modalidad !== 'virtual' && f.lugar.trim() === '')
    errores.lugar = 'Indica el lugar de la asamblea.';
  if (f.modalidad !== 'presencial') {
    if (f.enlaceVideo.trim() === '') {
      errores.enlaceVideo = 'Indica el enlace de la videollamada (Zoom, Meet o Teams).';
    } else if (!/^https:\/\/\S+$/i.test(f.enlaceVideo.trim())) {
      errores.enlaceVideo = 'El enlace debe empezar con https://';
    }
  }
  return errores;
}

/** Lo que se envía a la API (ya validado). El enlace solo cuenta si hay videollamada y el lugar solo si hay sala. */
export function aSolicitudAsamblea(f: FormularioAsamblea): GuardarAsamblea {
  const lugar = f.lugar.trim();
  const enlace = f.enlaceVideo.trim();
  return {
    titulo: f.titulo.trim(),
    tipo: f.tipo,
    modalidad: f.modalidad,
    fecha_hora: f.fechaHora,
    lugar: lugar === '' ? null : lugar,
    enlace_video: f.modalidad === 'presencial' || enlace === '' ? null : enlace,
  };
}

export interface FormularioPunto {
  titulo: string;
  descripcion: string;
  tipo: TipoPunto;
  mayoria: 'simple' | 'calificada';
  umbral: string;
  /** Sobre qué alícuotas se calcula una mayoría calificada (la reforma siempre es sobre el total). */
  base: 'presentes' | 'total';
}

export const puntoVacio = (): FormularioPunto => ({
  titulo: '',
  descripcion: '',
  tipo: 'informativo',
  mayoria: 'simple',
  umbral: '',
  base: 'total',
});

export type ErroresPunto = Partial<Record<'titulo' | 'descripcion' | 'umbral', string | undefined>>;

/** Un punto de reforma (o de mayoría calificada) necesita su porcentaje: sale de aquí o de las reglas del condominio. */
export function seExigeUmbral(f: FormularioPunto): boolean {
  return (
    f.tipo === 'reforma_reglamento' || (f.tipo !== 'informativo' && f.mayoria === 'calificada')
  );
}

export function normalizarUmbral(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n > 50 && n <= 100 ? n : null;
}

/** `porcentajeReforma`: el que el condominio guardó en sus reglas (o null si aún no lo confirmó). */
export function validarPunto(f: FormularioPunto, porcentajeReforma: string | null): ErroresPunto {
  const errores: ErroresPunto = {};
  const titulo = f.titulo.trim();
  if (titulo.length < 3) errores.titulo = 'Escribe el punto.';
  else if (titulo.length > 160) errores.titulo = 'Máximo 160 letras.';
  if (f.descripcion.trim().length > 2000) errores.descripcion = 'Máximo 2000 caracteres.';

  if (seExigeUmbral(f)) {
    const indicado = f.umbral.trim() !== '';
    if (indicado && normalizarUmbral(f.umbral) === null) {
      errores.umbral = 'Indica un porcentaje mayor que 50 y hasta 100 (hasta dos decimales).';
    } else if (!indicado && f.tipo !== 'reforma_reglamento') {
      errores.umbral = 'Una mayoría calificada necesita su porcentaje.';
    } else if (!indicado && porcentajeReforma === null) {
      errores.umbral =
        'Indica el porcentaje legal para reformar el reglamento o guárdalo en las reglas de asamblea. Confírmalo con asesoría legal.';
    }
  }
  return errores;
}

/** Lo que se envía a la API (ya validado). */
export function aSolicitudPunto(f: FormularioPunto): GuardarPunto {
  const descripcion = f.descripcion.trim();
  const base = {
    titulo: f.titulo.trim(),
    descripcion: descripcion === '' ? null : descripcion,
    tipo: f.tipo,
  };
  if (f.tipo === 'informativo') {
    return { ...base, mayoria: null, umbral_pct: null, base: null };
  }
  if (seExigeUmbral(f)) {
    return {
      ...base,
      mayoria: 'calificada',
      umbral_pct: normalizarUmbral(f.umbral),
      base: f.tipo === 'reforma_reglamento' ? 'total' : f.base,
    };
  }
  return { ...base, mayoria: 'simple', umbral_pct: null, base: null };
}

/** Rellena el formulario de un punto con el que ya existe. */
export function formularioDePunto(p: PuntoAsamblea): FormularioPunto {
  return {
    titulo: p.titulo,
    descripcion: p.descripcion ?? '',
    tipo: p.tipo,
    mayoria: p.mayoria === 'calificada' ? 'calificada' : 'simple',
    umbral: p.umbral_pct === null ? '' : String(Number(p.umbral_pct)),
    base: p.base === 'presentes' ? 'presentes' : 'total',
  };
}
