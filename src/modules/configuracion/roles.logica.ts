import type {
  PermisoCatalogo,
  RolCondominio,
  SolicitarRol,
  TipoRol,
} from './services/roles.service';
import type { CupoUsuarios } from './services/usuarios.service';

export const TIPOS_ROL: Record<TipoRol, string> = {
  sistema: 'Rol de sistema',
  cargo: 'Cargo de directiva',
  adicional: 'Rol adicional creado por la plataforma',
};

const TITULOS_GRUPO: Record<TipoRol, string> = {
  sistema: 'SISTEMA',
  cargo: 'CARGOS DE DIRECTIVA',
  adicional: 'ADICIONALES DE LA PLATAFORMA',
};

/** Ícono de cada rol (Material Symbols Rounded). Los cargos muestran un candado en la lista. */
const ICONOS_ROL: Record<string, string> = {
  administrador: 'shield',
  contador: 'calculate',
  guardia: 'badge',
  mantenimiento: 'build',
  residente: 'home',
  presidente: 'workspace_premium',
  vicepresidente: 'workspace_premium',
  secretario: 'edit_note',
  tesorero: 'savings',
};

export function iconoRol(rol: Pick<RolCondominio, 'clave' | 'tipo'>): string {
  return `sym_r_${rol.tipo === 'cargo' ? 'lock' : (ICONOS_ROL[rol.clave] ?? 'person')}`;
}

/**
 * El ícono de una pantalla del menú viene del servidor: solo se acepta un nombre de
 * Material Symbols (q-icon también interpreta prefijos como `img:` o `https://`).
 */
export function iconoSeguro(icono: string): string {
  return /^sym_r_[a-z0-9_]+$/.test(icono) ? icono : 'sym_r_circle';
}

export interface GrupoRoles {
  tipo: TipoRol;
  titulo: string;
  roles: RolCondominio[];
}

/** Agrupa como el mockup (sistema, cargos, adicionales) y omite los grupos vacíos. */
export function agruparRoles(roles: RolCondominio[]): GrupoRoles[] {
  return (['sistema', 'cargo', 'adicional'] as const)
    .map((tipo) => ({
      tipo,
      titulo: TITULOS_GRUPO[tipo],
      roles: roles.filter((r) => r.tipo === tipo),
    }))
    .filter((g) => g.roles.length > 0);
}

export interface GrupoPermisos {
  grupo: string;
  permisos: PermisoCatalogo[];
}

/** Permisos agrupados por módulo, en el orden en que llegan. */
export function agruparPermisos(permisos: PermisoCatalogo[]): GrupoPermisos[] {
  const grupos: GrupoPermisos[] = [];
  for (const p of permisos) {
    const ultimo = grupos.find((g) => g.grupo === p.grupo);
    if (ultimo) {
      ultimo.permisos.push(p);
    } else {
      grupos.push({ grupo: p.grupo, permisos: [p] });
    }
  }
  return grupos;
}

export function textoUsuarios(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'usuario' : 'usuarios'}`;
}

export interface AvisoRol {
  tono: 'exito' | 'neutro' | 'alerta' | 'info';
  texto: string;
}

/** El aviso bajo el título del rol: depende del tipo, del cupo y de si se envió una solicitud. */
export function avisoRol(
  rol: RolCondominio,
  cupo: CupoUsuarios,
  solicitudEnviada: boolean,
): AvisoRol {
  if (solicitudEnviada) {
    return {
      tono: 'exito',
      texto: 'Solicitud enviada a la plataforma. Te avisaremos cuando el rol esté disponible.',
    };
  }
  if (rol.tipo === 'cargo') {
    return {
      tono: 'neutro',
      texto:
        'Cargo de directiva: se asigna desde Usuarios › Directiva. Sus permisos los define la plataforma.',
    };
  }
  if (rol.cuenta_cupo) {
    const uso =
      cupo.limite === null ? `${cupo.usados} usados` : `${cupo.usados} de ${cupo.limite} usados`;
    return {
      tono: 'alerta',
      texto: `Rol administrativo: quien lo tenga cuenta para el límite de tu plan (${uso}). Los roles los define la plataforma; aquí solo los asignas.`,
    };
  }
  return {
    tono: 'info',
    texto:
      'Los roles los define la plataforma; aquí ves qué permite cada uno y los asignas a tus usuarios. ¿Necesitas otro? Usa Solicitar rol.',
  };
}

export function validarSolicitud(f: SolicitarRol): Partial<Record<keyof SolicitarRol, string>> {
  const errores: Partial<Record<keyof SolicitarRol, string>> = {};
  const nombre = f.nombre.trim();
  const descripcion = f.descripcion.trim();
  if (nombre === '') {
    errores.nombre = 'Escribe el nombre sugerido para el rol.';
  } else if (nombre.length < 3) {
    errores.nombre = 'El nombre tiene mínimo 3 caracteres.';
  } else if (nombre.length > 60) {
    errores.nombre = 'El nombre tiene máximo 60 caracteres.';
  }
  if (descripcion === '') {
    errores.descripcion = 'Cuéntanos qué debe poder hacer.';
  } else if (descripcion.length < 10) {
    errores.descripcion = 'Cuéntanos un poco más: mínimo 10 caracteres.';
  } else if (descripcion.length > 500) {
    errores.descripcion = 'La descripción tiene máximo 500 caracteres.';
  }
  return errores;
}
