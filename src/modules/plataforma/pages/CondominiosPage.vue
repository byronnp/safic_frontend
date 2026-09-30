<template>
  <q-page class="safic-main condominios">
    <PaginaEncabezado titulo="Condominios" subtitulo="Todos los clientes de la plataforma">
      <template #acciones>
        <label class="condominios__buscar">
          <q-icon name="sym_r_search" size="18px" class="condominios__buscar-icono" />
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar por nombre o RUC"
            aria-label="Buscar condominios"
          />
        </label>
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          label="Nuevo condominio"
          :to="{ name: 'plataforma-nuevo-condominio' }"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="filtrados.length" class="condominios__grilla">
      <CondominiosTarjeta v-for="c in filtrados" :key="c.id" :condominio="c" />
    </div>
    <div v-else class="safic-card condominios__vacio">
      <q-icon name="sym_r_search_off" size="28px" />
      <div>No hay condominios que coincidan con «{{ busqueda }}».</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import CondominiosTarjeta from '@/modules/plataforma/components/CondominiosTarjeta.vue';
import { CONDOMINIOS_PLATAFORMA } from '@/modules/plataforma/demo/condominios';

const busqueda = ref('');

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase();
  if (!texto) {
    return CONDOMINIOS_PLATAFORMA;
  }
  return CONDOMINIOS_PLATAFORMA.filter(
    (c) => c.nombre.toLowerCase().includes(texto) || c.ruc.includes(texto),
  );
});
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
