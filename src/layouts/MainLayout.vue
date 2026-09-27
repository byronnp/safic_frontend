<template>
  <q-layout view="lHh LpR lFf">
    <!-- Encabezado blanco de 68px (mockup Main) -->
    <q-header class="encabezado">
      <div class="encabezado__barra">
        <q-btn
          flat
          round
          class="lt-md"
          :icon="ICONOS.menu"
          aria-label="Abrir o cerrar el menú"
          @click="menuAbierto = !menuAbierto"
        />

        <!-- Selector de condominio: solo si el usuario tiene más de uno -->
        <template v-if="session.condominioActivo">
          <button
            v-if="session.condominios.length > 1"
            type="button"
            class="condominio"
            aria-haspopup="menu"
          >
            <span class="condominio__avatar" :style="estiloAvatar(session.condominioActivo.id)">
              {{ iniciales(session.condominioActivo.nombre) }}
            </span>
            <span class="text-left gt-xs">
              <span class="condominio__etiqueta">Condominio activo</span>
              <span class="condominio__nombre">{{ session.condominioActivo.nombre }}</span>
            </span>
            <q-icon name="sym_r_expand_more" size="18px" class="text-suave" />

            <q-menu class="condominios" :offset="[0, 8]" @show="busqueda = ''">
              <div class="condominios__contenido">
                <q-input
                  v-model="busqueda"
                  class="safic-input"
                  outlined
                  dense
                  autofocus
                  placeholder="Buscar condominio"
                  aria-label="Buscar condominio"
                >
                  <template #prepend><q-icon :name="ICONOS.buscar" size="18px" /></template>
                </q-input>

                <template v-for="grupo in gruposCondominios" :key="grupo.titulo">
                  <template v-if="grupo.condominios.length">
                    <div class="condominios__grupo">{{ grupo.titulo }}</div>
                    <button
                      v-for="condominio in grupo.condominios"
                      :key="condominio.id"
                      v-close-popup
                      type="button"
                      role="menuitem"
                      class="condominios__item"
                      :class="{
                        'condominios__item--activo': condominio.id === session.condominioId,
                      }"
                      @click="cambiarCondominio(condominio.id)"
                    >
                      <span class="condominios__avatar" :style="estiloAvatar(condominio.id)">
                        {{ iniciales(condominio.nombre) }}
                      </span>
                      <span class="col-grow text-left">
                        <span class="row items-center" style="gap: 6px">
                          <span class="condominios__nombre">{{ condominio.nombre }}</span>
                          <span v-if="condominio.es_principal" class="condominios__principal">
                            PRINCIPAL
                          </span>
                        </span>
                        <span class="condominios__detalle">{{ condominio.codigo }}</span>
                      </span>
                      <q-icon
                        v-if="condominio.id === session.condominioId"
                        name="sym_r_check"
                        size="18px"
                        color="primary"
                      />
                    </button>
                  </template>
                </template>

                <div class="condominios__nota">
                  Al iniciar sesión siempre entras a tu condominio principal.
                </div>
              </div>
            </q-menu>
          </button>

          <div v-else class="row items-center no-wrap" style="gap: 10px">
            <span class="condominio__avatar" :style="estiloAvatar(session.condominioActivo.id)">
              {{ iniciales(session.condominioActivo.nombre) }}
            </span>
            <span class="gt-xs" style="font-size: 15px; font-weight: 700">
              {{ session.condominioActivo.nombre }}
            </span>
          </div>
        </template>

        <div class="col-grow" />

        <q-btn flat round class="encabezado__icono" aria-label="Notificaciones">
          <q-icon name="sym_r_notifications" size="22px" />
        </q-btn>

        <button type="button" class="usuario" aria-label="Opciones de la cuenta">
          <span class="usuario__avatar">{{ iniciales(session.usuario?.nombre ?? '') }}</span>
          <span class="text-left gt-xs">
            <span class="usuario__nombre">{{ session.usuario?.nombre }}</span>
            <span class="usuario__rol">{{ rolVisible }}</span>
          </span>
          <q-menu :offset="[0, 8]">
            <q-list style="min-width: 240px" class="q-py-sm">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{
                    session.usuario?.nombre
                  }}</q-item-label>
                  <q-item-label caption>{{ session.usuario?.email }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator class="q-my-xs" />
              <q-item v-close-popup clickable @click="salir">
                <q-item-section avatar><q-icon :name="ICONOS.salir" /></q-item-section>
                <q-item-section>{{ t('auth.cerrarSesion') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </button>
      </div>
    </q-header>

    <!-- Menú lateral oscuro de 248px (mockup Main) -->
    <q-drawer v-model="menuAbierto" show-if-above :width="248">
      <div class="lateral fit column no-wrap">
        <div class="lateral__marca">
          <img
            v-if="session.condominioActivo?.marca?.logo_url"
            :src="session.condominioActivo.marca.logo_url"
            alt=""
            class="lateral__logo-condominio"
          />
          <div v-else class="safic-logo">S</div>
          <div class="lateral__nombre">SAFIC</div>
        </div>

        <MenuLateral :items="menu" class="col-grow" />
      </div>
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
import { useRouter } from 'vue-router';

import { queryClient } from '@/boot/vue-query';
import { aApiError } from '@/core/api/errors';
import { ICONOS } from '@/core/navigation/icons';
import { filtrarMenu, MENU_BASE } from '@/core/navigation/menu';
import { etiquetaRol } from '@/core/navigation/roles';
import { colorAvatar, iniciales } from '@/core/theme/avatar';
import MenuLateral from '@/layouts/components/MenuLateral.vue';
import { useSessionStore } from '@/stores/session';

const $q = useQuasar();
const { t } = useI18n();
const router = useRouter();
const session = useSessionStore();

const menuAbierto = ref(false);
const busqueda = ref('');

const menu = computed(() => filtrarMenu(MENU_BASE, session.permisos));

const rolVisible = computed(() => etiquetaRol(session.roles));

const gruposCondominios = computed(() => {
  const texto = busqueda.value.trim().toLowerCase();
  const lista = session.condominios.filter(
    (c) =>
      !texto || c.nombre.toLowerCase().includes(texto) || c.codigo.toLowerCase().includes(texto),
  );
  return [
    { titulo: 'PRINCIPAL', condominios: lista.filter((c) => c.es_principal) },
    { titulo: 'SECUNDARIOS', condominios: lista.filter((c) => !c.es_principal) },
  ];
});

function estiloAvatar(id: number): Record<string, string> {
  const color = colorAvatar(id);
  return { background: color.fondo, color: color.texto };
}

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

<style scoped>
.encabezado {
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border-bottom: 1px solid var(--safic-borde);
}

.encabezado__barra {
  height: 68px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 32px;
}

@media (max-width: 599px) {
  .encabezado__barra {
    padding: 0 12px;
    gap: 8px;
  }
}

.encabezado__icono {
  color: var(--safic-texto-2);
}

.condominio {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--safic-borde-2);
  border-radius: 10px;
  background: var(--safic-fondo-2);
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.condominio__avatar {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  flex-shrink: 0;
}

.condominio__etiqueta {
  display: block;
  font-size: 11px;
  color: var(--safic-texto-suave);
  font-weight: 600;
}

.condominio__nombre {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

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

.lateral {
  background: var(--safic-tinta);
  overflow-y: auto;
}

.lateral__marca {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 24px 22px;
}

.lateral__logo-condominio {
  height: 34px;
  max-width: 120px;
  object-fit: contain;
}

.lateral__nombre {
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.2px;
  color: #e8f0ee;
}
</style>

<style>
/* Menú desplegable de condominios */
.condominios {
  width: 360px;
  max-width: 92vw;
  border: 1px solid #ddd9ce;
  border-radius: 14px !important;
  box-shadow: 0 16px 40px rgba(28, 27, 24, 0.16) !important;
}

.condominios__contenido {
  padding: 12px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.condominios__grupo {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--safic-texto-suave);
  padding: 10px 10px 4px;
}

.condominios__item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.condominios__item:hover,
.condominios__item--activo {
  background: #f1f6f5;
}

.condominios__avatar {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.condominios__nombre {
  font-size: 14px;
  font-weight: 700;
}

.condominios__principal {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  background: #fff1dc;
  color: #8a3f0a;
}

.condominios__detalle {
  display: block;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.condominios__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  padding: 8px 10px 4px;
}
</style>
