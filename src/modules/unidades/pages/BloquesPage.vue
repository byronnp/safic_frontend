<template>
  <q-page class="safic-main">
    <div class="safic-encabezado">
      <div class="safic-encabezado__textos">
        <div class="safic-miga">Inicio / Unidades</div>
        <h1 class="safic-titulo">Bloques</h1>
      </div>
      <q-btn
        v-if="puedeEditar"
        color="primary"
        unelevated
        no-caps
        class="safic-btn"
        :icon="ICONOS.agregar"
        label="Nuevo bloque"
        @click="abrirNuevo"
      />
    </div>

    <section class="safic-tabla-seccion">
      <div class="safic-tabla-barra">
        <q-input
          v-model="filtro"
          class="safic-input safic-tabla-barra__buscar"
          outlined
          dense
          debounce="250"
          placeholder="Buscar bloque"
          aria-label="Buscar bloques"
        >
          <template #prepend><q-icon :name="ICONOS.buscar" size="18px" /></template>
        </q-input>
        <div class="safic-tabla-barra__conteo">{{ conteo }}</div>
      </div>

      <div v-if="bloques.isError.value" class="q-pa-lg">
        <div class="safic-alerta row items-center" role="alert" style="gap: 12px">
          <span class="col-grow">{{ bloques.error.value?.mensaje }}</span>
          <q-btn flat no-caps dense label="Reintentar" @click="bloques.refetch()" />
        </div>
      </div>

      <q-table
        v-else
        v-model:pagination="paginacion"
        class="safic-tabla"
        flat
        :rows="bloques.data.value ?? []"
        :columns="columnas"
        row-key="id"
        :loading="bloques.isLoading.value"
        :filter="filtro"
        :rows-per-page-options="[10, 25, 50, 0]"
        rows-per-page-label="Filas por página"
        loading-label="Cargando…"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.value }}</q-td>
        </template>

        <template #no-data>
          <div class="full-width column items-center q-py-xl" style="gap: 12px">
            <q-icon :name="ICONOS.bloques" size="40px" class="text-suave" />
            <div class="text-weight-bold" style="font-size: 16px">
              {{ filtro ? 'Ningún bloque coincide con la búsqueda.' : 'Todavía no hay bloques.' }}
            </div>
            <div v-if="!filtro" class="text-suave" style="font-size: 14px">
              Crea las torres, bloques o etapas del condominio para organizar sus unidades.
            </div>
            <q-btn
              v-if="!filtro && puedeEditar"
              color="primary"
              unelevated
              no-caps
              class="safic-btn q-mt-sm"
              :icon="ICONOS.agregar"
              label="Crear primer bloque"
              @click="abrirNuevo"
            />
          </div>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar, type QTableColumn, type QTableProps } from 'quasar';
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
const paginacion = ref<NonNullable<QTableProps['pagination']>>({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'orden',
  descending: false,
});

// Mostrar el botón es comodidad; la API exige unidades.editar de todas formas.
const puedeEditar = computed(() => session.tienePermiso('unidades.editar'));

const columnas: QTableColumn<Bloque>[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'orden', label: 'Orden', field: 'orden', align: 'right', sortable: true },
];

/** "Mostrando 1–10 de 24", como en el mockup. */
const conteo = computed(() => {
  const lista = bloques.data.value ?? [];
  const texto = filtro.value.trim().toLowerCase();
  const total = texto
    ? lista.filter((b) => b.nombre.toLowerCase().includes(texto)).length
    : lista.length;
  if (total === 0) {
    return '';
  }
  const porPagina = paginacion.value.rowsPerPage || total;
  const desde = ((paginacion.value.page ?? 1) - 1) * porPagina + 1;
  const hasta = Math.min(desde + porPagina - 1, total);
  return `Mostrando ${desde}–${hasta} de ${total}`;
});

function abrirNuevo(): void {
  $q.dialog({ component: BloqueDialog }).onOk((bloque: Bloque) => {
    $q.notify({ type: 'positive', message: `Bloque «${bloque.nombre}» creado.` });
  });
}
</script>
