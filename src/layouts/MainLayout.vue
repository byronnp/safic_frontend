<template>
  <MarcoWeb
    :menu="menu"
    :cargando="menuCargando"
    :error="menuError"
    @reintentar="void recargarMenu()"
  >
    <router-view :key="session.condominioId ?? 0" />
  </MarcoWeb>
</template>

<script setup lang="ts">
import { useMenuCondominio } from '@/core/navigation/useMenu';
import MarcoWeb from '@/layouts/components/MarcoWeb.vue';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();

// Menú del perfil en el condominio activo (GET /me/menu)
const {
  menu,
  isLoading: menuCargando,
  isError: menuError,
  refetch: recargarMenu,
} = useMenuCondominio();
</script>
