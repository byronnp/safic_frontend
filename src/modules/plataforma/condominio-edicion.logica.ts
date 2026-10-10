import { rucValido } from '@/utils/identificacion';

import type {
  CodigoPlan,
  CondominioPlataforma,
  EdicionCondominio,
  TipoCondominio,
} from './services/plataforma.service';

export const TIPOS_CONDOMINIO: { valor: TipoCondominio; etiqueta: string }[] = [
  { valor: 'conjunto', etiqueta: 'Conjunto' },
  { valor: 'edificio', etiqueta: 'Edificio' },
  { valor: 'urbanizacion', etiqueta: 'Urbanización' },
  { valor: 'mixto', etiqueta: 'Mixto' },
];

export interface FormularioEdicion {
  nombre: string;
  tipo: TipoCondominio;
  ruc: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email_contacto: string;
  total_unidades: string;
  plan_codigo: CodigoPlan | null;
  valor_unidad: string;
}

export type ErroresEdicion = Partial<Record<keyof FormularioEdicion, string | undefined>>;

export function formularioDe(c: CondominioPlataforma): FormularioEdicion {
  return {
    nombre: c.nombre,
    tipo: c.tipo,
    ruc: c.ruc ?? '',
    razon_social: c.razon_social ?? '',
    direccion: c.ubicacion.direccion ?? '',
    telefono: c.contacto.telefono ?? '',
    email_contacto: c.contacto.email ?? '',
    total_unidades: String(c.total_unidades),
    plan_codigo: (c.plan?.codigo as CodigoPlan | undefined) ?? null,
    valor_unidad: c.valor_unidad ?? '',
  };
}

/** Acepta coma decimal: "1,5" → "1.50". Devuelve '' si no es un valor. */
export function valorNormalizado(texto: string): string {
  const t = texto.trim().replace(',', '.');
  return /^\d{1,4}(\.\d{1,2})?$/.test(t) ? Number(t).toFixed(2) : '';
}

export function validarEdicion(f: FormularioEdicion): ErroresEdicion {
  const e: ErroresEdicion = {};
  if (f.nombre.trim().length < 2) e.nombre = 'Escribe el nombre del condominio.';
  if (!rucValido(f.ruc.trim())) e.ruc = 'El RUC no es válido (13 dígitos).';
  if (f.razon_social.trim().length < 2) e.razon_social = 'Escribe la razón social.';
  if (f.direccion.trim() === '') e.direccion = 'Escribe la dirección.';
  if (f.telefono.trim() !== '' && !/^0\d{8,9}$/.test(f.telefono.trim())) {
    e.telefono = 'El teléfono debe empezar con 0 y tener 9 o 10 dígitos.';
  }
  if (
    f.email_contacto.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email_contacto.trim())
  ) {
    e.email_contacto = 'El correo no es válido.';
  }
  const unidades = Number(f.total_unidades);
  if (!Number.isInteger(unidades) || unidades < 1 || unidades > 10000) {
    e.total_unidades = 'Escribe un número de unidades entre 1 y 10.000.';
  }
  if (f.plan_codigo === null) e.plan_codigo = 'Elige un plan.';
  if (valorNormalizado(f.valor_unidad) === '' || Number(valorNormalizado(f.valor_unidad)) <= 0) {
    e.valor_unidad = 'Escribe un valor por unidad mayor a cero.';
  }
  return e;
}

/** Solo lo que cambió respecto al condominio original (la API recibe únicamente eso). */
export function cambiosDe(original: CondominioPlataforma, f: FormularioEdicion): EdicionCondominio {
  const antes = formularioDe(original);
  const c: EdicionCondominio = {};
  if (f.nombre.trim() !== antes.nombre) c.nombre = f.nombre.trim();
  if (f.tipo !== antes.tipo) c.tipo = f.tipo;
  if (f.ruc.trim() !== antes.ruc) c.ruc = f.ruc.trim();
  if (f.razon_social.trim() !== antes.razon_social) c.razon_social = f.razon_social.trim();
  if (f.direccion.trim() !== antes.direccion) c.direccion = f.direccion.trim();
  if (f.telefono.trim() !== antes.telefono) c.telefono = f.telefono.trim() || null;
  if (f.email_contacto.trim() !== antes.email_contacto)
    c.email_contacto = f.email_contacto.trim() || null;
  if (Number(f.total_unidades) !== original.total_unidades)
    c.total_unidades = Number(f.total_unidades);
  if (f.plan_codigo !== null && f.plan_codigo !== antes.plan_codigo) c.plan_codigo = f.plan_codigo;
  const valor = valorNormalizado(f.valor_unidad);
  if (valor !== '' && valor !== Number(antes.valor_unidad || 0).toFixed(2)) c.valor_unidad = valor;
  return c;
}

export function validarMotivo(motivo: string): string | undefined {
  const m = motivo.trim();
  if (m === '') return 'Escribe el motivo.';
  return m.length < 3 ? 'El motivo es muy corto.' : undefined;
}
