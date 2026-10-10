import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';
import { dobleFactorService } from '@/core/auth/doble-factor.service';

import {
  codigoDeApp,
  errorCodigo,
  errorCodigoDeApp,
  errorContrasena,
  esCodigoDeApp,
  esCodigoDeRespaldo,
  secretoAgrupado,
  textoCodigosRespaldo,
} from '../doble-factor.logica';

afterEach(() => vi.restoreAllMocks());

describe('códigos', () => {
  it('reconoce el código de 6 dígitos con o sin espacios', () => {
    expect(esCodigoDeApp('123456')).toBe(true);
    expect(esCodigoDeApp('123 456')).toBe(true);
    expect(codigoDeApp('123 456')).toBe('123456');
    expect(esCodigoDeApp('12345')).toBe(false);
    expect(esCodigoDeApp('12345a')).toBe(false);
  });

  it('reconoce un código de respaldo con guion, minúsculas o espacios', () => {
    expect(esCodigoDeRespaldo('ABCDE-FGHJK')).toBe(true);
    expect(esCodigoDeRespaldo('abcde fghjk')).toBe(true);
    expect(esCodigoDeRespaldo('ABCDEFGHJK')).toBe(true);
    // El alfabeto Base32 no tiene 0, 1, 8 ni 9
    expect(esCodigoDeRespaldo('ABCDE-FGHJ1')).toBe(false);
    expect(esCodigoDeRespaldo('ABCDE')).toBe(false);
  });

  it('el login y las acciones aceptan app o respaldo; confirmar solo la app', () => {
    expect(errorCodigo('123456')).toBeNull();
    expect(errorCodigo('ABCDE-FGHJK')).toBeNull();
    expect(errorCodigo('')).toBe('Escribe el código de tu app.');
    expect(errorCodigo('hola')).toBe(
      'El código tiene 6 dígitos (o 10 letras y números si es de respaldo).',
    );
    expect(errorCodigoDeApp('123456')).toBeNull();
    expect(errorCodigoDeApp('ABCDE-FGHJK')).toBe('El código de tu app tiene 6 dígitos.');
    expect(errorCodigoDeApp('  ')).toBe('Escribe el código de tu app.');
  });

  it('pide la contraseña', () => {
    expect(errorContrasena('')).toBe('Escribe tu contraseña.');
    expect(errorContrasena('x')).toBeNull();
  });
});

describe('presentación', () => {
  it('agrupa el secreto de cuatro en cuatro', () => {
    expect(secretoAgrupado('ABCDEFGHIJ')).toBe('ABCD EFGH IJ');
  });

  it('arma el archivo de códigos con la cuenta y un código por línea', () => {
    const texto = textoCodigosRespaldo(['AAAAA-BBBBB', 'CCCCC-DDDDD'], 'ana@ejemplo.ec');
    expect(texto).toContain('Cuenta: ana@ejemplo.ec');
    expect(texto).toContain('\nAAAAA-BBBBB\nCCCCC-DDDDD\n');
  });
});

describe('dobleFactorService', () => {
  it('usa las rutas y cuerpos del contrato', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });

    await dobleFactorService.preparar('Clave-1');
    await dobleFactorService.confirmar('123456');
    await dobleFactorService.regenerarCodigos('Clave-1', '123456');
    await dobleFactorService.desactivar('Clave-1', '123456');

    expect(post).toHaveBeenNthCalledWith(1, '/auth/2fa/preparar', { password: 'Clave-1' });
    expect(post).toHaveBeenNthCalledWith(2, '/auth/2fa/confirmar', { codigo: '123456' });
    expect(post).toHaveBeenNthCalledWith(3, '/auth/2fa/codigos', {
      password: 'Clave-1',
      codigo: '123456',
    });
    expect(post).toHaveBeenNthCalledWith(4, '/auth/2fa/desactivar', {
      password: 'Clave-1',
      codigo: '123456',
    });
  });
});
