<template>
  <div class="app-pagina avisos">
    <AppEncabezado :antetitulo="session.condominioActivo?.nombre ?? ''" titulo="Avisos" />

    <div class="app-cuerpo avisos__cuerpo">
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

      <section
        v-if="paquetesEnGarita.length > 0"
        class="app-tarjeta avisos__paquetes"
        aria-label="Paquetes en garita"
      >
        <h2 class="avisos__titulo">Paquetes en garita</h2>
        <div v-for="p in paquetesEnGarita" :key="p.id" class="avisos__paquete">
          <q-icon name="sym_r_inventory_2" size="20px" />
          <div>
            {{ tituloMiPaquete(p) }}
            <span class="avisos__fecha"
              >· llegó {{ diaMes(p.recibido_en)
              }}<template v-if="p.dias >= 7"> · {{ haceDias(p.dias) }}</template></span
            >
          </div>
        </div>
        <div class="avisos__fecha">
          Retíralo con firma; se entrega a ocupantes de tu unidad o a quien autorices.
        </div>
      </section>

      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="110px" aria-busy="true" />
      </template>
      <div v-else-if="avisos.length === 0" class="app-tarjeta avisos__vacio">
        <q-icon name="sym_r_notifications" size="36px" class="text-suave" />
        <div>No hay avisos de la administración por ahora.</div>
      </div>

      <article
        v-for="a in avisos"
        :key="a.id"
        class="app-tarjeta avisos__aviso"
        :class="{ 'avisos__aviso--fijado': a.fijado, 'avisos__aviso--nuevo': !a.leido }"
      >
        <div class="avisos__meta">
          <span v-if="a.fijado" class="avisos__chip">Fijado</span>
          <span v-if="!a.leido" class="avisos__chip avisos__chip--nuevo">Nuevo</span>
          <span class="avisos__fecha">Administración · {{ diaMes(a.publicado_en) }}</span>
        </div>
        <h2 class="avisos__titulo">{{ a.titulo }}</h2>
        <p class="avisos__mensaje">{{ a.mensaje }}</p>
        <a
          v-if="urlSegura(a.adjunto_url)"
          :href="urlSegura(a.adjunto_url) ?? undefined"
          target="_blank"
          rel="noopener noreferrer"
          class="avisos__adjunto"
        >
          <q-icon name="sym_r_attach_file" size="18px" />{{ a.adjunto_nombre ?? 'Adjunto' }}
        </a>

        <div class="avisos__acciones">
          <button
            v-if="a.requiere_confirmacion && !a.confirmado"
            type="button"
            class="avisos__confirmar"
            :disabled="ocupado"
            @click="confirmar(a)"
          >
            <q-icon name="sym_r_done_all" size="20px" />Confirmar lectura
          </button>
          <span v-else-if="a.requiere_confirmacion" class="avisos__hecho">
            <q-icon name="sym_r_done_all" size="18px" />Lectura confirmada
          </span>
          <button
            v-else-if="!a.leido"
            type="button"
            class="avisos__leer"
            :disabled="ocupado"
            @click="leer(a)"
          >
            Marcar como leído
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { diaMes, urlSegura } from '@/modules/comunicacion/anuncios.logica';
import {
  useConfirmarAviso,
  useLeerAviso,
  useMisAvisos,
} from '@/modules/comunicacion/composables/useAnuncios';
import type { Aviso } from '@/modules/comunicacion/services/anuncios.service';
import { useMisPaquetes } from '@/modules/garita/composables/usePaquetes';
import { haceDias, tituloMiPaquete } from '@/modules/garita/paquetes.logica';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();
const consulta = useMisAvisos();
const leyendo = useLeerAviso();
const confirmando = useConfirmarAviso();

const paquetes = useMisPaquetes(computed(() => session.tienePermiso('paquetes.propios')));
const paquetesEnGarita = computed(() => paquetes.data.value?.en_garita ?? []);
const avisos = computed(() => consulta.data.value?.avisos ?? []);
const ocupado = computed(() => leyendo.isPending.value || confirmando.isPending.value);
const errorAccion = ref<string | null>(null);

watch(
  () => session.condominioId,
  () => (errorAccion.value = null),
);

function fallar(error: unknown): void {
  const apiError = aApiError(error);
  // Un aviso que venció o ya no existe: la lista se vuelve a pedir y desaparece
  if (apiError.codigo === 'ANUNCIO_EXPIRADO' || apiError.estado === 404) void consulta.refetch();
  errorAccion.value = apiError.mensaje;
}

function leer(a: Aviso): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  leyendo.mutate(a.id, { onError: fallar });
}

function confirmar(a: Aviso): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  confirmando.mutate(a.id, { onError: fallar });
}
</script>

<style scoped>
.avisos__paquetes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avisos__paquete {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.avisos__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.avisos__aviso {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avisos__aviso--fijado {
  border: 2px solid var(--q-primary);
}

.avisos__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.avisos__chip {
  padding: 2px 8px;
  border-radius: 999px;
  background: #e3efec;
  color: #0b4a47;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.avisos__chip--nuevo {
  background: #fff1dc;
  color: #8a3f0a;
}

.avisos__fecha {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.avisos__titulo {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.3;
}

.avisos__mensaje {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-line;
}

.avisos__adjunto {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: var(--q-primary);
  font-weight: 700;
  font-size: 14px;
}

.avisos__acciones {
  display: flex;
  gap: 8px;
}

.avisos__confirmar,
.avisos__leer {
  min-height: 48px;
  padding: 0 18px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.avisos__confirmar {
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.avisos__leer {
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
}

.avisos__confirmar:disabled,
.avisos__leer:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.avisos__hecho {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: #0b4a47;
  font-weight: 700;
  font-size: 14px;
}

.avisos__vacio {
  padding: 28px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
