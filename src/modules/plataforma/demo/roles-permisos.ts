// Datos de ejemplo del mockup F1PlataformaRoles.dc.html. Se reemplazan por la API cuando exista el endpoint.

/** sis = rol de sistema, car = cargo (una persona por cargo), adi = rol adicional. */
export type TipoRol = 'sis' | 'car' | 'adi';

export interface RolPlantilla {
  nombre: string;
  tipo: TipoRol;
  /** Dónde se usa: "Todos", "2 condominios", "Sin publicar". */
  alcance: string;
}

export interface PermisoPlantilla {
  clave: string;
  etiqueta: string;
  modulo: string;
  /** Cuenta para el límite de usuarios administrativos del plan (marca ADM). */
  administrativo: boolean;
  /** Permiso de escritura (un rol de solo lectura no lo recibe). */
  escritura: boolean;
  /** Un carácter por rol, en el orden de ROLES_PLANTILLA: '1' = concedido. */
  valores: string;
}

export const ROLES_PLANTILLA: RolPlantilla[] = [
  { nombre: 'Administrador', tipo: 'sis', alcance: 'Todos' },
  { nombre: 'Tesorero', tipo: 'car', alcance: 'Todos' },
  { nombre: 'Contador', tipo: 'sis', alcance: 'Todos' },
  { nombre: 'Presidente', tipo: 'car', alcance: 'Todos' },
  { nombre: 'Vicepresidente', tipo: 'car', alcance: 'Todos' },
  { nombre: 'Secretario', tipo: 'car', alcance: 'Todos' },
  { nombre: 'Guardia', tipo: 'sis', alcance: 'Todos' },
  { nombre: 'Mantenim.', tipo: 'sis', alcance: 'Todos' },
  { nombre: 'Residente', tipo: 'sis', alcance: 'Todos' },
  { nombre: 'Asist. contable', tipo: 'adi', alcance: 'Todos' },
  { nombre: 'Conserje', tipo: 'adi', alcance: '2 condominios' },
];

function p(
  clave: string,
  etiqueta: string,
  modulo: string,
  administrativo: number,
  escritura: number,
  valores: string,
): PermisoPlantilla {
  return {
    clave,
    etiqueta,
    modulo,
    administrativo: administrativo === 1,
    escritura: escritura === 1,
    valores,
  };
}

export const PERMISOS_PLANTILLA: PermisoPlantilla[] = [
  p('unidades.ver', 'Ver unidades y residentes', 'Núcleo', 0, 0, '11111110011'),
  p('unidades.editar', 'Crear y editar unidades', 'Núcleo', 1, 1, '10000000000'),
  p('residentes.ver_datos', 'Ver datos personales completos', 'Núcleo', 1, 0, '10000000000'),
  p('usuarios.gestionar', 'Gestionar usuarios y roles', 'Núcleo', 1, 1, '10000000000'),
  p('amenidades.gestionar', 'Gestionar amenidades', 'Núcleo', 1, 1, '10000000000'),
  p('finanzas.ver', 'Ver finanzas y reportes', 'Finanzas', 0, 0, '11111000010'),
  p('pagos.aprobar', 'Aprobar pagos de residentes', 'Finanzas', 1, 1, '11000000000'),
  p('gastos.registrar', 'Registrar facturas de proveedores', 'Finanzas', 1, 1, '11000000010'),
  p('gastos.aprobar-n1', 'Aprobar gastos · nivel 1', 'Finanzas', 1, 1, '10000000000'),
  p('gastos.aprobar-n2', 'Aprobar gastos · nivel 2', 'Finanzas', 0, 1, '00011000000'),
  p('gastos.pagar', 'Registrar pagos a proveedores', 'Finanzas', 1, 1, '01000000000'),
  p('finanzas.exportar', 'Exportar a Excel y PDF', 'Finanzas', 1, 0, '11100000000'),
  p('reservas.ver', 'Ver agenda de áreas', 'Áreas comunes', 0, 0, '10011010101'),
  p('reservas.gestionar', 'Aprobar y gestionar reservas', 'Áreas comunes', 1, 1, '10000000000'),
  p('visitas.registrar', 'Registrar visitas y paquetes', 'Garita', 0, 1, '10000010000'),
  p('anuncios.publicar', 'Publicar anuncios', 'Comunicación', 0, 1, '10011000001'),
  p('incidencias.gestionar', 'Gestionar incidencias', 'Comunicación', 0, 1, '10000001001'),
  p('asambleas.preparar', 'Preparar y convocar asambleas', 'Asambleas', 0, 1, '10011000000'),
  p('asambleas.instalar', 'Instalar y dirigir votaciones', 'Asambleas', 0, 1, '00011000000'),
  p('actas.firmar', 'Firmar actas', 'Asambleas', 0, 1, '00011100000'),
];

export const MODULOS_PERMISOS = [
  'Núcleo',
  'Finanzas',
  'Áreas comunes',
  'Garita',
  'Comunicación',
  'Asambleas',
] as const;

/** Solicitudes de roles nuevas enviadas por los condominios. */
export const SOLICITUDES_ROL_PENDIENTES = 2;
