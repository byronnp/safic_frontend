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
