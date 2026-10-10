import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { authService } from '@/core/auth/auth.service';
import {
  esDesafioDobleFactor,
  type CondominioResumen,
  type DesafioDobleFactor,
  type MarcaCondominio,
  type RespuestaToken,
  type Usuario,
} from '@/core/api/types';

const CLAVE_CONDOMINIO = 'safic.condominio';

/** Solo se recuerda el id del último condominio elegido (no es dato sensible). */
function leerCondominioRecordado(): number | null {
  try {
    const valor = Number(localStorage.getItem(CLAVE_CONDOMINIO));
    return Number.isInteger(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function recordarCondominio(id: number | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(CLAVE_CONDOMINIO);
    } else {
      localStorage.setItem(CLAVE_CONDOMINIO, String(id));
    }
  } catch {
    // Almacenamiento no disponible (modo privado): se pedirá elegir otra vez.
  }
}

/**
 * Sesión del usuario.
 * - El access token vive SOLO en memoria (nunca en localStorage).
 * - Al recargar la página se recupera con /auth/refresh (cookie HttpOnly).
 * - Los permisos son los del condominio activo (/me/contexto).
 */
export const useSessionStore = defineStore('session', () => {
  const accessToken = ref<string | null>(null);
  const usuario = ref<Usuario | null>(null);
  const condominioId = ref<number | null>(null);
  const roles = ref<string[]>([]);
  const permisos = ref<string[]>([]);
  /** Es contador en el condominio activo y aún no activó la verificación en dos pasos. */
  const dobleFactorPendiente = ref(false);
  /** Ya se intentó recuperar la sesión en esta carga de la página. */
  const restaurada = ref(false);

  const autenticado = computed(() => accessToken.value !== null && usuario.value !== null);
  const condominios = computed<CondominioResumen[]>(() => usuario.value?.condominios ?? []);
  const condominioActivo = computed<CondominioResumen | null>(
    () => condominios.value.find((c) => c.id === condominioId.value) ?? null,
  );

  /** Perfil de plataforma: no depende del condominio activo. */
  const rolesPlataforma = computed<string[]>(() => usuario.value?.plataforma?.roles ?? []);
  const permisosPlataforma = computed<string[]>(() => usuario.value?.plataforma?.permisos ?? []);
  const esPlataforma = computed(() => rolesPlataforma.value.length > 0);

  function tienePermiso(permiso: string | string[]): boolean {
    const requeridos = Array.isArray(permiso) ? permiso : [permiso];
    return requeridos.every((p) => permisos.value.includes(p));
  }

  function tienePermisoPlataforma(permiso: string | string[]): boolean {
    const requeridos = Array.isArray(permiso) ? permiso : [permiso];
    return requeridos.every((p) => permisosPlataforma.value.includes(p));
  }

  function aplicarToken(respuesta: RespuestaToken): void {
    accessToken.value = respuesta.access_token;
    usuario.value = respuesta.usuario;
  }

  /** Elige el condominio y carga roles y permisos en él. */
  async function seleccionarCondominio(id: number): Promise<void> {
    if (!condominios.value.some((c) => c.id === id)) {
      throw new Error('El condominio no está entre tus condominios activos.');
    }
    const contexto = await authService.contexto(id);
    condominioId.value = id;
    roles.value = contexto.roles;
    permisos.value = contexto.permisos;
    dobleFactorPendiente.value = contexto.doble_factor_pendiente;
    recordarCondominio(id);
  }

  /**
   * Condominio con el que arranca la sesión.
   * - Al iniciar sesión: siempre el principal (el usuario cambia desde el selector).
   * - Al recargar la página: el último elegido, para no sacarlo de donde trabajaba.
   * En ambos casos, si falta el preferido se usa el principal o el único; si no
   * hay ninguno, el usuario lo elige.
   */
  async function resolverCondominioInicial(origen: 'login' | 'recarga'): Promise<void> {
    const lista = condominios.value;
    const recordado = origen === 'recarga' ? leerCondominioRecordado() : null;
    const candidato =
      lista.find((c) => c.id === recordado) ??
      lista.find((c) => c.es_principal) ??
      (lista.length === 1 ? lista[0] : undefined);

    if (candidato) {
      await seleccionarCondominio(candidato.id);
    } else {
      condominioId.value = null;
      roles.value = [];
      permisos.value = [];
      dobleFactorPendiente.value = false;
    }
  }

  /**
   * Devuelve el desafío del segundo paso si la cuenta tiene verificación en dos pasos (todavía
   * no hay sesión); `null` si la sesión quedó iniciada.
   */
  async function iniciarSesion(
    email: string,
    password: string,
  ): Promise<DesafioDobleFactor | null> {
    const respuesta = await authService.login(email, password);
    if (esDesafioDobleFactor(respuesta)) {
      return respuesta;
    }
    await abrirSesion(respuesta);
    return null;
  }

  /** Segundo paso del login con el código de la app o uno de respaldo. */
  async function completarDobleFactor(desafio: string, codigo: string): Promise<void> {
    await abrirSesion(await authService.verificarDobleFactor(desafio, codigo));
  }

  async function abrirSesion(respuesta: RespuestaToken): Promise<void> {
    aplicarToken(respuesta);
    restaurada.value = true;
    await resolverCondominioInicial('login');
  }

  /** Refleja que la verificación en dos pasos se activó o se desactivó (sin volver a iniciar sesión). */
  function aplicarDobleFactor(activo: boolean): void {
    if (usuario.value) {
      usuario.value.doble_factor.activo = activo;
    }
    if (activo) {
      dobleFactorPendiente.value = false;
    }
  }

  /** Renueva el access token. Lo usa el cliente HTTP ante un 401. */
  async function refrescar(): Promise<string | null> {
    try {
      aplicarToken(await authService.refrescar());
      return accessToken.value;
    } catch {
      limpiar();
      return null;
    }
  }

  /** Recupera la sesión al cargar la página (una sola vez). */
  async function restaurar(): Promise<void> {
    if (restaurada.value) {
      return;
    }
    restaurada.value = true;

    if ((await refrescar()) !== null) {
      try {
        await resolverCondominioInicial('recarga');
      } catch {
        condominioId.value = null;
      }
    }
  }

  async function cerrarSesion(): Promise<void> {
    try {
      await authService.logout();
    } finally {
      limpiar();
      recordarCondominio(null);
    }
  }

  /**
   * Refleja en la sesión lo que el administrador acaba de guardar (nombre, colores y logos)
   * para que el tema y el menú cambien sin volver a iniciar sesión.
   */
  function aplicarDatosCondominio(
    id: number,
    datos: { nombre: string; marca: MarcaCondominio },
  ): void {
    const condominio = usuario.value?.condominios.find((c) => c.id === id);
    if (condominio) {
      condominio.nombre = datos.nombre;
      condominio.marca = datos.marca;
    }
  }

  function limpiar(): void {
    accessToken.value = null;
    usuario.value = null;
    condominioId.value = null;
    roles.value = [];
    permisos.value = [];
    dobleFactorPendiente.value = false;
  }

  return {
    accessToken,
    usuario,
    condominioId,
    roles,
    permisos,
    dobleFactorPendiente,
    restaurada,
    autenticado,
    condominios,
    condominioActivo,
    rolesPlataforma,
    permisosPlataforma,
    esPlataforma,
    tienePermiso,
    tienePermisoPlataforma,
    seleccionarCondominio,
    iniciarSesion,
    completarDobleFactor,
    aplicarDobleFactor,
    refrescar,
    restaurar,
    cerrarSesion,
    aplicarDatosCondominio,
    limpiar,
  };
});
