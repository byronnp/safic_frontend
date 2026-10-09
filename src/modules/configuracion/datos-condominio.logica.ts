import type { FilaVistaPrevia } from './components/DatosCondominioVistaPrevia.vue';
import type { ActualizarDatosCondominio, DatosCondominio } from './services/condominio.service';

/** Colores de SAFIC (botón Restablecer): lo que se usa cuando el condominio no personaliza. */
export const APARIENCIA_PREDETERMINADA = { primario: '#0E5E5B', acento: '#F0B35A' } as const;

export const PALETA_PRIMARIO = [
  '#0E5E5B',
  '#1F4C9A',
  '#7A2E5A',
  '#2E7D32',
  '#B8641C',
  '#C62828',
  '#F2C94C',
];

export const PALETA_ACENTO = ['#F0B35A', '#4FC3F7', '#FF8A65', '#9CCC65', '#BA68C8', '#FFFFFF'];

/** Filas de ejemplo de la vista previa (los colores de estado no cambian). */
export const FILAS_VISTA_PREVIA: FilaVistaPrevia[] = [
  { texto: 'A-102 · Diego Mora', estado: 'pagado', etiqueta: 'Pagado' },
  { texto: 'B-305 · Andrea Villacís', estado: 'pendiente', etiqueta: 'Pendiente' },
  { texto: 'C-204 · Verónica Loor', estado: 'vencido', etiqueta: 'Vencido' },
];

export const LOGO_MAX_BYTES = 1024 * 1024;

// ---------- General ----------

export interface FormularioGeneral {
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
}

