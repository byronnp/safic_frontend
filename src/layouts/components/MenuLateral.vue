<template>
  <nav :aria-label="etiqueta" class="menu" :class="`menu--${tono}`" :aria-busy="cargando">
    <!-- Cargando: líneas de esqueleto con el alto de un enlace -->
    <template v-if="cargando && !items.length">
      <q-skeleton
        v-for="n in 4"
        :key="n"
        type="rect"
        height="40px"
        class="menu__esqueleto"
        animation="fade"
      />
    </template>

    <!-- Error: el menú no se pudo cargar -->
    <div v-else-if="error && !items.length" class="menu__error" role="alert">
      <q-icon name="sym_r_error" size="20px" />
      <span>No pudimos cargar el menú.</span>
      <button type="button" class="menu__reintentar" @click="emit('reintentar')">Reintentar</button>
    </div>

    <template v-for="item in items" :key="item.id">
      <!-- Grupo siempre desplegado (CONFIGURACIÓN, ACCESO) -->
      <template v-if="item.seccion && item.hijos?.length">
        <div class="menu__seccion">{{ item.etiqueta }}</div>
        <EnlaceMenu
          v-for="hijo in item.hijos"
          :key="hijo.id"
          :item="hijo"
          :activo="esActual(hijo)"
        />
      </template>

      <!-- Módulo: se queda en su lugar y despliega sus pantallas debajo (acordeón) -->
      <template v-else-if="item.hijos?.length">
        <button
          type="button"
          class="modulo"
          :class="{ 'modulo--actual': item.id === moduloActual }"
          :aria-expanded="estaAbierto(item)"
          :aria-controls="`menu-${item.id}`"
          @click="alternar(item)"
        >
          <q-icon :name="item.icono" size="20px" class="modulo__icono" />
          <span class="col-grow text-left">{{ item.etiqueta }}</span>
          <q-icon
            name="sym_r_expand_more"
            size="18px"
            class="modulo__flecha"
            :class="{ 'modulo__flecha--abierta': estaAbierto(item) }"
          />
        </button>
        <div v-show="estaAbierto(item)" :id="`menu-${item.id}`" class="modulo__hijos">
          <EnlaceMenu
            v-for="hijo in item.hijos"
            :key="hijo.id"
            :item="hijo"
            :activo="esActual(hijo)"
          />
        </div>
      </template>

      <EnlaceMenu v-else-if="item.ruta" :item="item" :activo="esActual(item)" />
    </template>

    <div class="col-grow" />
    <slot name="pie" />
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { type ItemMenu, moduloDeRuta } from '@/core/navigation/menu';

import EnlaceMenu from './EnlaceMenu.vue';

const props = withDefaults(
  defineProps<{
    items: ItemMenu[];
    tono?: 'condominio' | 'plataforma';
    etiqueta?: string;
    cargando?: boolean;
    error?: boolean;
  }>(),
  { tono: 'condominio', etiqueta: 'Menú principal', cargando: false, error: false },
);

const emit = defineEmits<{ reintentar: [] }>();

const route = useRoute();

/** Nombre de la ruta que se marca activa (las pantallas de detalle apuntan a su lista). */
const rutaActual = computed<string | undefined>(
  () => route.meta.menuActivo ?? (typeof route.name === 'string' ? route.name : undefined),
);

/** Módulo de la pantalla actual: siempre desplegado. */
const moduloActual = computed(() => moduloDeRuta(props.items, rutaActual.value));

/** Módulos que el usuario abrió o cerró a mano. */
const abiertos = ref(new Set<string>());
const cerrados = ref(new Set<string>());

// Al cambiar de módulo se limpian las preferencias: queda abierto solo el actual.
watch(moduloActual, () => {
  abiertos.value = new Set();
  cerrados.value = new Set();
});

function estaAbierto(item: ItemMenu): boolean {
  if (cerrados.value.has(item.id)) {
    return false;
  }
  return item.id === moduloActual.value || abiertos.value.has(item.id);
}

function alternar(item: ItemMenu): void {
  const abrir = !estaAbierto(item);
  const nuevosAbiertos = new Set(abiertos.value);
  const nuevosCerrados = new Set(cerrados.value);
  if (abrir) {
    nuevosAbiertos.add(item.id);
    nuevosCerrados.delete(item.id);
  } else {
    nuevosAbiertos.delete(item.id);
    nuevosCerrados.add(item.id);
  }
  abiertos.value = nuevosAbiertos;
  cerrados.value = nuevosCerrados;
}

function esActual(item: ItemMenu): boolean {
  return item.ruta !== undefined && item.ruta === rutaActual.value;
}
</script>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 14px 20px;
}

.menu--condominio {
  --menu-texto: var(--safic-menu-texto);
  --menu-activo: var(--safic-tinta-2);
  --menu-seccion: var(--safic-menu-seccion);
}

.menu--plataforma {
  --menu-texto: #bdb8ac;
  --menu-activo: #34322d;
  --menu-seccion: #8a857a;
}

.menu__esqueleto {
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.06);
}

.menu__error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--menu-texto);
  font-size: 13px;
}

.menu__reintentar {
  border: none;
  background: transparent;
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.menu__reintentar:focus-visible {
  outline: 2px solid var(--q-accent);
  outline-offset: 2px;
}

.menu__seccion {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 14px 12px 6px;
  color: var(--menu-seccion);
}
.modulo {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--menu-texto);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.modulo:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.modulo:focus-visible {
  outline: 2px solid var(--q-accent);
  outline-offset: 2px;
}

/* Módulo de la pantalla actual: texto claro, sin fondo (el fondo es de la pantalla activa) */
.modulo--actual {
  color: #ffffff;
  font-weight: 700;
}

.modulo__flecha {
  transition: transform 0.15s;
}

.modulo__flecha--abierta {
  transform: rotate(180deg);
}

/* Pantallas del módulo: sangría y una línea guía a la izquierda */
.modulo__hijos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 2px 0 6px 21px;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .modulo,
  .modulo__flecha {
    transition: none;
  }
}
</style>
