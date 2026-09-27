<template>
  <q-page class="safic-main">
    <div class="safic-encabezado">
      <div class="safic-encabezado__textos">
        <div class="safic-miga">{{ session.condominioActivo?.nombre }}</div>
        <h1 class="safic-titulo">Hola, {{ primerNombre }}</h1>
      </div>
    </div>

    <div v-if="accesos.length" class="safic-indicadores">
      <button
        v-for="acceso in accesos"
        :key="acceso.id"
        type="button"
        class="safic-indicador acceso"
        @click="ir(acceso.ruta)"
      >
        <span class="acceso__icono"><q-icon :name="acceso.icono" size="22px" /></span>
        <span class="acceso__nombre">{{ acceso.etiqueta }}</span>
        <q-icon name="sym_r_chevron_right" size="20px" class="text-suave" />
      </button>
    </div>

    <div v-else class="safic-indicador text-suave">
      Todavía no tienes secciones habilitadas en este condominio.
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { filtrarMenu, MENU_BASE, type ItemMenu } from '@/core/navigation/menu';
import { useSessionStore } from '@/stores/session';

const router = useRouter();
const session = useSessionStore();

const primerNombre = computed(() => session.usuario?.nombre.split(' ')[0] ?? '');

/** Accesos rápidos: las hojas del menú visibles para el usuario, sin "Inicio". */
const accesos = computed(() => {
  const hojas = (items: ItemMenu[]): ItemMenu[] =>
    items.flatMap((item) => (item.hijos ? hojas(item.hijos) : [item]));
  return hojas(filtrarMenu(MENU_BASE, session.permisos)).filter(
    (item) => item.ruta && item.ruta !== 'inicio',
  );
});

function ir(ruta: string | undefined): void {
  if (ruta) {
    void router.push({ name: ruta });
  }
}
</script>

<style scoped>
.acceso {
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.acceso:hover {
  border-color: var(--safic-borde-2);
}

.acceso__icono {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #e3efec;
  color: var(--q-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.acceso__nombre {
  flex-grow: 1;
  font-size: 15px;
  font-weight: 700;
}
</style>
