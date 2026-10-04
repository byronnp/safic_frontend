import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { authService } from '@/core/auth/auth.service';
import type { CondominioResumen, RespuestaToken, Usuario } from '@/core/api/types';

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
    }
  }

  async function iniciarSesion(email: string, password: string): Promise<void> {
    aplicarToken(await authService.login(email, password));
    restaurada.value = true;
    await resolverCondominioInicial('login');
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

  function limpiar(): void {
    accessToken.value = null;
    usuario.value = null;
    condominioId.value = null;
    roles.value = [];
    permisos.value = [];
  }

  return {
    accessToken,
    usuario,
    condominioId,
    roles,
    permisos,
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
    refrescar,
    restaurar,
    cerrarSesion,
    limpiar,
  };
});
