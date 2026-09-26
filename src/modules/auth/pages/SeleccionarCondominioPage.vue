<template>
  <q-card flat class="safic-card full-width">
    <q-card-section>
      <h1 class="safic-titulo">{{ t('condominio.elegir') }}</h1>
      <p class="text-suave q-mb-none q-mt-xs">{{ t('condominio.elegirAyuda') }}</p>
    </q-card-section>

    <q-card-section v-if="session.condominios.length === 0">
      <q-banner rounded class="bg-orange-1">{{ t('condominio.sinCondominios') }}</q-banner>
    </q-card-section>

    <q-list v-else separator class="q-pb-sm">
      <q-item
        v-for="condominio in session.condominios"
        :key="condominio.id"
        clickable
        :disable="cargandoId !== null"
        @click="elegir(condominio.id)"
      >
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" :icon="ICONOS.condominio" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ condominio.nombre }}</q-item-label>
          <q-item-label caption>{{ condominio.codigo }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-spinner v-if="cargandoId === condominio.id" color="primary" />
          <q-badge v-else-if="condominio.es_principal" color="accent" text-color="dark">
            {{ t('condominio.principal') }}
          </q-badge>
        </q-item-section>
      </q-item>
    </q-list>

    <q-card-actions align="right">
      <q-btn flat no-caps :icon="ICONOS.salir" :label="t('auth.cerrarSesion')" @click="salir" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { queryClient } from '@/boot/vue-query';
import { aApiError } from '@/core/api/errors';
import { ICONOS } from '@/core/navigation/icons';
import { redireccionSegura } from '@/router/guards';
import { useSessionStore } from '@/stores/session';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const cargandoId = ref<number | null>(null);

async function elegir(id: number): Promise<void> {
  cargandoId.value = id;
  try {
    await session.seleccionarCondominio(id);
    queryClient.clear();
    await router.replace(redireccionSegura(route.query.redirect) ?? { name: 'inicio' });
  } catch (error) {
    $q.notify({ type: 'negative', message: aApiError(error).mensaje });
  } finally {
    cargandoId.value = null;
  }
}

async function salir(): Promise<void> {
  await session.cerrarSesion();
  await router.replace({ name: 'login' });
}
</script>
