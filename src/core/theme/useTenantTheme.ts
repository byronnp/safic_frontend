import { setCssVar } from 'quasar';
import { watch } from 'vue';

import type { MarcaCondominio } from '@/core/api/types';
import { useSessionStore } from '@/stores/session';

import { asegurarContraste, esHexValido } from './colors';

/** Colores de marca de SAFIC (se usan si el condominio no personalizó los suyos). */
export const TEMA_SAFIC = {
  primario: '#0E5E5B',
  acento: '#F0B35A',
} as const;

/**
 * Colores efectivos del condominio. El primario se ajusta para que el texto
 * blanco se lea (4.5:1). Los colores de estado (positivo, negativo, alerta)
 * NO se personalizan: significan lo mismo en todos los condominios.
 */
export function coloresDeMarca(marca: MarcaCondominio | null | undefined): {
  primario: string;
  acento: string;
} {
  const primario =
    marca?.color_primario && esHexValido(marca.color_primario)
      ? asegurarContraste(marca.color_primario)
      : TEMA_SAFIC.primario;
  const acento =
    marca?.color_acento && esHexValido(marca.color_acento) ? marca.color_acento : TEMA_SAFIC.acento;
  return { primario, acento };
}

/** Aplica la apariencia del condominio activo y la actualiza al cambiar de condominio. */
export function useTenantTheme(): void {
  const session = useSessionStore();

  watch(
    () => session.condominioActivo?.marca,
    (marca) => {
      const { primario, acento } = coloresDeMarca(marca);
      setCssVar('primary', primario);
      setCssVar('accent', acento);
    },
    { immediate: true },
  );
}
