import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  anuncioVacio,
  codigosDeUnidades,
  destinoCompleto,
  destinoDe,
  diaMes,
  pendientesDe,
  peticionAnuncio,
  textoAlcance,
  validarAnuncio,
} from '../anuncios.logica';
import { clavesAnuncios } from '../composables/useAnuncios';
import { anunciosService } from '../services/anuncios.service';

afterEach(() => vi.restoreAllMocks());

const hoy = '2026-10-17';
const valido = () => ({
  ...anuncioVacio(),
  titulo: 'Corte de agua',
  mensaje: 'El martes de 09:00 a 13:00.',
});

describe('anuncios', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesAnuncios.admin(3)).toEqual(['comunicacion', 3, 'anuncios']);
    expect(clavesAnuncios.avisos(3)).not.toEqual(clavesAnuncios.avisos(4));
    const d = destinoDe(valido());
    expect(clavesAnuncios.alcance(3, d)).not.toEqual(clavesAnuncios.alcance(4, d));
  });

  it('separa los códigos de unidades sin repetir', () => {
    expect(codigosDeUnidades('A-101, b-202\nC-3;  A-101')).toEqual(['A-101', 'b-202', 'C-3']);
    expect(codigosDeUnidades('  ')).toEqual([]);
  });

  it('un anuncio válido no tiene errores', () => {
    expect(validarAnuncio(valido(), hoy)).toEqual({});
  });

  it('valida título, mensaje, destino, fecha y adjunto', () => {
    expect(validarAnuncio({ ...valido(), titulo: 'Ab' }, hoy).titulo).toBeDefined();
    expect(validarAnuncio({ ...valido(), mensaje: ' ' }, hoy).mensaje).toBeDefined();
    expect(validarAnuncio({ ...valido(), destino: 'bloque' }, hoy).bloqueId).toBe(
      'Elige el bloque.',
    );
    expect(
      validarAnuncio({ ...valido(), destino: 'unidades', unidades: ' ' }, hoy).unidades,
    ).toBeDefined();
    expect(validarAnuncio({ ...valido(), expira: '2026-10-01' }, hoy).expira).toContain('pasada');
    const archivo = (tipo: string, bytes: number) =>
      new File([new Uint8Array(bytes)], 'a', { type: tipo });
    expect(
      validarAnuncio({ ...valido(), adjunto: archivo('application/zip', 10) }, hoy).adjunto,
    ).toContain('PDF');
    expect(
      validarAnuncio({ ...valido(), adjunto: archivo('application/pdf', 6 * 1024 * 1024) }, hoy)
        .adjunto,
    ).toContain('5 MB');
    expect(validarAnuncio({ ...valido(), adjunto: archivo('application/pdf', 1000) }, hoy)).toEqual(
      {},
    );
  });

  it('el alcance solo se consulta con el destino completo', () => {
    expect(destinoCompleto(valido())).toBe(true);
    expect(destinoCompleto({ ...valido(), destino: 'bloque' })).toBe(false);
    expect(destinoCompleto({ ...valido(), destino: 'bloque', bloqueId: 4 })).toBe(true);
    expect(destinoCompleto({ ...valido(), destino: 'unidades', unidades: '' })).toBe(false);
    expect(destinoCompleto({ ...valido(), destino: 'unidades', unidades: 'A-1' })).toBe(true);
  });

  it('arma la petición y los textos como en el mockup', () => {
    expect(
      peticionAnuncio({ ...valido(), titulo: ' Corte ', fijar: true, expira: '' }),
    ).toMatchObject({
      titulo: 'Corte',
      destino_tipo: 'todos',
      fijar: true,
      expira: null,
      unidades: [],
    });
    expect(textoAlcance({ destino: 'Torre C', unidades: 48, personas_con_cuenta: 131 })).toBe(
      'Llegará a 48 unidades · 131 personas con cuenta',
    );
    expect(textoAlcance({ destino: 'x', unidades: 1, personas_con_cuenta: 1 })).toBe(
      'Llegará a 1 unidad · 1 persona con cuenta',
    );
    expect(diaMes('2026-09-22')).toBe('22 sep');
    expect(
      pendientesDe({ unidades: 148, leidas: 107, confirmadas: 100, requiere_confirmacion: true }),
    ).toBe(48);
    expect(
      pendientesDe({ unidades: 148, leidas: 107, confirmadas: 100, requiere_confirmacion: false }),
    ).toBe(41);
  });

  it('el servicio envía el formulario y usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { unidades: 5 } } });

    await anunciosService.listar();
    expect(get).toHaveBeenCalledWith('/comunicacion/anuncios');
    await anunciosService.alcance({
      destino_tipo: 'unidades',
      bloque_id: null,
      unidades: ['A-1', 'B-2'],
    });
    expect(get).toHaveBeenCalledWith('/comunicacion/anuncios/alcance', {
      params: { destino_tipo: 'unidades', unidades: ['A-1', 'B-2'] },
    });
    await anunciosService.mios();
    expect(get).toHaveBeenCalledWith('/mis-avisos');

    await anunciosService.publicar({
      ...peticionAnuncio({
        ...valido(),
        destino: 'unidades',
        unidades: 'A-1, B-2',
        confirmacion: true,
      }),
    });
    const [ruta, formulario] = post.mock.calls[0] as [string, FormData];
    expect(ruta).toBe('/comunicacion/anuncios');
    expect(formulario.getAll('unidades[]')).toEqual(['A-1', 'B-2']);
    expect(formulario.get('confirmacion')).toBe('1');
    expect(formulario.has('bloque_id')).toBe(false);
    expect(formulario.has('expira')).toBe(false);

    expect(await anunciosService.reenviar(9)).toBe(5);
    expect(post).toHaveBeenCalledWith('/comunicacion/anuncios/9/reenviar');
    await anunciosService.leer(9);
    expect(post).toHaveBeenCalledWith('/mis-avisos/9/leer');
    await anunciosService.confirmar(9);
    expect(post).toHaveBeenCalledWith('/mis-avisos/9/confirmar');
  });
});
