/**
 * Contrato común de la API de SAFIC (ver App\Core\Http\Responses\ApiResponse).
 *
 * Éxito: { data, meta?, message? }
 * Error: { error: { code, message, fields?, details? } }
 */
export interface ApiRespuesta<T> {
  data: T;
  meta?: {
    pagination?: Paginacion;
    [clave: string]: unknown;
  };
  message?: string;
}

export interface Paginacion {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiErrorCuerpo {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    details?: Record<string, unknown>;
  };
}

/** Apariencia del condominio (pantalla Apariencia). Todos los campos son opcionales. */
export interface MarcaCondominio {
  logo_url?: string | null;
  color_primario?: string | null;
  color_acento?: string | null;
}

export interface CondominioResumen {
  id: number;
  codigo: string;
  nombre: string;
  es_principal: boolean;
  estado: string;
  marca: MarcaCondominio | null;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  condominios: CondominioResumen[];
  /** Perfil de plataforma (super admin, soporte, cobranza…); null si no tiene. */
  plataforma: ContextoPlataforma | null;
}

export interface ContextoPlataforma {
  roles: string[];
  permisos: string[];
}

export interface RespuestaToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  usuario: Usuario;
}

export interface ContextoCondominio {
  condominio_id: number;
  roles: string[];
  permisos: string[];
}
