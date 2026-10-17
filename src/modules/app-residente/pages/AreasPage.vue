<template>
  <div class="app-pagina areas-res">
    <AppEncabezado :antetitulo="session.condominioActivo?.nombre ?? ''" titulo="Áreas comunes">
      <template #derecha>
        <router-link :to="{ name: 'app-mis-reservas' }" class="areas-res__mias">
          Mis reservas
        </router-link>
      </template>
    </AppEncabezado>

    <div class="app-cuerpo areas-res__cuerpo">
      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>

      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 4" :key="i" type="rect" height="88px" aria-busy="true" />
      </template>

      <div v-else-if="areas.length === 0" class="app-tarjeta areas-res__vacio">
        <q-icon name="sym_r_event_available" size="36px" class="text-suave" />
        <div>Por ahora no hay áreas comunes habilitadas para reservar.</div>
      </div>

      <template v-else>
        <div v-for="a in areas" :key="a.id" class="app-tarjeta areas-res__area">
          <div class="areas-res__icono" aria-hidden="true">
            <q-icon :name="iconoDeArea(a.nombre)" size="26px" />
          </div>
          <div class="col-grow">
            <div class="areas-res__nombre">{{ a.nombre }}</div>
            <div class="areas-res__detalle">{{ resumenAreaResidente(a) }}</div>
            <EstadoBadge :tono="a.estado === 'mantenimiento' ? 'alerta' : 'info'">{{
              a.estado === 'mantenimiento'
                ? a.mantenimiento_hasta
                  ? `En mantenimiento hasta el ${fechaCorta(a.mantenimiento_hasta)}`
                  : 'En mantenimiento'
                : textoAprobacion(a)
            }}</EstadoBadge>
          </div>
          <router-link
            v-if="a.estado === 'disponible'"
            :to="{ name: 'app-reservar', query: { area: a.id } }"
            class="areas-res__reservar"
          >
            Reservar
          </router-link>
          <span
            v-else
            class="areas-res__reservar areas-res__reservar--apagado"
            aria-disabled="true"
          >
            Reservar
          </span>
        </div>
        <div class="areas-res__nota">
          Los costos y la garantía se agregan a tu estado de cuenta al confirmarse la reserva.
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import { useSessionStore } from '@/stores/session';
import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { useAreasReservables } from '@/modules/reservas/composables/useReservas';
import {
  fechaCorta,
  iconoDeArea,
  resumenAreaResidente,
  textoAprobacion,
} from '@/modules/reservas/reservas.logica';

const session = useSessionStore();
const consulta = useAreasReservables();
const areas = computed(() => consulta.data.value?.areas ?? []);
</script>

<style scoped>
.areas-res__mias {
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  text-decoration: underline;
}

.areas-res__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.areas-res__area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
}

.areas-res__icono {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e3efec;
  color: #0b4a47;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.areas-res__nombre {
  font-size: 16px;
  font-weight: 800;
}

.areas-res__detalle {
  font-size: 13px;
  color: var(--safic-texto-suave);
  margin: 2px 0 6px;
}

.areas-res__reservar {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  background: var(--q-primary);
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  text-decoration: none;
}

.areas-res__reservar--apagado {
  background: #e4e1d8;
  color: #6b675d;
}

.areas-res__vacio {
  padding: 28px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.areas-res__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}
</style>
