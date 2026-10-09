import { cedulaValida } from '@/utils/identificacion';

import type { TonoEstado } from '@/components/EstadoBadge.vue';

import type {
  ActualizarUsuario,
  CupoUsuarios,
  EstadoUsuario,
  InvitarUsuario,
  PerfilAsignable,
  UsuarioCondominio,
} from './services/usuarios.service';

export const PERFILES: { valor: PerfilAsignable; etiqueta: string; ayuda: string }[] = [
  {
    valor: 'administrador',
    etiqueta: 'Administrador',
    ayuda: 'Gestiona el condominio. Consume cupo del plan.',
  },
  {
    valor: 'contador',
    etiqueta: 'Contador',
    ayuda: 'Ve y exporta finanzas. Consume cupo y vence en una fecha.',
  },
  { valor: 'guardia', etiqueta: 'Guardia', ayuda: 'Garita y directorio. No consume cupo.' },
  {
    valor: 'mantenimiento',
    etiqueta: 'Mantenimiento',
    ayuda: 'Personal de mantenimiento. No consume cupo.',
  },
];

const ETIQUETAS_ROL: Record<string, string> = {
  administrador: 'Administrador',
  contador: 'Contador',
  guardia: 'Guardia',
  mantenimiento: 'Mantenimiento',
  residente: 'Residente',
  presidente: 'Presidente',
  vicepresidente: 'Vicepresidente',
  secretario: 'Secretario',
  tesorero: 'Tesorero',
};

export function etiquetaRol(rol: string): string {
  return ETIQUETAS_ROL[rol] ?? rol;
}

/** "Tesorero · Residente" */
export function textoRoles(roles: string[]): string {
  return roles.length ? roles.map(etiquetaRol).join(' · ') : 'Sin perfil';
}

export function requiereVigencia(perfil: PerfilAsignable | null): boolean {
  return perfil === 'contador';
}

export const ESTADOS: Record<EstadoUsuario, { texto: string; tono: TonoEstado }> = {
  activo: { texto: 'Activo', tono: 'exito' },
  pendiente: { texto: 'Invitación pendiente', tono: 'alerta' },
  desactivado: { texto: 'Desactivado', tono: 'neutro' },
  vencido: { texto: 'Acceso vencido', tono: 'error' },
};

/** Uso del cupo en porcentaje (sin límite = 0). */
export function porcentajeCupo(cupo: CupoUsuarios): number {
  return cupo.limite ? Math.min(100, Math.round((cupo.usados / cupo.limite) * 100)) : 0;
}

export function textoCupo(cupo: CupoUsuarios): string {
  return cupo.limite === null ? `${cupo.usados}` : `${cupo.usados} de ${cupo.limite}`;
}

export function haySinCupo(cupo: CupoUsuarios): boolean {
  return cupo.limite !== null && cupo.usados >= cupo.limite;
}

// ---------- Invitar ----------

export interface FormularioInvitar {
  nombre: string;
  cedula: string;
  email: string;
  celular: string;
  rol: PerfilAsignable;
  accesoHasta: string;
}

export const FORMULARIO_INVITAR_VACIO: FormularioInvitar = {
  nombre: '',
  cedula: '',
  email: '',
  celular: '',
  rol: 'guardia',
  accesoHasta: '',
};

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarInvitar(
  f: FormularioInvitar,
  hoy: string,
): Partial<Record<keyof FormularioInvitar, string>> {
  const errores: Partial<Record<keyof FormularioInvitar, string>> = {};
  if (f.nombre.trim() === '') {
    errores.nombre = 'Escribe el nombre.';
  } else if (f.nombre.trim().length > 120) {
    errores.nombre = 'El nombre tiene máximo 120 caracteres.';
  }
  if (!cedulaValida(f.cedula.trim())) {
    errores.cedula = 'La cédula no es válida.';
  }
  if (f.email.trim() === '') {
    errores.email = 'Escribe el correo.';
  } else if (!CORREO.test(f.email.trim())) {
    errores.email = 'Escribe un correo válido.';
  }
  if (f.celular.trim() !== '' && !/^09\d{8}$/.test(f.celular.replace(/\s/g, ''))) {
    errores.celular = 'El celular tiene 10 dígitos y empieza con 09.';
  }
  if (requiereVigencia(f.rol) && f.accesoHasta === '') {
    errores.accesoHasta = 'El contador necesita una fecha de vencimiento del acceso.';
  } else if (f.accesoHasta !== '' && f.accesoHasta <= hoy) {
    errores.accesoHasta = 'La fecha de vencimiento debe ser posterior a hoy.';
  }
  return errores;
}

export function peticionInvitar(f: FormularioInvitar): InvitarUsuario {
  return {
    nombre: f.nombre.trim(),
    cedula: f.cedula.trim(),
    email: f.email.trim().toLowerCase(),
    celular: f.celular.trim() === '' ? null : f.celular.replace(/\s/g, ''),
    rol: f.rol,
    acceso_hasta: f.accesoHasta === '' ? null : f.accesoHasta,
  };
}

export const CAMPOS_API_INVITAR: Record<string, keyof FormularioInvitar> = {
  nombre: 'nombre',
  cedula: 'cedula',
  email: 'email',
  celular: 'celular',
  rol: 'rol',
  acceso_hasta: 'accesoHasta',
};

// ---------- Editar ----------

export interface FormularioUsuario {
  perfil: PerfilAsignable | null;
  accesoHasta: string;
}

export function formularioUsuarioDesde(u: UsuarioCondominio): FormularioUsuario {
  return { perfil: u.perfil, accesoHasta: u.acceso_hasta ?? '' };
}

/** Solo lo que cambió; vacío si no hay cambios. */
export function cambiosUsuario(f: FormularioUsuario, u: UsuarioCondominio): ActualizarUsuario {
  const cambios: ActualizarUsuario = {};
  if (f.perfil !== null && f.perfil !== u.perfil) {
    cambios.rol = f.perfil;
  }
  if (f.accesoHasta !== (u.acceso_hasta ?? '')) {
    cambios.acceso_hasta = f.accesoHasta === '' ? null : f.accesoHasta;
  }
  return cambios;
}

export function validarUsuario(
  f: FormularioUsuario,
  hoy: string,
): Partial<Record<keyof FormularioUsuario, string>> {
  const errores: Partial<Record<keyof FormularioUsuario, string>> = {};
  if (requiereVigencia(f.perfil) && f.accesoHasta === '') {
    errores.accesoHasta = 'El contador necesita una fecha de vencimiento del acceso.';
  } else if (f.accesoHasta !== '' && f.accesoHasta < hoy) {
    errores.accesoHasta = 'La fecha de vencimiento no puede ser pasada.';
  }
  return errores;
}

/** Fecha de hoy en la hora de Ecuador (la del condominio): "2026-10-09". */
export function hoyEcuador(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}
