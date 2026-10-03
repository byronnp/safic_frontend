<template>
  <q-page class="safic-main condominios">
    <PaginaEncabezado titulo="Condominios" subtitulo="Todos los clientes de la plataforma">
      <template #acciones>
        <label class="condominios__buscar">
          <q-icon name="sym_r_search" size="18px" class="condominios__buscar-icono" />
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar por nombre, código o RUC"
            aria-label="Buscar condominios"
          />
        </label>
        <q-btn
          v-if="session.tienePermisoPlataforma('plataforma.condominios')"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          label="Nuevo condominio"
          :to="{ name: 'plataforma-nuevo-condominio' }"
        />
      </template>
    </PaginaEncabezado>

    <div
      v-if="consulta.isError.value"
      class="safic-alerta row items-center"
      role="alert"
      style="gap: 12px"
    >
      <span class="col-grow">{{ consulta.error.value?.mensaje }}</span>
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div v-else-if="consulta.isLoading.value" class="condominios__grilla" aria-busy="true">
      <q-skeleton
        v-for="n in 6"
        :key="n"
        type="rect"
        height="190px"
        class="condominios__esqueleto"
      />
    </div>

    <template v-else-if="condominios.length">
      <div class="condominios__grilla">
        <CondominiosTarjeta v-for="c in condominios" :key="c.id" :condominio="c" />
      </div>
      <div v-if="paginacion && paginacion.last_page > 1" class="condominios__paginas">
        <q-pagination
          v-model="pagina"
          :max="paginacion.last_page"
          :max-pages="7"
          direction-links
          boundary-numbers
          color="primary"
        />
      </div>
    </template>

    <div v-else class="safic-card condominios__vacio">
      <q-icon :name="busquedaDiferida ? 'sym_r_search_off' : 'sym_r_location_city'" size="28px" />
      <div v-if="busquedaDiferida">
        No hay condominios que coincidan con «{{ busquedaDiferida }}».
      </div>
      <div v-else>Todavía no hay condominios. Crea el primero con «Nuevo condominio».</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import CondominiosTarjeta from '@/modules/plataforma/components/CondominiosTarjeta.vue';
import { useSessionStore } from '@/stores/session';
import { refDebounced } from '@/utils/debounce';

import { useCondominiosPlataforma } from '../composables/usePlataforma';

const session = useSessionStore();

const busqueda = ref('');
const busquedaDiferida = refDebounced(busqueda, 300);
const pagina = ref(1);

// Una búsqueda nueva vuelve a la primera página.
watch(busquedaDiferida, () => {
  pagina.value = 1;
});

const consulta = useCondominiosPlataforma(busquedaDiferida, pagina);
const condominios = computed(() => consulta.data.value?.condominios ?? []);
const paginacion = computed(() => consulta.data.value?.paginacion ?? null);
</script>

<style scoped>
.condominios.safic-main {
  padding: 32px 40px;
  gap: 22px;
}

.condominios :deep(.safic-titulo) {
  margin-top: 0;
}

.condominios__buscar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  width: 300px;
  max-width: 100%;
  padding: 0 12px;
  border: 1px solid var(--safic-borde-2);
  border-radius: 10px;
  background: #ffffff;
  box-sizing: border-box;
}

.condominios__buscar:focus-within {
  border-color: var(--q-primary);
}

.condominios__buscar-icono {
  color: var(--safic-texto-suave);
}

.condominios__buscar input {
  border: none;
  outline: none;
  font-size: 14px;
  flex-grow: 1;
  min-width: 0;
  background: transparent;
  font-family: inherit;
  color: var(--safic-texto);
}

.condominios__grilla {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.condominios__paginas {
  display: flex;
  justify-content: center;
}

.condominios__esqueleto {
  border-radius: 16px;
}

.condominios__vacio {
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--safic-texto-suave);
  font-size: 14px;
}

@media (max-width: 1100px) {
  .condominios__grilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .condominios.safic-main {
    padding: 20px 16px;
  }

  .condominios__grilla {
    grid-template-columns: minmax(0, 1fr);
  }

  .condominios__buscar {
    width: 100%;
  }
}
</style>
