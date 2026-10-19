<template>
  <div class="app-pagina">
    <AppEncabezado
      class="reservas-hoy-encabezado"
      :antetitulo="session.condominioActivo?.nombre ?? ''"
    >
      <template #titulo>
        <div class="reservas-hoy-titulo">
          <h1 class="reservas-hoy-titulo__texto">Reservas de hoy</h1>
          <div v-if="consulta.data.value" class="reservas-hoy-titulo__fecha">
            {{ fechaCorta(consulta.data.value.fecha) }}
          </div>
        </div>
      </template>
    </AppEncabezado>

    <div class="app-cuerpo reservas-hoy-cuerpo">
      <div v-if="mensaje" class="reservas-hoy-resultado" role="status">{{ mensaje }}</div>
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>

      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="96px" aria-busy="true" />
      </template>

      <template v-else>
        <ReservasHoyTarjeta
          v-for="reserva in reservas"
          :key="reserva.id"
          :reserva="reserva"
          :abierta="abierta === reserva.id"
          :ocupado="ocupado"
          @ingreso="registrarIngreso(reserva)"
          @abrir="abierta = reserva.id"
          @entregar="(danos, fotos) => confirmarEntrega(reserva, danos, fotos)"
        />
        <div v-if="!reservas.length" class="reservas-hoy-vacio">No hay reservas para hoy.</div>
      </template>
      <div class="reservas-hoy-nota">
        El guardia no recibe pagos: solo aparecen reservas pagadas o gratuitas.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { fechaCorta } from '@/modules/reservas/reservas.logica';
import { useSessionStore } from '@/stores/session';

import ReservasHoyTarjeta from '../components/ReservasHoyTarjeta.vue';
import { useRecibirArea, useRegistrarIngreso, useReservasHoy } from '../composables/useReservasHoy';
import type { ReservaHoy } from '../services/reservas-hoy.service';

const CONFLICTOS = [
  'RESERVA_NO_CONFIRMADA',
  'RESERVA_NO_EN_USO',
  'RESERVA_SIN_PAGAR',
  'RESERVA_NO_ES_DE_HOY',
  'UNIDAD_RESTRINGIDA',
];

const session = useSessionStore();
const consulta = useReservasHoy();
const ingreso = useRegistrarIngreso();
const entrega = useRecibirArea();

const reservas = computed(() => consulta.data.value?.reservas ?? []);
const abierta = ref<number | null>(null);
const mensaje = ref<string | null>(null);
const errorAccion = ref<string | null>(null);
const ocupado = computed(() => ingreso.isPending.value || entrega.isPending.value);

// Otro condominio: nada de lo abierto ni avisado queda
watch(
  () => session.condominioId,
  () => {
    abierta.value = null;
    mensaje.value = null;
    errorAccion.value = null;
  },
);

function fallar(error: unknown): void {
  mensaje.value = null;
  const apiError = aApiError(error);
  // Un conflicto de estado (otra persona ya lo cambió, quedó restringida, falta pago): se cierra el panel y se vuelve a leer la lista
  if (CONFLICTOS.includes(apiError.codigo)) {
    abierta.value = null;
    void consulta.refetch();
  }
  // Sin respuesta o 5xx el cambio pudo hacerse: se avisa para no repetirlo a ciegas
  errorAccion.value =
    apiError.estado === 0 || apiError.estado >= 500
      ? `${apiError.mensaje} Revisa la lista antes de reintentar: el cambio pudo hacerse.`
      : apiError.mensaje;
}

function registrarIngreso(r: ReservaHoy): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  ingreso.mutate(r.id, {
    onSuccess: () => (mensaje.value = `Ingreso registrado: ${r.area}, ${r.unidad}.`),
    onError: fallar,
  });
}

function confirmarEntrega(r: ReservaHoy, danos: string | null, fotos: File[]): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  entrega.mutate(
    { id: r.id, danos, fotos },
    {
      onSuccess: () => {
        abierta.value = null;
        mensaje.value =
          danos === null
            ? 'Área recibida sin novedades.'
            : 'Área recibida. Se envió el reporte de daños a la administración.';
      },
      onError: fallar,
    },
  );
}
</script>

<style scoped>
.reservas-hoy-resultado {
  padding: 12px 14px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
  font-size: 14px;
}

.app-encabezado.reservas-hoy-encabezado {
  padding: 22px 16px 18px;
}

.reservas-hoy-titulo {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.reservas-hoy-titulo__texto {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: normal;
  flex-grow: 1;
}

.reservas-hoy-titulo__fecha {
  font-size: 13px;
  color: #d6e3e0;
  font-weight: 600;
}

.app-cuerpo.reservas-hoy-cuerpo {
  padding: 14px 16px;
  gap: 10px;
}

.reservas-hoy-vacio {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 14px;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.reservas-hoy-nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
  padding: 0 4px;
}
</style>
