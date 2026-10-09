<template>
  <q-page class="safic-main datos-condominio">
    <PaginaEncabezado miga="Configuración / Datos del condominio" titulo="Datos del condominio" />

    <div v-if="datos.isPending.value" class="datos-condominio__cargando" aria-busy="true">
      <q-skeleton type="rect" height="320px" class="datos-condominio__skeleton" />
    </div>

    <div v-else-if="datos.isError.value" class="safic-alerta" role="alert">
      {{ datos.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="datos.refetch()" />
    </div>

    <template v-else-if="datos.data.value">
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
        <DatosCondominioGeneral v-if="pestana === 'general'" :datos="datos.data.value" />
        <DatosCondominioUbicacion v-else-if="pestana === 'ubicacion'" :datos="datos.data.value" />
        <DatosCondominioApariencia v-else :datos="datos.data.value" />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import DatosCondominioApariencia from '../components/DatosCondominioApariencia.vue';
import DatosCondominioGeneral from '../components/DatosCondominioGeneral.vue';
import DatosCondominioUbicacion from '../components/DatosCondominioUbicacion.vue';
import { useDatosCondominio } from '../composables/useDatosCondominio';

type Pestana = 'general' | 'ubicacion' | 'apariencia';

const PESTANAS: { id: Pestana; titulo: string }[] = [
  { id: 'general', titulo: 'General' },
  { id: 'ubicacion', titulo: 'Ubicación' },
  { id: 'apariencia', titulo: 'Apariencia' },
];

const pestana = ref<Pestana>('general');
const datos = useDatosCondominio();
</script>

<style scoped>
.datos-condominio.safic-main {
  padding: 20px 32px;
  gap: 14px;
}

.datos-condominio :deep(.safic-titulo) {
  font-size: 26px;
}

.datos-condominio__skeleton {
  border-radius: 14px;
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
