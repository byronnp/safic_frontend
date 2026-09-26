<template>
  <q-layout view="lHh LpR lFf">
    <q-header bordered class="bg-white text-dark">
      <q-toolbar class="q-px-md" style="min-height: 64px">
        <q-btn
          flat
          round
          dense
          :icon="ICONOS.menu"
          aria-label="Abrir o cerrar el menú"
          @click="menuAbierto = !menuAbierto"
        />

        <q-toolbar-title class="text-subtitle1 text-weight-bold">
          {{ route.meta.titulo ?? 'SAFIC' }}
        </q-toolbar-title>

        <q-btn-dropdown
          v-if="session.condominioActivo"
          flat
          no-caps
          :icon="ICONOS.condominio"
          :label="$q.screen.gt.xs ? session.condominioActivo.nombre : undefined"
          :disable="session.condominios.length < 2"
          aria-label="Cambiar de condominio"
        >
          <q-list style="min-width: 260px">
            <q-item-label header>{{ t('condominio.cambiar') }}</q-item-label>
            <q-item
              v-for="condominio in session.condominios"
              :key="condominio.id"
              v-close-popup
              clickable
              :active="condominio.id === session.condominioId"
              @click="cambiarCondominio(condominio.id)"
            >
              <q-item-section>
                <q-item-label>{{ condominio.nombre }}</q-item-label>
                <q-item-label caption>{{ condominio.codigo }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-btn flat round class="q-ml-sm" aria-label="Opciones de la cuenta">
          <q-avatar size="34px" color="primary" text-color="white">
            {{ iniciales }}
          </q-avatar>
          <q-menu>
            <q-list style="min-width: 220px">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{
                    session.usuario?.nombre
                  }}</q-item-label>
                  <q-item-label caption>{{ session.usuario?.email }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item v-close-popup clickable @click="salir">
                <q-item-section avatar><q-icon :name="ICONOS.salir" /></q-item-section>
                <q-item-section>{{ t('auth.cerrarSesion') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="menuAbierto" show-if-above bordered :width="260" class="bg-white">
      <div class="row items-center q-gutter-sm q-pa-md">
        <img
          v-if="session.condominioActivo?.marca?.logo_url"
          :src="session.condominioActivo.marca.logo_url"
          alt=""
          style="height: 36px; max-width: 120px; object-fit: contain"
        />
        <span v-else class="safic-logo">S</span>
        <div class="text-subtitle1 text-weight-bold">SAFIC</div>
      </div>

      <MenuLateral :items="menu" />
    </q-drawer>

    <q-page-container>
      <router-view :key="session.condominioId ?? 0" />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { queryClient } from '@/boot/vue-query';
import { aApiError } from '@/core/api/errors';
import { ICONOS } from '@/core/navigation/icons';
import { filtrarMenu, MENU_BASE } from '@/core/navigation/menu';
import MenuLateral from '@/layouts/components/MenuLateral.vue';
import { useSessionStore } from '@/stores/session';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const menuAbierto = ref(false);

const menu = computed(() => filtrarMenu(MENU_BASE, session.permisos));

const iniciales = computed(() =>
  (session.usuario?.nombre ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join(''),
);

async function cambiarCondominio(id: number): Promise<void> {
  if (id === session.condominioId) {
    return;
  }
  try {
    await session.seleccionarCondominio(id);
    // Nada de la caché del condominio anterior puede mostrarse en el nuevo.
    queryClient.clear();
    await router.replace({ name: 'inicio' });
  } catch (error) {
    $q.notify({ type: 'negative', message: aApiError(error).mensaje });
  }
}

async function salir(): Promise<void> {
  try {
    await session.cerrarSesion();
  } finally {
    queryClient.clear();
    await router.replace({ name: 'login' });
  }
}
</script>