export function generalDesde(d: DatosCondominio): FormularioGeneral {
  return {
    nombre: d.nombre,
    telefono: d.telefono ?? '',
    correo: d.email_contacto ?? '',
    direccion: d.direccion ?? '',
  };
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Errores por campo del formulario (vacío = se puede guardar). */
export function validarGeneral(
  f: FormularioGeneral,
): Partial<Record<keyof FormularioGeneral, string>> {
  const errores: Partial<Record<keyof FormularioGeneral, string>> = {};
  if (f.nombre.trim() === '') {
    errores.nombre = 'Escribe el nombre del condominio.';
  } else if (f.nombre.trim().length > 120) {
    errores.nombre = 'El nombre tiene máximo 120 caracteres.';
  }
  if (f.telefono.trim() !== '' && !/^0\d{8,9}$/.test(f.telefono.replace(/[\s-]/g, ''))) {
    errores.telefono = 'Escribe un teléfono de 9 o 10 dígitos que empiece con 0.';
  }
  if (f.correo.trim() !== '' && !CORREO.test(f.correo.trim())) {
    errores.correo = 'Escribe un correo válido.';
  }
  if (f.direccion.trim() === '') {
    errores.direccion = 'Escribe la dirección.';
  } else if (f.direccion.trim().length > 200) {
    errores.direccion = 'La dirección tiene máximo 200 caracteres.';
  }
  return errores;
}

export function peticionGeneral(f: FormularioGeneral): ActualizarDatosCondominio {
  return {
    nombre: f.nombre.trim(),
    telefono: f.telefono.trim() === '' ? null : f.telefono.replace(/[\s-]/g, ''),
    email_contacto: f.correo.trim() === '' ? null : f.correo.trim(),
    direccion: f.direccion.trim(),
  };
}

/** Campos de la API → campos del formulario General (para pintar los 422). */
export const CAMPOS_API_GENERAL: Record<string, keyof FormularioGeneral> = {
  nombre: 'nombre',
  telefono: 'telefono',
  email_contacto: 'correo',
  direccion: 'direccion',
};

// ---------- Ubicación ----------

export interface FormularioUbicacion {
  provincia: string;
  canton: string;
  parroquia: string;
  direccion: string;
  latitud: string;
  longitud: string;
}

export function ubicacionDesde(d: DatosCondominio): FormularioUbicacion {
  return {
    provincia: d.provincia?.codigo ?? '',
    canton: d.canton?.codigo ?? '',
    parroquia: d.parroquia?.codigo ?? '',
    direccion: d.direccion ?? '',
    latitud: d.latitud ?? '',
    longitud: d.longitud ?? '',
  };
}

function coordenada(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  return limpio !== '' && Number.isFinite(Number(limpio)) ? Number(limpio) : null;
}

export function validarUbicacion(
  f: FormularioUbicacion,
): Partial<Record<keyof FormularioUbicacion, string>> {
  const errores: Partial<Record<keyof FormularioUbicacion, string>> = {};
  if (f.provincia === '') {
    errores.provincia = 'Elige la provincia.';
  }
  if (f.canton === '') {
    errores.canton = 'Elige el cantón.';
  }
  if (f.parroquia === '') {
    errores.parroquia = 'Elige la parroquia.';
  }
  if (f.direccion.trim() === '') {
    errores.direccion = 'Escribe la dirección.';
  } else if (f.direccion.trim().length > 200) {
    errores.direccion = 'La dirección tiene máximo 200 caracteres.';
  }

  const lat = coordenada(f.latitud);
  const lng = coordenada(f.longitud);
  if ((lat === null) !== (lng === null)) {
    errores[lat === null ? 'latitud' : 'longitud'] = 'Marca la ubicación en el mapa.';
  } else if (lat !== null && lng !== null) {
    if (lat < -5.1 || lat > 1.7) {
      errores.latitud = 'La ubicación debe estar en Ecuador.';
    }
    if (lng < -92.1 || lng > -75.1) {
      errores.longitud = 'La ubicación debe estar en Ecuador.';
    }
  }
  return errores;
}

export function peticionUbicacion(f: FormularioUbicacion): ActualizarDatosCondominio {
  const lat = coordenada(f.latitud);
  const lng = coordenada(f.longitud);
  return {
    provincia_codigo: f.provincia,
    canton_codigo: f.canton,
    parroquia_codigo: f.parroquia,
    direccion: f.direccion.trim(),
    ...(lat !== null && lng !== null ? { latitud: lat, longitud: lng } : {}),
  };
}

export const CAMPOS_API_UBICACION: Record<string, keyof FormularioUbicacion> = {
  provincia_codigo: 'provincia',
  canton_codigo: 'canton',
  parroquia_codigo: 'parroquia',
  direccion: 'direccion',
  latitud: 'latitud',
  longitud: 'longitud',
};

// ---------- Apariencia ----------

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Colores del formulario → petición. Lo que coincide con SAFIC se manda como null (restablecer). */
export function peticionApariencia(primario: string, acento: string): ActualizarDatosCondominio {
  const normal = (hex: string) => hex.trim().toUpperCase();
  const o = (hex: string, predeterminado: string) =>
    normal(hex) === predeterminado.toUpperCase() ? null : normal(hex);
  return {
    color_primario: o(primario, APARIENCIA_PREDETERMINADA.primario),
    color_acento: o(acento, APARIENCIA_PREDETERMINADA.acento),
  };
}

export function esHexColor(valor: string): boolean {
  return HEX.test(valor.trim());
}

/** Colores guardados del condominio, o los de SAFIC si no personalizó. */
export function aparienciaDesde(d: DatosCondominio): { primario: string; acento: string } {
  return {
    primario: d.marca.color_primario ?? APARIENCIA_PREDETERMINADA.primario,
    acento: d.marca.color_acento ?? APARIENCIA_PREDETERMINADA.acento,
  };
}

/** Revisa el logo antes de subirlo; la API lo vuelve a validar. Devuelve el motivo o null. */
export function motivoLogoInvalido(archivo: {
  type: string;
  size: number;
  name: string;
}): string | null {
  // Si el navegador informa el tipo debe ser PNG; si no lo informa, se mira la extensión
  const esPng = archivo.type !== '' ? archivo.type === 'image/png' : /\.png$/i.test(archivo.name);
  if (!esPng) {
    return 'El logo debe ser un PNG.';
  }
  if (archivo.size > LOGO_MAX_BYTES) {
    return 'El logo pesa más de 1 MB.';
  }
  return null;
}
