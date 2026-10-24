<template>
  <q-page class="safic-main asambleas">
    <PaginaEncabezado miga="Asambleas" titulo="Asambleas">
      <template #acciones>
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          icon="sym_r_add"
          label="Nueva asamblea"
          :to="{ name: 'asambleas-nueva' }"
        />
      </template>
    </PaginaEncabezado>

    <div class="asambleas__filtro">
      <label for="asm-estado" class="asambleas__etiqueta">Estado</label>
      <q-select
        v-model="estado"
        for="asm-estado"
        class="safic-input asambleas__select"
        outlined
        dense
        emit-value
        map-options
        hide-bottom-space
        :options="opcionesEstado"
      />
    </div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div class="asambleas__lista" :aria-busy="consulta.isPending.value">
      <template v-if="consulta.isPending.value">
        <q-skeleton v-for="n in 3" :key="n" type="rect" height="76px" class="q-mb-sm" />
      </template>

      <div v-else-if="lista.length === 0" class="asambleas__vacio">
        <q-icon name="sym_r_how_to_vote" size="36px" class="text-suave" />
        <div>
          {{
            estado === null
              ? 'Todavía no hay asambleas. Crea la primera para preparar su orden del día.'
              : 'No hay asambleas con ese estado.'
          }}
        </div>
      </div>

      <router-link
        v-for="a in lista"
        :key="a.id"
        :to="{ name: 'asambleas-editar', params: { id: a.id } }"
        class="asambleas__fila"
      >
        <div class="asambleas__principal">
          <div class="asambleas__titulo">{{ a.titulo }}</div>
          <div class="asambleas__meta">
            {{ nombreTipo(a.tipo) }} · {{ fechaHoraLarga(a.fecha_hora) }} · {{ a.puntos }}
            {{ a.puntos === 1 ? 'punto' : 'puntos' }}
          </div>
        </div>
        <EstadoBadge :tono="ESTADOS[a.estado].tono" :texto="ESTADOS[a.estado].nombre" />
        <q-icon name="sym_r_chevron_right" size="20px" class="text-suave" />
      </router-link>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';

import { ESTADOS, fechaHoraLarga, nombreTipo } from '../asambleas.logica';
import { useAsambleas } from '../composables/useAsambleas';
import type { EstadoAsamblea } from '../services/asambleas.service';

const estado = ref<EstadoAsamblea | null>(null);
const consulta = useAsambleas(estado);
const lista = computed(() => consulta.data.value ?? []);

const opcionesEstado = [
  { label: 'Todas', value: null },
  ...(Object.keys(ESTADOS) as EstadoAsamblea[]).map((valor) => ({
    label: ESTADOS[valor].nombre,
    value: valor,
  })),
];
</script>

<style scoped>
.asambleas__filtro {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asambleas__etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.asambleas__select {
  min-width: 200px;
}

.asambleas__lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asambleas__fila {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  color: inherit;
  text-decoration: none;
}

.asambleas__fila:hover {
  border-color: var(--safic-borde-2);
}

.asambleas__principal {
  flex-grow: 1;
  min-width: 0;
}

.asambleas__titulo {
  font-weight: 800;
  font-size: 15px;
}

.asambleas__meta {
  margin-top: 2px;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.asambleas__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px 16px;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  text-align: center;
}
</style>
