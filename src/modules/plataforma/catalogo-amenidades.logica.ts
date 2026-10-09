import type { CategoriaAmenidad } from '@/modules/configuracion/services/amenidades.service';

import type {
  AmenidadPropia,
  GuardarTipoCatalogo,
  TipoCatalogo,
} from './services/catalogo-amenidades.service';

export type TonoChip = 'exito' | 'info' | 'alerta' | 'neutro';

/** Duración como la escribe la persona ("3 h", "1,5 h", "90 min") → minutos. */
export function minutosDeDuracion(
  texto: string,
): { ok: true; minutos: number | null } | { ok: false } {
  const limpio = texto.trim().toLowerCase();
  if (limpio === '' || limpio === '—' || limpio === '-') {
    return { ok: true, minutos: null };
  }
  const horas = /^(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)$/.exec(limpio);
  if (horas) {
    return { ok: true, minutos: Math.round(Number(horas[1]!.replace(',', '.')) * 60) };
  }
  const minutos = /^(\d+)\s*(?:m|min|mins|minuto|minutos)$/.exec(limpio);
  if (minutos) {
    return { ok: true, minutos: Number(minutos[1]) };
  }
  return { ok: false };
}

/** 180 → "3 h", 90 → "1,5 h", 45 → "45 min", null → "" */
export function duracionDeMinutos(minutos: number | null): string {
  if (minutos === null) {
    return '';
  }
  if (minutos < 60) {
    return `${minutos} min`;
  }
  return `${String(minutos / 60).replace('.', ',')} h`;
}

/** "Informativa" cuando no se reserva ni es esencial ni pide aprobación. */
export function etiquetasTipo(x: {
  reservable: boolean;
  esencial: boolean;
  requiere_aprobacion: boolean;
}): { texto: string; tono: TonoChip }[] {
  const etiquetas: { texto: string; tono: TonoChip }[] = [];
  if (x.reservable) etiquetas.push({ texto: 'Reservable', tono: 'exito' });
  if (x.esencial) etiquetas.push({ texto: 'Esencial', tono: 'info' });
  if (x.requiere_aprobacion) etiquetas.push({ texto: 'Con aprobación', tono: 'alerta' });
  if (!etiquetas.length) etiquetas.push({ texto: 'Informativa', tono: 'neutro' });
  return etiquetas;
}

