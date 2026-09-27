<template>
  <nav :aria-label="etiqueta" class="menu" :class="`menu--${tono}`">
    <template v-for="item in items" :key="item.id">
      <!-- Grupo siempre desplegado (CONFIGURACIÓN, ACCESO) o módulo de la pantalla actual -->
      <template v-if="item.hijos?.length && (item.seccion || contieneActual(item))">
        <div class="menu__seccion">{{ item.etiqueta }}</div>
        <EnlaceMenu
          v-for="hijo in item.hijos"
          :key="hijo.id"
          :item="hijo"
          :activo="esActual(hijo)"
        />
      </template>

      <!-- Módulo cerrado: un solo enlace a su primera pantalla -->
      <EnlaceMenu v-else-if="item.hijos?.length" :item="enlaceModulo(item)" :activo="false" />

      <EnlaceMenu v-else-if="item.ruta" :item="item" :activo="esActual(item)" />
    </template>

    <div class="col-grow" />
    <slot name="pie" />
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

import type { ItemMenu } from '@/core/navigation/menu';

import EnlaceMenu from './EnlaceMenu.vue';

withDefaults(
  defineProps<{ items: ItemMenu[]; tono?: 'condominio' | 'plataforma'; etiqueta?: string }>(),
  { tono: 'condominio', etiqueta: 'Menú principal' },
);

const route = useRoute();

/** Nombre de la ruta que se marca activa (las pantallas de detalle apuntan a su lista). */
function rutaActual(): string | undefined {
  return route.meta.menuActivo ?? (typeof route.name === 'string' ? route.name : undefined);
}

function esActual(item: ItemMenu): boolean {
  return item.ruta !== undefined && item.ruta === rutaActual();
}

/** Módulo cerrado: se muestra como enlace a su primera pantalla. */
function enlaceModulo(item: ItemMenu): ItemMenu {
  const primera = item.hijos?.[0]?.ruta;
  return primera ? { ...item, ruta: primera } : item;
}

function contieneActual(item: ItemMenu): boolean {
  return (item.hijos ?? []).some((hijo) => esActual(hijo));
}
</script>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 14px 20px;
}

.menu--condominio {
  --menu-texto: var(--safic-menu-texto);
  --menu-activo: var(--safic-tinta-2);
  --menu-seccion: var(--safic-menu-seccion);
}

.menu--plataforma {
  --menu-texto: #bdb8ac;
  --menu-activo: #34322d;
  --menu-seccion: #8a857a;
}

.menu__seccion {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 14px 12px 6px;
  color: var(--menu-seccion);
}
</style>
