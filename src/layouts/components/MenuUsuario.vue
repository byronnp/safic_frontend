<template>
  <button type="button" class="usuario" aria-label="Opciones de la cuenta">
    <span class="usuario__avatar">{{ iniciales(session.usuario?.nombre ?? '') }}</span>
    <span class="text-left gt-xs">
      <span class="usuario__nombre">{{ session.usuario?.nombre }}</span>
      <span class="usuario__rol">{{ rol ?? etiquetaRol(session.roles) }}</span>
    </span>
    <q-menu :offset="[0, 8]">
      <q-list style="min-width: 260px" class="q-py-sm">
        <q-item>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ session.usuario?.nombre }}</q-item-label>
            <q-item-label caption>{{ session.usuario?.email }}</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Cambiar de ámbito: panel de plataforma ↔ condominios -->
        <template v-if="irAPlataforma || irACondominios">
          <q-separator class="q-my-xs" />
          <q-item v-if="irAPlataforma" v-close-popup clickable :to="{ name: 'plataforma' }">
            <q-item-section avatar><q-icon :name="ICONOS.plataforma" /></q-item-section>
            <q-item-section>{{ t('condominio.panelPlataforma') }}</q-item-section>
          </q-item>
          <q-item
            v-if="irACondominios"
            v-close-popup
            clickable
            :to="{ name: session.condominioId ? 'inicio' : 'seleccionar-condominio' }"
          >
            <q-item-section avatar><q-icon :name="ICONOS.condominio" /></q-item-section>
            <q-item-section>{{ t('condominio.misCondominios') }}</q-item-section>
          </q-item>
        </template>

        <!-- Solo en desarrollo: abrir las otras vistas para revisar los diseños -->
        <template v-if="MOSTRAR_VISTAS_PREVIAS">
          <q-separator class="q-my-xs" />
          <q-item-label header class="q-py-sm">Vista previa de diseños</q-item-label>
          <q-item
            v-for="vista in vistas"
            :key="vista.ruta"
            v-close-popup
            clickable
            :to="{ name: vista.ruta }"
          >
            <q-item-section avatar><q-icon :name="vista.icono" /></q-item-section>
            <q-item-section>{{ vista.etiqueta }}</q-item-section>
          </q-item>
        </template>

        <q-separator class="q-my-xs" />
        <q-item v-close-popup clickable @click="salir">
          <q-item-section avatar><q-icon :name="ICONOS.salir" /></q-item-section>
          <q-item-section>{{ t('auth.cerrarSesion') }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { queryClient } from '@/boot/vue-query';
import { ICONOS } from '@/core/navigation/icons';
import { etiquetaRol } from '@/core/navigation/roles';
import { iniciales } from '@/core/theme/avatar';
import { MOSTRAR_VISTAS_PREVIAS } from '@/core/vista-previa';
import { useSessionStore } from '@/stores/session';

defineProps<{ rol?: string }>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const enPlataforma = computed(() => route.meta.plataforma === true);
const irAPlataforma = computed(() => session.esPlataforma && !enPlataforma.value);
const irACondominios = computed(() => enPlataforma.value && session.condominios.length > 0);

const vistas = [
  { etiqueta: 'Administración del condominio', icono: ICONOS.condominio, ruta: 'inicio' },
  {
    etiqueta: 'Plataforma (super admin)',
    icono: ICONOS.plataforma,
    ruta: 'plataforma-condominios',
  },
  { etiqueta: 'App del residente', icono: ICONOS.miHogar, ruta: 'app-mi-hogar' },
  { etiqueta: 'App del guardia', icono: ICONOS.garitaApp, ruta: 'guardia-garita' },
];

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
.usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 4px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.usuario__avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--q-accent);
  color: var(--safic-tinta);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
}

.usuario__nombre {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.usuario__rol {
  display: block;
  font-size: 12px;
  color: var(--safic-texto-suave);
}
</style>
