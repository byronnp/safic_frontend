<template>
  <q-layout view="lHh LpR lFf">
    <!-- En pantallas grandes no hay encabezado (mockups de plataforma); en celular, uno mínimo -->
    <q-header class="lt-md encabezado">
      <div class="row items-center no-wrap q-px-sm" style="height: 56px; gap: 8px">
        <q-btn
          flat
          round
          :icon="ICONOS.menu"
          aria-label="Abrir o cerrar el menú"
          @click="menuAbierto = !menuAbierto"
        />
        <div class="text-weight-bold">{{ route.meta.titulo }}</div>
      </div>
    </q-header>

    <!-- Menú de plataforma: negro, para no confundirlo con un condominio -->
    <q-drawer v-model="menuAbierto" show-if-above :width="248">
      <div class="lateral fit column no-wrap">
        <div class="lateral__marca">
          <div class="safic-logo">S</div>
          <div class="lateral__nombre">SAFIC</div>
        </div>
        <div class="lateral__ambito">PLATAFORMA</div>

        <MenuLateral
          :items="menu"
          tono="plataforma"
          etiqueta="Menú de plataforma"
          :cargando="menuCargando"
          :error="menuError"
          class="col-grow"
          @reintentar="void recargarMenu()"
        >
          <template #pie>
            <div class="lateral__usuario">
              <MenuUsuario :rol="etiquetaRol(session.rolesPlataforma)" />
            </div>
          </template>
        </MenuLateral>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <VistaPreviaAviso />
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

import VistaPreviaAviso from '@/components/VistaPreviaAviso.vue';
import { ICONOS } from '@/core/navigation/icons';
import { etiquetaRol } from '@/core/navigation/roles';
import { useMenuPlataforma } from '@/core/navigation/useMenu';
import MenuLateral from '@/layouts/components/MenuLateral.vue';
import MenuUsuario from '@/layouts/components/MenuUsuario.vue';
import { useSessionStore } from '@/stores/session';

const route = useRoute();
const session = useSessionStore();
const menuAbierto = ref(false);

// Menú del perfil de plataforma (GET /plataforma/me/menu)
const {
  menu,
  isLoading: menuCargando,
  isError: menuError,
  refetch: recargarMenu,
} = useMenuPlataforma();
</script>

<style scoped>
.encabezado {
  background: #1c1b18;
  color: #ffffff;
}

.lateral {
  background: #1c1b18;
  color: #edeae2;
  overflow-y: auto;
}

.lateral__marca {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 24px 6px;
}

.lateral__nombre {
  font-weight: 800;
  font-size: 18px;
}

.lateral__ambito {
  margin: 0 24px 18px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--q-accent);
}

.lateral__usuario {
  border-top: 1px solid #34322d;
  padding-top: 12px;
  margin-top: 12px;
}

.lateral__usuario :deep(.usuario) {
  color: #edeae2;
  width: 100%;
}

.lateral__usuario :deep(.usuario__rol) {
  color: #8a857a;
}
</style>
