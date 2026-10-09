import { textoRelacion } from '@/modules/unidades/persona.formulario';

import type { DirectorioOcupante, DirectorioUnidad } from './services/directorio.service';

export type CampoBusqueda = 'placa' | 'nombre' | 'unidad';

/** La API pide al menos 2 letras o números: antes de eso no se consulta. */
export function terminoValido(texto: string): boolean {
  return /[\p{L}\p{N}].*[\p{L}\p{N}]/u.test(texto.trim());
}

/** Sin tildes ni mayúsculas; compacto quita espacios y guiones: "pbc 4821" encuentra "PBC-4821". */
function normalizar(texto: string, compacto: boolean): string {
  const base = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return compacto ? base.replace(/[\s-]/g, '') : base.replace(/\s+/g, ' ');
}

/**
 * La API busca en nombre, unidad y placa a la vez; el filtro de la pantalla
 * (Placa / Nombre / Unidad) deja solo las unidades donde coincide ese campo.
 */
export function coincideCampo(
  resultado: DirectorioUnidad,
  campo: CampoBusqueda,
  termino: string,
): boolean {
  switch (campo) {
    case 'placa': {
      const t = normalizar(termino, true);
      return resultado.vehiculos.some((v) => normalizar(v.placa, true).includes(t));
    }
    case 'unidad':
      return normalizar(resultado.unidad.codigo, true).includes(normalizar(termino, true));
    case 'nombre': {
      const t = normalizar(termino, false);
      return resultado.ocupantes.some((o) => normalizar(o.nombre, false).includes(t));
    }
  }
}

/** "Inquilino · Torre A": relación y, si la unidad tiene bloque, su nombre. */
export function textoOcupante(ocupante: DirectorioOcupante, bloque: string | null): string {
  return [textoRelacion(ocupante.relacion), bloque].filter(Boolean).join(' · ');
}

/** Casas y locales se pintan distinto de las torres, como en el mockup. */
export function tipoVisual(tipo: DirectorioUnidad['unidad']['tipo']): 'torre' | 'casa' {
  return tipo === 'casa' ? 'casa' : 'torre';
}

/** Solo dígitos y "+" para el enlace tel: (el teléfono viene tal como se guardó). */
export function enlaceTelefono(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, '')}`;
}
