<template>
  <router-link v-if="item.ruta" #default="{ href, navigate }" :to="{ name: item.ruta }" custom>
    <a
      :href="href"
      class="enlace"
      :class="{ 'enlace--activo': activo }"
      :aria-current="activo ? 'page' : undefined"
      @click="navigate"
    >
      <q-icon :name="item.icono" size="20px" class="enlace__icono" />
      <span class="col-grow">{{ item.etiqueta }}</span>
      <span v-if="item.insignia" class="enlace__insignia">{{ item.insignia }}</span>
    </a>
  </router-link>
</template>

<script setup lang="ts">
import type { ItemMenu } from '@/core/navigation/menu';

defineProps<{ item: ItemMenu; activo: boolean }>();
</script>

<style scoped>
.enlace {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 9px;
  color: var(--menu-texto);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.15s;
}

.enlace:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.enlace--activo,
.enlace--activo:hover {
  background: var(--menu-activo);
  color: #ffffff;
  font-weight: 700;
}

/* Ícono relleno en el ítem activo, como en los mockups */
.enlace--activo .enlace__icono {
  font-variation-settings:
    'FILL' 1,
    'wght' 500;
}

.enlace:focus-visible {
  outline: 2px solid var(--q-accent);
  outline-offset: 2px;
}

.enlace__insignia {
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--q-accent);
  color: var(--safic-tinta);
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
