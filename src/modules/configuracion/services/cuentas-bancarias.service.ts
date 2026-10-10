import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · /cuentas-bancarias). */
export type TipoCuenta = 'corriente' | 'ahorros';

export interface CuentaBancaria {
  id: number;
  banco: string;
  tipo: TipoCuenta;
  numero: string;
  titular: string;
  /** La que ven los residentes para transferir. */
  es_principal: boolean;
  activa: boolean;
}

export interface NuevaCuentaBancaria {
  banco: string;
  tipo: TipoCuenta;
  numero: string;
  titular: string;
  es_principal?: boolean;
}

/** Al editar solo viaja lo que cambia. */
export type CambiosCuentaBancaria = Partial<NuevaCuentaBancaria> & { activa?: boolean };

export const cuentasBancariasService = {
  async listar(): Promise<CuentaBancaria[]> {
    const { data } = await api.get<ApiRespuesta<CuentaBancaria[]>>('/cuentas-bancarias');
    return data.data;
  },

  async crear(datos: NuevaCuentaBancaria): Promise<CuentaBancaria> {
    const { data } = await api.post<ApiRespuesta<CuentaBancaria>>('/cuentas-bancarias', datos);
    return data.data;
  },

  async editar(id: number, cambios: CambiosCuentaBancaria): Promise<CuentaBancaria> {
    const { data } = await api.patch<ApiRespuesta<CuentaBancaria>>(
      `/cuentas-bancarias/${id}`,
      cambios,
    );
    return data.data;
  },
};
