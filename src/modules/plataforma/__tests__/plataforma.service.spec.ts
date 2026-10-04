import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { plataformaService } from '../services/plataforma.service';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('servicio de plataforma', () => {
  it('lista condominios con búsqueda y página, sin X-Condominio-Id propio', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: [{ id: 1, nombre: 'Los Arupos' }],
        meta: { pagination: { page: 2, per_page: 24, total: 30, last_page: 2 } },
      },
    });

    const pagina = await plataformaService.condominios({ buscar: 'arupos', pagina: 2 });

    expect(get).toHaveBeenCalledWith('/plataforma/condominios', {
      params: { buscar: 'arupos', page: 2 },
    });
    expect(pagina.paginacion.last_page).toBe(2);
    expect(pagina.condominios[0]?.nombre).toBe('Los Arupos');
  });

  it('omite la búsqueda vacía', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });

    await plataformaService.condominios({ buscar: '' });

    expect(get).toHaveBeenCalledWith('/plataforma/condominios', {
      params: { buscar: undefined, page: 1 },
    });
  });

  it('al crear devuelve si el administrador ya tenía cuenta', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        data: { id: 9, nombre: 'Los Arupos' },
        meta: { administrador_existente: true, invitacion_enviada: false },
        message: 'Condominio creado.',
      },
    });

    const creado = await plataformaService.crear({} as never);

    expect(creado.administradorExistente).toBe(true);
    expect(creado.condominio.id).toBe(9);
    expect(creado.mensaje).toBe('Condominio creado.');
  });

  it('reenvía la invitación y solo manda el correo cuando se corrige', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { data: { id: 4, email: 'nuevo@correo.ec' } } });

    await plataformaService.reenviarInvitacion(2, 4, null);
    await plataformaService.reenviarInvitacion(2, 4, 'nuevo@correo.ec');

    expect(post).toHaveBeenNthCalledWith(
      1,
      '/plataforma/condominios/2/administradores/4/invitacion',
      {},
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/plataforma/condominios/2/administradores/4/invitacion',
      {
        email: 'nuevo@correo.ec',
      },
    );
  });
});
