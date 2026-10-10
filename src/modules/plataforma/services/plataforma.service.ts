import { api } from '@/core/api/client';
import type { ApiRespuesta, Paginacion } from '@/core/api/types';

/** Tipos copiados de docs/openapi.yaml del backend (schemas de Plataforma). */

export type CodigoPlan = 'basico' | 'profesional' | 'completo';
export type TipoCondominio = 'conjunto' | 'edificio' | 'urbanizacion' | 'mixto';
export type EstadoCondominio = 'prueba' | 'activo' | 'solo_lectura' | 'suspendido';
export type MetodoCobro = 'general' | 'tipo' | 'alicuota' | 'unidad';
export type TipoUnidad = 'departamento' | 'casa' | 'local' | 'parqueadero' | 'bodega';

export interface Plan {
  codigo: CodigoPlan;
  nombre: string;
  limite_administrativos: number;
  /** Dinero como texto decimal ("2.00"). */
  valor_unidad_sugerido: string;
}

export interface AmenidadCatalogo {
  id: number;
  nombre: string;
  categoria: 'recreacion' | 'deporte' | 'social' | 'servicios' | 'seguridad';
  descripcion: string | null;
  reservable: boolean;
  esencial: boolean;
  requiere_aprobacion: boolean;
}

export interface AdministradorCondominio {
  id: number;
  nombre: string;
  email: string;
  estado: 'activo' | 'invitado';
}

export interface CondominioPlataforma {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoCondominio;
  ruc: string | null;
  razon_social: string | null;
  estado: EstadoCondominio;
  prueba_hasta: string | null;
  total_unidades: number;
  valor_unidad: string | null;
  mensualidad: string | null;
  plan: { codigo: string; nombre: string } | null;
  ubicacion: {
    provincia: string | null;
    canton: string | null;
    parroquia: string | null;
    direccion: string | null;
    latitud: string | null;
    longitud: string | null;
  };
  contacto: { telefono: string | null; email: string | null };
  administradores: AdministradorCondominio[];
  creado_en: string;
}

export interface EdicionCondominio {
  nombre?: string;
  tipo?: TipoCondominio;
  ruc?: string;
  razon_social?: string;
  direccion?: string;
  telefono?: string | null;
  email_contacto?: string | null;
  total_unidades?: number;
  plan_codigo?: CodigoPlan;
  valor_unidad?: string;
}

export interface UsuarioEncontrado {
  id: number;
  nombre: string;
  activo: boolean;
  condominios: number;
}

export interface NuevoCondominio {
  nombre: string;
  tipo: TipoCondominio;
  ruc: string;
  razon_social: string;
  provincia_codigo: string;
  canton_codigo: string;
  parroquia_codigo: string;
  direccion: string;
  telefono: string | null;
  email_contacto: string | null;
  total_unidades: number;
  plan_codigo: CodigoPlan;
  valor_unidad: string;
  latitud: number;
  longitud: number;
  cobro: {
    metodo: MetodoCobro;
    cuota_general: string | null;
    presupuesto_mensual: string | null;
    valores_tipo: { tipo: TipoUnidad; valor: string }[] | null;
    dia_vencimiento: number;
    primera_cuota: string;
  };
  amenidades: { amenidad_id: number; cantidad: number }[];
  administrador: { cedula: string; nombre: string; email: string; celular: string | null };
}

export interface CondominioCreado {
  condominio: CondominioPlataforma;
  administradorExistente: boolean;
  mensaje: string;
}

export interface PaginaCondominios {
  condominios: CondominioPlataforma[];
  paginacion: Paginacion;
}

/** Rutas del panel de plataforma: no llevan X-Condominio-Id. */
export const plataformaService = {
  async planes(): Promise<Plan[]> {
    const { data } = await api.get<ApiRespuesta<Plan[]>>('/plataforma/planes');
    return data.data;
  },

  async amenidades(): Promise<AmenidadCatalogo[]> {
    const { data } = await api.get<ApiRespuesta<AmenidadCatalogo[]>>('/plataforma/amenidades');
    return data.data;
  },

  async condominios(filtro: { buscar?: string; pagina?: number }): Promise<PaginaCondominios> {
    const { data } = await api.get<ApiRespuesta<CondominioPlataforma[]>>(
      '/plataforma/condominios',
      {
        params: { buscar: filtro.buscar || undefined, page: filtro.pagina ?? 1 },
      },
    );
    return {
      condominios: data.data,
      paginacion: data.meta?.pagination ?? {
        page: 1,
        per_page: data.data.length,
        total: data.data.length,
        last_page: 1,
      },
    };
  },

  /**
   * Reenvía la invitación a un administrador que aún no crea su contraseña (anula el
   * enlace anterior). Con `email` corrige antes su correo.
   */
  async reenviarInvitacion(
    condominioId: number,
    usuarioId: number,
    email: string | null,
  ): Promise<AdministradorCondominio> {
    const { data } = await api.post<ApiRespuesta<AdministradorCondominio>>(
      `/plataforma/condominios/${condominioId}/administradores/${usuarioId}/invitacion`,
      email === null ? {} : { email },
    );
    return data.data;
  },

  async crear(datos: NuevoCondominio): Promise<CondominioCreado> {
    const { data } = await api.post<
      ApiRespuesta<CondominioPlataforma> & { meta: { administrador_existente: boolean } }
    >('/plataforma/condominios', datos);
    return {
      condominio: data.data,
      administradorExistente: data.meta.administrador_existente,
      mensaje: data.message ?? 'Condominio creado.',
    };
  },

  async buscarUsuario(email: string): Promise<UsuarioEncontrado | null> {
    const { data } = await api.get<ApiRespuesta<UsuarioEncontrado | null>>(
      '/plataforma/usuarios/buscar',
      { params: { email } },
    );
    return data.data;
  },

  /** Solo el super admin (plataforma.condominios-editar). */
  async editar(id: number, cambios: EdicionCondominio): Promise<CondominioPlataforma> {
    const { data } = await api.patch<ApiRespuesta<CondominioPlataforma>>(
      `/plataforma/condominios/${id}`,
      cambios,
    );
    return data.data;
  },

  /** Suspende el acceso de todos los usuarios del condominio (no borra nada). */
  async inactivar(id: number, motivo: string): Promise<CondominioPlataforma> {
    const { data } = await api.post<ApiRespuesta<CondominioPlataforma>>(
      `/plataforma/condominios/${id}/inactivar`,
      { motivo },
    );
    return data.data;
  },

  async reactivar(id: number, motivo: string): Promise<CondominioPlataforma> {
    const { data } = await api.post<ApiRespuesta<CondominioPlataforma>>(
      `/plataforma/condominios/${id}/reactivar`,
      { motivo },
    );
    return data.data;
  },
};