/** Iniciales como en el mockup: palabras de más de 2 letras o con números. */
export function inicialesTipo(nombre: string): string {
  return nombre
    .split(' ')
    .filter((w) => w.length > 2 || /\d/.test(w))
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

// ---------- Formulario ----------

export interface FormularioTipo {
  nombre: string;
  descripcion: string;
  categoria: CategoriaAmenidad;
  orden: string;
  reservable: boolean;
  esencial: boolean;
  requiereAprobacion: boolean;
  activa: boolean;
  capacidad: string;
  duracion: string;
}

export type CampoInterruptor = 'reservable' | 'esencial' | 'requiereAprobacion' | 'activa';

export function formularioDesde(x: TipoCatalogo | AmenidadPropia): FormularioTipo {
  const tipo = 'orden' in x;
  return {
    nombre: x.nombre,
    descripcion: tipo ? (x.descripcion ?? '') : '',
    categoria: x.categoria ?? 'servicios',
    orden: tipo ? String(x.orden) : '',
    reservable: x.reservable,
    esencial: x.esencial,
    requiereAprobacion: x.requiere_aprobacion,
    activa: x.activa,
    capacidad: tipo && x.capacidad !== null ? String(x.capacidad) : '',
    duracion: tipo ? duracionDeMinutos(x.duracion_maxima_min) : '',
  };
}

export function formularioNuevo(siguienteOrden: number): FormularioTipo {
  return {
    nombre: '',
    descripcion: '',
    categoria: 'recreacion',
    orden: String(siguienteOrden),
    reservable: true,
    esencial: false,
    requiereAprobacion: false,
    activa: true,
    capacidad: '',
    duracion: '',
  };
}

/**
 * Reservable y esencial se excluyen (una esencial no se reserva) y solo una reservable
 * puede pedir aprobación o tener duración sugerida.
 */
export function alternarInterruptor(
  f: FormularioTipo,
  campo: CampoInterruptor,
  valor: boolean,
): void {
  f[campo] = valor;
  if (campo === 'esencial' && valor) {
    f.reservable = false;
  }
  if (campo === 'reservable' && valor) {
    f.esencial = false;
  }
  if (!f.reservable) {
    f.requiereAprobacion = false;
    f.duracion = '';
  }
}

export function validarTipo(
  f: FormularioTipo,
): Partial<Record<'nombre' | 'orden' | 'capacidad' | 'duracion', string>> {
  const errores: Partial<Record<'nombre' | 'orden' | 'capacidad' | 'duracion', string>> = {};
  const nombre = f.nombre.trim();
  if (nombre === '') {
    errores.nombre = 'Escribe el nombre de la amenidad.';
  } else if (nombre.length < 2) {
    errores.nombre = 'El nombre tiene mínimo 2 caracteres.';
  } else if (nombre.length > 80) {
    errores.nombre = 'El nombre tiene máximo 80 caracteres.';
  }

  const orden = f.orden.trim();
  if (orden !== '' && !(/^\d+$/.test(orden) && Number(orden) <= 999)) {
    errores.orden = 'El orden va de 0 a 999.';
  }

  const capacidad = f.capacidad.trim();
  if (
    capacidad !== '' &&
    !(/^\d+$/.test(capacidad) && Number(capacidad) >= 1 && Number(capacidad) <= 9999)
  ) {
    errores.capacidad = 'La capacidad va de 1 a 9999.';
  }

  const duracion = minutosDeDuracion(f.duracion);
  if (!duracion.ok) {
    errores.duracion = 'Escribe la duración como "3 h" o "90 min".';
  } else if (duracion.minutos !== null && (duracion.minutos < 15 || duracion.minutos > 1440)) {
    errores.duracion = 'La duración va de 15 minutos a 24 horas.';
  }
  return errores;
}

function aPeticion(f: FormularioTipo): Required<GuardarTipoCatalogo> {
  const duracion = minutosDeDuracion(f.duracion);
  return {
    nombre: f.nombre.trim(),
    descripcion: f.descripcion.trim() === '' ? null : f.descripcion.trim(),
    categoria: f.categoria,
    reservable: f.reservable,
    esencial: f.esencial,
    requiere_aprobacion: f.requiereAprobacion,
    capacidad: f.capacidad.trim() === '' ? null : Number(f.capacidad),
    duracion_maxima_min: duracion.ok ? duracion.minutos : null,
    orden: f.orden.trim() === '' ? 0 : Number(f.orden),
    activa: f.activa,
  };
}

/** Cuerpo para crear: todos los valores. */
export function peticionNueva(f: FormularioTipo): GuardarTipoCatalogo {
  return aPeticion(f);
}

/** Cuerpo para editar: solo lo que cambió respecto de lo guardado. */
export function cambiosTipo(f: FormularioTipo, original: TipoCatalogo): GuardarTipoCatalogo {
  const nuevo = aPeticion(f);
  const actual = aPeticion(formularioDesde(original));
  const cambios: GuardarTipoCatalogo = {};
  for (const clave of Object.keys(nuevo) as (keyof typeof nuevo)[]) {
    if (nuevo[clave] !== actual[clave]) {
      (cambios as Record<string, unknown>)[clave] = nuevo[clave];
    }
  }
  return cambios;
}

export const CAMPOS_API_TIPO: Record<
  string,
  'nombre' | 'orden' | 'capacidad' | 'duracion' | 'esencial' | 'requiereAprobacion'
> = {
  nombre: 'nombre',
  orden: 'orden',
  capacidad: 'capacidad',
  duracion_maxima_min: 'duracion',
  esencial: 'esencial',
  requiere_aprobacion: 'requiereAprobacion',
};

// ---------- Textos de la pantalla ----------

export interface AvisoTipo {
  tono: 'exito' | 'info' | 'neutro' | 'uso' | 'error';
  texto: string;
}

export function avisoTipo(opciones: {
  ambito: 'global' | 'propias';
  nuevo: boolean;
  guardado: boolean;
  error: string | null;
  uso: number;
}): AvisoTipo {
  if (opciones.error) return { tono: 'error', texto: opciones.error };
  if (opciones.guardado) {
    return {
      tono: 'exito',
      texto: 'Cambios guardados. Los condominios que ya la usan conservan su propia configuración.',
    };
  }
  if (opciones.nuevo) {
    return { tono: 'neutro', texto: 'El nombre no puede repetirse en el catálogo global.' };
  }
  if (opciones.ambito === 'global' && opciones.uso > 0) {
    return {
      tono: 'uso',
      texto: `Usada en ${opciones.uso} ${opciones.uso === 1 ? 'condominio' : 'condominios'}: no se puede eliminar, solo desactivar. Cambiar los valores sugeridos no altera a quienes ya la configuraron.`,
    };
  }
  if (opciones.ambito === 'global') {
    return { tono: 'neutro', texto: 'Ningún condominio la usa. Se puede eliminar.' };
  }
  return {
    tono: 'info',
    texto: 'Al promoverla pasa al catálogo global y el condominio la conserva sin cambios.',
  };
}

export type AccionSecundaria = 'cancelar' | 'promover' | 'alternar' | 'eliminar';

export function accionSecundaria(opciones: {
  ambito: 'global' | 'propias';
  nuevo: boolean;
  uso: number;
  activa: boolean;
}): { accion: AccionSecundaria; texto: string; tono: 'normal' | 'peligro' | 'azul' } {
  if (opciones.nuevo) return { accion: 'cancelar', texto: 'Cancelar', tono: 'normal' };
  if (opciones.ambito === 'propias')
    return { accion: 'promover', texto: 'Promover a global', tono: 'azul' };
  if (opciones.uso > 0) {
    return {
      accion: 'alternar',
      texto: opciones.activa ? 'Desactivar' : 'Activar',
      tono: 'normal',
    };
  }
  return { accion: 'eliminar', texto: 'Eliminar', tono: 'peligro' };
}
