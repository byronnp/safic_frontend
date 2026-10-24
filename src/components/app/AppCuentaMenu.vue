<template>
  <button type="button" class="app-cuenta" aria-label="Opciones de la cuenta">
    <span class="app-cuenta__avatar">{{ iniciales(session.usuario?.nombre ?? '') }}</span>
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
      <q-list style="min-width: 260px" class="q-py-sm">
        <q-item>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ session.usuario?.nombre }}</q-item-label>
            <q-item-label caption>{{ session.usuario?.email }}</q-item-label>
            <q-item-label v-if="session.condominioActivo" caption>
              {{ session.condominioActivo.nombre }} · {{ etiquetaRol(session.roles) }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-separator class="q-my-xs" />

        <q-item
          v-if="opciones.cambiarCondominio"
          v-close-popup
          clickable
          :to="{ name: 'seleccionar-condominio' }"
        >
          <q-item-section avatar><q-icon :name="ICONOS.condominio" /></q-item-section>
          <q-item-section>Cambiar de condominio</q-item-section>
        </q-item>
        <q-item v-if="opciones.administracion" v-close-popup clickable :to="{ name: 'inicio' }">
          <q-item-section avatar><q-icon :name="ICONOS.condominio" /></q-item-section>
          <q-item-section>Administración del condominio</q-item-section>
        </q-item>
        <q-item
          v-for="app in opciones.otrasApps"
          :key="app.clave"
          v-close-popup
          clickable
          :to="{ name: app.ruta }"
        >
          <q-item-section avatar>
            <q-icon :name="app.clave === 'guardia' ? ICONOS.garitaApp : ICONOS.miHogar" />
          </q-item-section>
          <q-item-section>{{ app.etiqueta }}</q-item-section>
        </q-item>

        <q-item v-close-popup clickable :to="{ name: 'doble-factor' }">
          <q-item-section avatar><q-icon name="sym_r_verified_user" /></q-item-section>
          <q-item-section>Verificación en dos pasos</q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="salir">
          <q-item-section avatar><q-icon :name="ICONOS.salir" /></q-item-section>
          <q-item-section>Cerrar sesión</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { queryClient } from '@/boot/vue-query';
import { opcionesDeCuentaApp } from '@/core/navigation/apps';
import { ICONOS } from '@/core/navigation/icons';
import { etiquetaRol } from '@/core/navigation/roles';
import { iniciales } from '@/core/theme/avatar';
import { useSessionStore } from '@/stores/session';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const opciones = computed(() =>
  opcionesDeCuentaApp(
    session.permisos,
    session.condominios.length,
    route.meta.app === 'guardia' ? 'guardia' : 'residente',
  ),
);

async function salir(): Promise<void> {
  try {
    await session.cerrarSesion();
  } finally {
    queryClient.clear();
    await router.replace({ name: 'login' });
  }
}
</script>

<style scoped>
.app-cuenta {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.app-cuenta__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--q-accent);
  color: var(--safic-tinta);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
}
</style>
