import { z } from 'zod';

import { fechaCorta } from '@/modules/reservas/reservas.logica';

import type {
  AlcanceAnuncio,
  AnuncioAdmin,
  DestinoAnuncio,
  DestinoTipo,
  NuevoAnuncio,
} from './services/anuncios.service';

export interface FormularioAnuncio {
  titulo: string;
  mensaje: string;
  destino: DestinoTipo;
  bloqueId: number | null;
  /** Códigos separados por coma, espacio o salto de línea */
  unidades: string;
  fijar: boolean;
  confirmacion: boolean;
  expira: string;
  adjunto: File | null;
}

export type ErroresAnuncio = Partial<
  Record<'titulo' | 'mensaje' | 'bloqueId' | 'unidades' | 'expira' | 'adjunto', string | undefined>
>;

export const MAX_ADJUNTO = 5 * 1024 * 1024;
export const TIPOS_ADJUNTO = ['application/pdf', 'image/jpeg', 'image/png'];

export const anuncioVacio = (): FormularioAnuncio => ({
  titulo: '',
  mensaje: '',
  destino: 'todos',
  bloqueId: null,
  unidades: '',
  fijar: false,
  confirmacion: false,
  expira: '',
  adjunto: null,
});

/** «A-101, b-202\nC-3» → ['A-101', 'b-202', 'C-3'] (sin repetidos). */
export function codigosDeUnidades(texto: string): string[] {
  return [
    ...new Set(
      texto
        .split(/[\s,;]+/)
        .map((c) => c.trim())
        .filter((c) => c !== ''),
    ),
  ];
}

const esquema = z.object({
  titulo: z.string().trim().min(3, 'Escribe el título del anuncio.').max(120, 'Máximo 120 letras.'),
  mensaje: z
    .string()
    .trim()
    .min(3, 'Escribe el mensaje del anuncio.')
    .max(4000, 'Máximo 4000 caracteres.'),
});

export function validarAnuncio(f: FormularioAnuncio, hoy: string): ErroresAnuncio {
  const errores: ErroresAnuncio = {};
  const r = esquema.safeParse(f);
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0] as 'titulo' | 'mensaje';
      if (!errores[campo]) errores[campo] = p.message;
    }
  }
  if (f.destino === 'bloque' && f.bloqueId === null) errores.bloqueId = 'Elige el bloque.';
  if (f.destino === 'unidades') {
    const n = codigosDeUnidades(f.unidades).length;
    if (n === 0) errores.unidades = 'Escribe al menos una unidad.';
    else if (n > 300) errores.unidades = 'Máximo 300 unidades por anuncio.';
  }
  if (f.expira !== '' && f.expira < hoy) errores.expira = 'La fecha no puede ser pasada.';
  if (f.adjunto !== null) {
    if (!TIPOS_ADJUNTO.includes(f.adjunto.type))
      errores.adjunto = 'El adjunto debe ser un PDF o una imagen JPG o PNG.';
    else if (f.adjunto.size > MAX_ADJUNTO) errores.adjunto = 'El adjunto pesa más de 5 MB.';
  }
  return errores;
}

export function destinoDe(
  f: Pick<FormularioAnuncio, 'destino' | 'bloqueId' | 'unidades'>,
): DestinoAnuncio {
  return {
    destino_tipo: f.destino,
    bloque_id: f.bloqueId,
    unidades: codigosDeUnidades(f.unidades),
  };
}

/** El alcance solo se consulta con el destino completo. */
export const destinoCompleto = (
  f: Pick<FormularioAnuncio, 'destino' | 'bloqueId' | 'unidades'>,
): boolean =>
  f.destino === 'todos' ||
  (f.destino === 'bloque' && f.bloqueId !== null) ||
  (f.destino === 'unidades' &&
    codigosDeUnidades(f.unidades).length > 0 &&
    codigosDeUnidades(f.unidades).length <= 300);

export function peticionAnuncio(f: FormularioAnuncio): NuevoAnuncio {
  return {
    ...destinoDe(f),
    titulo: f.titulo.trim(),
    mensaje: f.mensaje.trim(),
    fijar: f.fijar,
    confirmacion: f.confirmacion,
    expira: f.expira === '' ? null : f.expira,
    adjunto: f.adjunto,
  };
}

/** «Llegará a 48 unidades · 131 personas con cuenta». */
export function textoAlcance(a: AlcanceAnuncio): string {
  const u = a.unidades === 1 ? '1 unidad' : `${a.unidades} unidades`;
  const p =
    a.personas_con_cuenta === 1
      ? '1 persona con cuenta'
      : `${a.personas_con_cuenta} personas con cuenta`;
  return `Llegará a ${u} · ${p}`;
}

/** El enlace de un adjunto solo se muestra si es https (viene de la API, pero no se confía a ciegas). */
export function urlSegura(url: string | null): string | null {
  if (url === null) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** «22 sep». */
export function diaMes(iso: string): string {
  // Algunos navegadores abrevian septiembre como «sept»: se usa siempre «sep»
  return fechaCorta(iso)
    .split(' ')
    .slice(1)
    .join(' ')
    .toLowerCase()
    .replace(/^(\d+) sept$/, '$1 sep');
}

export const pendientesDe = (
  a: Pick<AnuncioAdmin, 'unidades' | 'leidas' | 'confirmadas' | 'requiere_confirmacion'>,
): number => a.unidades - (a.requiere_confirmacion ? a.confirmadas : a.leidas);
