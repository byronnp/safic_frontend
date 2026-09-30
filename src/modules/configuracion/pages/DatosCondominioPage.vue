<template>
  <q-page class="safic-main datos-condominio">
    <PaginaEncabezado miga="Configuración / Datos del condominio" titulo="Datos del condominio" />

    <div class="safic-pestanas" role="tablist" aria-label="Secciones">
      <button
        v-for="p in PESTANAS"
        :id="`pestana-${p.id}`"
        :key="p.id"
        type="button"
        role="tab"
        class="safic-pestana"
        :class="{ 'safic-pestana--activa': pestana === p.id }"
        :aria-selected="pestana === p.id"
        :aria-controls="`panel-${p.id}`"
        @click="pestana = p.id"
      >
        {{ p.titulo }}
      </button>
    </div>

    <div
      :id="`panel-${pestana}`"
      class="datos-condominio__panel"
      role="tabpanel"
      :aria-labelledby="`pestana-${pestana}`"
    >
      <DatosCondominioGeneral v-if="pestana === 'general'" />
      <DatosCondominioUbicacion v-else-if="pestana === 'ubicacion'" />
      <DatosCondominioApariencia v-else />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import DatosCondominioApariencia from '../components/DatosCondominioApariencia.vue';
import DatosCondominioGeneral from '../components/DatosCondominioGeneral.vue';
import DatosCondominioUbicacion from '../components/DatosCondominioUbicacion.vue';

type Pestana = 'general' | 'ubicacion' | 'apariencia';

const PESTANAS: { id: Pestana; titulo: string }[] = [
  { id: 'general', titulo: 'General' },
  { id: 'ubicacion', titulo: 'Ubicación' },
  { id: 'apariencia', titulo: 'Apariencia' },
];

const pestana = ref<Pestana>('apariencia');
</script>

<style scoped>
.datos-condominio.safic-main {
  padding: 20px 32px;
  gap: 14px;
}

.datos-condominio :deep(.safic-titulo) {
  font-size: 26px;
}

.datos-condominio__panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@media (max-width: 599px) {
  .datos-condominio.safic-main {
    padding: 20px 16px;
  }
}
</style>
