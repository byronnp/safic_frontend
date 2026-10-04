import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesUnidades } from '../composables/useUnidades';
import { unidadesService } from '../services/unidades.service';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('servicio de unidades', () => {
  it('lista con filtros y página, omitiendo los vacíos', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: [{ id: 1, codigo: 'A-101' }],
        meta: { pagination: { page: 2, per_page: 25, total: 30, last_page: 2 } },
      },
    });

    const pagina = await unidadesService.listar({
      buscar: ' a-1 ',
      tipo: '',
      bloqueId: 3,
      pagina: 2,
    });

    expect(get).toHaveBeenCalledWith('/unidades', {
      params: { buscar: 'a-1', tipo: undefined, bloque_id: 3, page: 2, por_pagina: undefined },
    });
    expect(pagina.unidades[0]?.codigo).toBe('A-101');
    expect(pagina.paginacion.last_page).toBe(2);
  });

  it('pide el resumen y crea en sus rutas', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { registradas: 1 } } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { id: 7 } } });

    expect((await unidadesService.resumen()).registradas).toBe(1);
    expect(get).toHaveBeenCalledWith('/unidades/resumen');

    const datos = {
      codigo: 'A-1',
      bloque_id: null,
      tipo: 'casa' as const,
      piso: null,
      area_m2: '120.00',
      responsable_pago: 'propietario' as const,
    };
    expect((await unidadesService.crear(datos)).id).toBe(7);
    expect(post).toHaveBeenCalledWith('/unidades', datos);
  });

  it('las claves de caché incluyen el condominio', () => {
    expect(clavesUnidades.todas(5)).toEqual(['unidades', 5]);
    expect(clavesUnidades.resumen(5)).toEqual(['unidades', 5, 'resumen']);
    expect(clavesUnidades.lista(5, { pagina: 1 })).toEqual(['unidades', 5, 'lista', { pagina: 1 }]);
    expect(clavesUnidades.lista(9, {})).not.toEqual(clavesUnidades.lista(5, {}));
  });
});
