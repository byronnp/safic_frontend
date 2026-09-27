<template>
  <nav aria-label="Menú principal" class="menu">
    <template v-for="item in items" :key="item.id">
      <template v-if="item.hijos?.length">
        <div class="menu__seccion">
          <q-icon :name="item.icono" size="16px" />
          {{ item.etiqueta }}
        </div>
        <router-link
          v-for="hijo in item.hijos"
          :key="hijo.id"
          #default="{ href, navigate, isActive }"
          :to="{ name: hijo.ruta }"
          custom
        >
          <a
            :href="href"
            class="menu__item"
            :class="{ 'menu__item--activo': isActive }"
            :aria-current="isActive ? 'page' : undefined"
            @click="navigate"
          >
            <q-icon :name="hijo.icono" size="20px" class="menu__icono" />
            {{ hijo.etiqueta }}
          </a>
        </router-link>
      </template>

      <router-link
        v-else-if="item.ruta"
        #default="{ href, navigate, isExactActive }"
        :to="{ name: item.ruta }"
        custom
      >
        <a
          :href="href"
          class="menu__item"
          :class="{ 'menu__item--activo': isExactActive }"
          :aria-current="isExactActive ? 'page' : undefined"
          @click="navigate"
        >
          <q-icon :name="item.icono" size="20px" class="menu__icono" />
          {{ item.etiqueta }}
        </a>
      </router-link>
    </template>

    <div class="col-grow" />

    <div class="menu__proximamente">
      <div class="menu__seccion">PRÓXIMAMENTE</div>
      <div class="menu__nota">Finanzas · Reservas · Visitas</div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { ItemMenu } from '@/core/navigation/menu';

defineProps<{ items: ItemMenu[] }>();
</script>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 14px 20px;
}

.menu__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 9px;
  color: var(--safic-menu-texto);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.15s;
}

.menu__item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.menu__item--activo,
.menu__item--activo:hover {
  background: var(--safic-tinta-2);
  color: #ffffff;
  font-weight: 700;
}

/* Ícono relleno en el ítem activo, como en el mockup */
.menu__item--activo .menu__icono {
  font-variation-settings:
    'FILL' 1,
    'wght' 500;
}

.menu__item:focus-visible {
  outline: 2px solid var(--q-accent);
  outline-offset: 2px;
}

.menu__seccion {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--safic-menu-seccion);
  padding: 14px 12px 6px;
}

.menu__nota {
  padding: 0 12px;
  color: #7f9d99;
  font-size: 13px;
  font-weight: 600;
}
</style>
