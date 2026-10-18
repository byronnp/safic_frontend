import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pedirArchivo } = vi.hoisted(() => ({ pedirArchivo: vi.fn() }));
vi.mock('@/core/api/descarga', () => ({ pedirArchivo }));

import { garitaService } from '../services/garita.service';

describe('exportar la bitácora', () => {
  beforeEach(() => pedirArchivo.mockReset());

  it('pide el Excel con los mismos filtros de la pantalla', async () => {
    const blob = new Blob(['x']);
    pedirArchivo.mockResolvedValue(blob);

    const r = await garitaService.exportarBitacora({
      desde: '2026-10-11',
      hasta: '2026-10-17',
      tipo: 'proveedor',
      q: ' torre ',
    });

    expect(r).toBe(blob);
    expect(pedirArchivo).toHaveBeenCalledWith(
      '/garita/bitacora/exportar?desde=2026-10-11&hasta=2026-10-17&tipo=proveedor&q=torre',
    );
  });

  it('sin tipo ni búsqueda solo manda el rango', async () => {
    pedirArchivo.mockResolvedValue(new Blob());
    await garitaService.exportarBitacora({ desde: 'a', hasta: 'b', tipo: null, q: '  ' });
    expect(pedirArchivo).toHaveBeenCalledWith('/garita/bitacora/exportar?desde=a&hasta=b');
  });
});
