import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesBloques } from '../composables/useBloques';
import { bloquesService } from '../services/bloques.service';

afterEach(() => vi.restoreAllMocks());

describe('bloques', () => {
  it('la clave de caché incluye el condominio', () => {
    expect(clavesBloques.todos(7)).toEqual(['bloques', 7]);
    expect(clavesBloques.todos(8)).not.toEqual(clavesBloques.todos(7));
  });

  it('edita solo lo que cambia en la ruta del contrato', async () => {
    const patch = vi
      .spyOn(api, 'patch')
      .mockResolvedValue({ data: { data: { id: 3, nombre: 'Torre Norte', orden: 1 } } });
    const b = await bloquesService.editar(3, { nombre: 'Torre Norte' });
    expect(patch).toHaveBeenCalledWith('/bloques/3', { nombre: 'Torre Norte' });
    expect(b.nombre).toBe('Torre Norte');
  });

  it('elimina en la ruta del contrato', async () => {
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined });
    await bloquesService.eliminar(3);
    expect(del).toHaveBeenCalledWith('/bloques/3');
  });
});
