/**
 * Íconos de SAFIC: Material Symbols Rounded (prefijo `sym_r_` en Quasar).
 * Todo ítem del menú lateral DEBE tener ícono. Usa estas constantes en vez de
 * escribir el nombre a mano para que el catálogo quede en un solo lugar.
 * Catálogo: https://fonts.google.com/icons?icon.style=Rounded
 */
export const ICONOS = {
  inicio: 'sym_r_space_dashboard',
  unidades: 'sym_r_apartment',
  bloques: 'sym_r_domain',
  residentes: 'sym_r_groups',
  finanzas: 'sym_r_account_balance_wallet',
  cuotas: 'sym_r_receipt_long',
  pagos: 'sym_r_payments',
  proveedores: 'sym_r_local_shipping',
  reservas: 'sym_r_event_available',
  amenidades: 'sym_r_pool',
  garita: 'sym_r_shield_person',
  comunicacion: 'sym_r_campaign',
  asambleas: 'sym_r_how_to_vote',
  usuarios: 'sym_r_manage_accounts',
  apariencia: 'sym_r_palette',
  configuracion: 'sym_r_settings',
  plataforma: 'sym_r_admin_panel_settings',
  condominio: 'sym_r_location_city',
  cambiar: 'sym_r_swap_horiz',
  salir: 'sym_r_logout',
  agregar: 'sym_r_add',
  menu: 'sym_r_menu',
  buscar: 'sym_r_search',
  refrescar: 'sym_r_refresh',
  bloqueado: 'sym_r_lock',
  vacio: 'sym_r_inbox',
} as const;

export type NombreIcono = keyof typeof ICONOS;
export type Icono = (typeof ICONOS)[NombreIcono];
