<template>
  <q-page padding>
    <div class="safic-page q-gutter-y-md">
      <div class="row items-center justify-between q-gutter-sm">
        <div>
          <h1 class="safic-titulo">Bloques</h1>
          <p class="text-suave q-mt-xs q-mb-none">
            Torres, bloques o etapas en que se organizan las unidades.
          </p>
        </div>
        <q-btn
          v-if="puedeEditar"
          color="primary"
          unelevated
          no-caps
          :icon="ICONOS.agregar"
          label="Nuevo bloque"
          @click="abrirNuevo"
        />
      </div>

      <q-card flat class="safic-card">
        <q-banner v-if="bloques.isError.value" class="bg-red-1 text-negative" rounded>
          {{ bloques.error.value?.mensaje }}
          <template #action>
            <q-btn flat no-caps label="Reintentar" @click="bloques.refetch()" />
          </template>
        </q-banner>

        <q-table
          v-else
          flat
          :rows="bloques.data.value ?? []"
          :columns="columnas"
          row-key="id"
          :loading="bloques.isLoading.value"
          :filter="filtro"
          :rows-per-page-options="[10, 25, 50, 0]"
          no-data-label="Todavía no hay bloques registrados."
          no-results-label="Ningún bloque coincide con la búsqueda."
          loading-label="Cargando…"
          rows-per-page-label="Filas por página"
        >
          <template #top-right>
            <q-input v-model="filtro" dense outlined debounce="250" placeholder="Buscar">
              <template #prepend><q-icon :name="ICONOS.buscar" /></template>
            </q-input>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar, type QTableColumn } from 'quasar';
import { computed, ref } from 'vue';

import { ICONOS } from '@/core/navigation/icons';
import { useSessionStore } from '@/stores/session';

import BloqueDialog from '../components/BloqueDialog.vue';
import { useBloques } from '../composables/useBloques';
import type { Bloque } from '../services/bloques.service';

const $q = useQuasar();
const session = useSessionStore();

const bloques = useBloques();
const filtro = ref('');

// Mostrar el botón es comodidad; la API exige unidades.editar de todas formas.
const puedeEditar = computed(() => session.tienePermiso('unidades.editar'));

const columnas: QTableColumn<Bloque>[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'orden', label: 'Orden', field: 'orden', align: 'right', sortable: true },
];

function abrirNuevo(): void {
  $q.dialog({ component: BloqueDialog }).onOk((bloque: Bloque) => {
    $q.notify({ type: 'positive', message: `Bloque «${bloque.nombre}» creado.` });
  });
}
</script>
