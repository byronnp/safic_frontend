<template>
  <q-page padding>
    <div class="safic-page q-gutter-y-md">
      <div>
        <h1 class="safic-titulo">Hola, {{ primerNombre }}</h1>
        <p class="text-suave q-mt-xs">{{ session.condominioActivo?.nombre }}</p>
      </div>

      <div class="row q-col-gutter-md">
        <div v-for="acceso in accesos" :key="acceso.id" class="col-12 col-sm-6 col-md-4">
          <q-card flat class="safic-card cursor-pointer" @click="ir(acceso.ruta)">
            <q-card-section class="row items-center no-wrap q-gutter-md">
              <q-avatar color="primary" text-color="white" :icon="acceso.icono" />
              <div class="text-subtitle1 text-weight-medium">{{ acceso.etiqueta }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card v-if="accesos.length === 0" flat class="safic-card">
        <q-card-section class="text-suave">
          Todavía no tienes secciones habilitadas en este condominio.
        </q-card-section>
      </q-card>
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
