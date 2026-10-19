<template>
  <div class="app-pagina mis-reservas">
    <AppEncabezado
      :antetitulo="session.condominioActivo?.nombre ?? ''"
      titulo="Mis reservas"
      :volver="{ name: 'app-areas' }"
    />

    <div class="app-cuerpo mis-reservas__cuerpo">
      <div v-if="resultado" class="mis-reservas__resultado" role="status">{{ resultado }}</div>
      <div v-if="errorCancelar" class="safic-alerta" role="alert">{{ errorCancelar }}</div>

      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>

      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="96px" aria-busy="true" />
      </template>

      <div
        v-else-if="(consulta.data.value ?? []).length === 0"
        class="app-tarjeta mis-reservas__vacio"
      >
        <q-icon name="sym_r_event_available" size="36px" class="text-suave" />
        <div>Aún no tienes reservas.</div>
        <router-link :to="{ name: 'app-areas' }" class="mis-reservas__enlace">
          Ver áreas comunes
        </router-link>
      </div>

      <template v-else>
        <template v-if="grupos.proximas.length">
          <h2 class="mis-reservas__titulo">Próximas</h2>
          <div v-for="r in grupos.proximas" :key="r.id" class="app-tarjeta mis-reservas__reserva">
            <div class="mis-reservas__fila">
              <div class="col-grow">
                <div class="mis-reservas__area">{{ r.area }}</div>
                <div class="mis-reservas__cuando">{{ cuando(r) }} · {{ r.unidad }}</div>
              </div>
              <EstadoBadge :tono="estadoDeReserva(r).tono">{{
                estadoDeReserva(r).texto
              }}</EstadoBadge>
            </div>
            <div v-if="r.estado === 'pendiente'" class="mis-reservas__nota">
              La administración responde en 48 horas.
            </div>
            <div v-if="debeAlgo(r.por_pagar) && r.pagar_antes_de" class="mis-reservas__nota">
              Paga {{ formatoMoneda(r.por_pagar) }} antes del {{ limiteDePago(r.pagar_antes_de) }} o
              se cancela sola.
            </div>
            <div v-if="debeAlgo(r.por_pagar) || r.puede_cancelar" class="mis-reservas__acciones">
              <router-link
                v-if="debeAlgo(r.por_pagar)"
                :to="{ name: 'app-mi-cuenta' }"
                class="mis-reservas__pagar"
              >
                Pagar
              </router-link>
              <button
                type="button"
                class="mis-reservas__cancelar"
                :disabled="cancelar.isPending.value"
                @click="pedirCancelacion(r)"
              >
                Cancelar
              </button>
            </div>
          </div>
        </template>

        <template v-if="grupos.historial.length">
          <h2 class="mis-reservas__titulo">Historial</h2>
          <div class="app-tarjeta">
            <div
              v-for="r in grupos.historial"
              :key="r.id"
              class="mis-reservas__fila mis-reservas__fila--historial"
            >
              <div class="col-grow">
                <div class="mis-reservas__area">{{ r.area }}</div>
                <div class="mis-reservas__cuando">{{ cuando(r) }}</div>
                <div v-if="r.motivo" class="mis-reservas__cuando">{{ r.motivo }}</div>
                <div v-if="textoGarantiaResidente(r)" class="mis-reservas__cuando">
                  {{ textoGarantiaResidente(r) }}
                </div>
              </div>
              <EstadoBadge :tono="estadoDeReserva(r).tono">{{
                estadoDeReserva(r).texto
              }}</EstadoBadge>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import { aApiError } from '@/core/api/errors';
import { useCancelarReserva, useMisReservas } from '@/modules/reservas/composables/useReservas';
import { textoGarantiaResidente } from '@/modules/reservas/garantias.logica';
import {
  cuando,
  debeAlgo,
  estadoDeReserva,
  limiteDePago,
  separarReservas,
} from '@/modules/reservas/reservas.logica';
import type { MiReserva } from '@/modules/reservas/services/reservas.service';
import { useSessionStore } from '@/stores/session';
import { formatoMoneda } from '@/utils/formato';

const $q = useQuasar();
const session = useSessionStore();
const consulta = useMisReservas();
const cancelar = useCancelarReserva();
const grupos = computed(() => separarReservas(consulta.data.value ?? []));

const resultado = ref<string | null>(null);
const errorCancelar = ref<string | null>(null);

watch(
  () => session.condominioId,
  () => {
    resultado.value = null;
    errorCancelar.value = null;
  },
);

function pedirCancelacion(r: MiReserva): void {
  if (cancelar.isPending.value) return;
  $q.dialog({
    title: 'Cancelar reserva',
    message: `¿Cancelar ${r.area} del ${cuando(r)}? El horario quedará libre para otros vecinos.`,
    cancel: { label: 'Mantenerla', flat: true, noCaps: true },
    ok: { label: 'Cancelar reserva', unelevated: true, noCaps: true, color: 'negative' },
    persistent: true,
  }).onOk(() => {
    resultado.value = null;
    errorCancelar.value = null;
    cancelar.mutate(
      { id: r.id, motivo: null },
      {
        onSuccess: () => (resultado.value = `Reserva de ${r.area} cancelada.`),
        onError: (error) => {
          const apiError = aApiError(error);
          // Sin respuesta o 5xx pudo cancelarse: la lista se vuelve a pedir y se avisa
          errorCancelar.value =
            apiError.estado === 0 || apiError.estado >= 500
              ? `${apiError.mensaje} Revisa tus reservas antes de reintentar: pudo cancelarse.`
              : apiError.mensaje;
        },
      },
    );
  });
}
</script>

<style scoped>
.mis-reservas__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mis-reservas__resultado {
  padding: 12px 14px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
  font-size: 14px;
}

.mis-reservas__titulo {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.mis-reservas__reserva {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mis-reservas__fila {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mis-reservas__fila--historial {
  padding: 12px 14px;
  border-top: 1px solid var(--safic-borde);
}

.mis-reservas__fila--historial:first-child {
  border-top: none;
}

.mis-reservas__area {
  font-size: 15px;
  font-weight: 800;
}

.mis-reservas__cuando {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.mis-reservas__nota {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.mis-reservas__acciones {
  display: flex;
  gap: 8px;
}

.mis-reservas__pagar {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 10px;
  background: var(--q-primary);
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  text-decoration: none;
}

.mis-reservas__cancelar {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: #b3261e;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
}

.mis-reservas__cancelar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mis-reservas__vacio {
  padding: 28px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mis-reservas__enlace {
  color: var(--q-primary);
  font-weight: 700;
}
</style>
