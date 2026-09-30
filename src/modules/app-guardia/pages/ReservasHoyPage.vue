<template>
  <div class="app-pagina">
    <AppEncabezado
      class="reservas-hoy-encabezado"
      :antetitulo="`${RESERVAS_HOY_TURNO.garita} · ${RESERVAS_HOY_TURNO.turno}`"
    >
      <template #titulo>
        <div class="reservas-hoy-titulo">
          <h1 class="reservas-hoy-titulo__texto">Reservas de hoy</h1>
          <div class="reservas-hoy-titulo__fecha">{{ RESERVAS_HOY_TURNO.fecha }}</div>
        </div>
      </template>
    </AppEncabezado>

    <div class="app-cuerpo reservas-hoy-cuerpo">
      <ReservasHoyTarjeta
        v-for="reserva in reservas"
        :key="reserva.id"
        :reserva="reserva"
        :abierta="abierta === reserva.id"
        @ingreso="registrarIngreso(reserva.id)"
        @abrir="abierta = reserva.id"
        @entregar="(danos) => confirmarEntrega(reserva.id, danos !== null)"
      />
      <div v-if="!reservas.length" class="reservas-hoy-vacio">No hay reservas para hoy.</div>
      <div class="reservas-hoy-nota">
        El guardia no recibe pagos: solo aparecen reservas pagadas o gratuitas.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import ReservasHoyTarjeta from '@/modules/app-guardia/components/ReservasHoyTarjeta.vue';
import type { ReservaHoy, ReservaHoyEstado } from '@/modules/app-guardia/demo/reservas-hoy';
import {
  RESERVAS_HOY,
  RESERVAS_HOY_ABIERTA,
  RESERVAS_HOY_TURNO,
} from '@/modules/app-guardia/demo/reservas-hoy';

const $q = useQuasar();

const reservas = ref<ReservaHoy[]>(RESERVAS_HOY.map((r) => ({ ...r })));
const abierta = ref<string>(RESERVAS_HOY_ABIERTA);

function cambiarEstado(id: string, estado: ReservaHoyEstado): void {
  reservas.value = reservas.value.map((r) => (r.id === id ? { ...r, estado } : r));
}

function registrarIngreso(id: string): void {
  cambiarEstado(id, 'en_uso');
  $q.notify({ type: 'positive', message: 'Ingreso registrado.' });
}

function confirmarEntrega(id: string, conDanos: boolean): void {
  cambiarEstado(id, 'finalizada');
  abierta.value = '';
  $q.notify({
    type: 'positive',
    message: conDanos
      ? 'Área recibida. Se envió el reporte de daños a la administración.'
      : 'Área recibida sin novedades.',
  });
}
</script>

<style scoped>
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
