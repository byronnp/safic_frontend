<template>
  <div v-if="route.meta.vistaPrevia" class="aviso" :class="{ 'aviso--arriba': salir }" role="note">
    <q-icon :name="ICONOS.vistaPrevia" size="16px" />
    Vista previa · datos de ejemplo
    <router-link v-if="salir" :to="{ name: 'inicio' }" class="aviso__salir">Salir</router-link>
    <q-tooltip max-width="260px">
      Esta pantalla sigue el diseño aprobado pero todavía no está conectada a la API. Solo se ve en
      desarrollo.
    </q-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

import { ICONOS } from '@/core/navigation/icons';

defineProps<{ salir?: boolean }>();

const route = useRoute();
</script>

<style scoped>
.aviso {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 3000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #1c1b18;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  opacity: 0.85;
  pointer-events: auto;
}
.aviso--arriba {
  top: 12px;
  bottom: auto;
}

.aviso__salir {
  color: var(--q-accent);
  margin-left: 4px;
}
</style>
