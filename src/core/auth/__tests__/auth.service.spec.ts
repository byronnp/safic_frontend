import { afterEach, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { authService } from '../auth.service';

afterEach(() => {
  vi.restoreAllMocks();
});

it('al aceptar la invitación envía la aceptación del aviso de privacidad', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { email: 'a@b.ec' } } });

  await expect(
    authService.aceptarInvitacion(
      't0k3n',
      'Clave-2026-x',
      'Clave-2026-x',
      true,
      '2026-10-borrador',
    ),
  ).resolves.toBe('a@b.ec');
  expect(post).toHaveBeenCalledWith(
    '/auth/invitaciones/t0k3n/aceptar',
    {
      password: 'Clave-2026-x',
      password_confirmation: 'Clave-2026-x',
      acepta_privacidad: true,
      aviso_privacidad_version: '2026-10-borrador',
    },
    { saltarRefresco: true },
  );
});

it('el segundo paso del login envía el desafío y el código sin intentar refrescar la sesión', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { access_token: 'jwt' } } });

  await authService.verificarDobleFactor('d'.repeat(64), '123456');

  expect(post).toHaveBeenCalledWith(
    '/auth/2fa/verificar',
    { desafio: 'd'.repeat(64), codigo: '123456' },
    { saltarRefresco: true },
  );
});
