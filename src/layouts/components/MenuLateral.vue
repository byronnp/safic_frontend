<template>
  <q-list class="safic-menu" padding>
    <template v-for="item in items" :key="item.id">
      <q-expansion-item
        v-if="item.hijos?.length"
        :icon="item.icono"
        :label="item.etiqueta"
        :default-opened="contieneRutaActual(item)"
        expand-separator
      >
        <q-item
          v-for="hijo in item.hijos"
          :key="hijo.id"
          :to="hijo.ruta ? { name: hijo.ruta } : undefined"
          clickable
          :inset-level="0.3"
        >
          <q-item-section avatar><q-icon :name="hijo.icono" /></q-item-section>
          <q-item-section>{{ hijo.etiqueta }}</q-item-section>
        </q-item>
      </q-expansion-item>

      <q-item v-else :to="item.ruta ? { name: item.ruta } : undefined" clickable exact>
        <q-item-section avatar><q-icon :name="item.icono" /></q-item-section>
        <q-item-section>{{ item.etiqueta }}</q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

import type { ItemMenu } from '@/core/navigation/menu';

defineProps<{ items: ItemMenu[] }>();

const route = useRoute();

function contieneRutaActual(item: ItemMenu): boolean {
  return (item.hijos ?? []).some((hijo) => hijo.ruta === route.name);
}
</script>
