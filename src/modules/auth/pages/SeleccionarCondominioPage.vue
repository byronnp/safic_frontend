<template>
  <div class="column" style="gap: 20px">
    <div>
      <h2 class="selector__titulo">{{ t('condominio.elegir') }}</h2>
      <p class="selector__subtitulo">{{ t('condominio.elegirAyuda') }}</p>
    </div>

    <div v-if="session.condominios.length === 0" class="safic-alerta" role="alert">
      {{ t('condominio.sinCondominios') }}
    </div>

    <div v-else class="safic-card selector__lista">
      <template v-for="grupo in grupos" :key="grupo.titulo">
        <div v-if="grupo.condominios.length" class="selector__grupo">{{ grupo.titulo }}</div>
        <button
          v-for="condominio in grupo.condominios"
          :key="condominio.id"
          type="button"
          class="selector__item"
          :disabled="cargandoId !== null"
          @click="elegir(condominio.id)"
        >
          <span
            class="selector__avatar"
            :style="{
              background: colorAvatar(condominio.id).fondo,
              color: colorAvatar(condominio.id).texto,
            }"
          >
            {{ iniciales(condominio.nombre) }}
          </span>
          <span class="col-grow text-left">
            <span class="row items-center" style="gap: 6px">
              <span class="selector__nombre">{{ condominio.nombre }}</span>
              <span v-if="condominio.es_principal" class="selector__principal">PRINCIPAL</span>
            </span>
            <span class="selector__detalle">{{ condominio.codigo }}</span>
          </span>
          <q-spinner v-if="cargandoId === condominio.id" color="primary" size="20px" />
          <q-icon v-else name="sym_r_chevron_right" size="20px" class="text-suave" />
        </button>
      </template>
    </div>

    <p class="selector__nota">Al iniciar sesión siempre entras a tu condominio principal.</p>

    <q-btn
      v-if="session.esPlataforma"
      unelevated
      no-caps
      class="safic-btn safic-btn--secundario self-start"
      :icon="ICONOS.plataforma"
      :label="t('condominio.panelPlataforma')"
      :to="{ name: 'plataforma' }"
    />

    <q-btn
      unelevated
      no-caps
      class="safic-btn safic-btn--secundario self-start"
      :icon="ICONOS.salir"
      :label="t('auth.cerrarSesion')"
      @click="salir"
    />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { queryClient } from '@/boot/vue-query';
import { aApiError } from '@/core/api/errors';
import { ICONOS } from '@/core/navigation/icons';
import { colorAvatar, iniciales } from '@/core/theme/avatar';
import { redireccionSegura } from '@/router/guards';
import { useSessionStore } from '@/stores/session';

const $q = useQuasar();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const cargandoId = ref<number | null>(null);

const grupos = computed(() => [
  { titulo: 'PRINCIPAL', condominios: session.condominios.filter((c) => c.es_principal) },
  { titulo: 'SECUNDARIOS', condominios: session.condominios.filter((c) => !c.es_principal) },
]);

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

<style scoped>
.selector__titulo {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.selector__subtitulo {
  margin: 8px 0 0 0;
  font-size: 15px;
  color: var(--safic-texto-suave);
}

.selector__lista {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.selector__grupo {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--safic-texto-suave);
  padding: 8px 10px 4px;
}

.selector__item {
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

.selector__item:hover:not(:disabled) {
  background: #f1f6f5;
}

.selector__item:disabled {
  cursor: default;
  opacity: 0.7;
}

.selector__avatar {
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

.selector__nombre {
  font-size: 14px;
  font-weight: 700;
}

.selector__principal {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  background: #fff1dc;
  color: #8a3f0a;
}

.selector__detalle {
  display: block;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.selector__nota {
  margin: 0;
  font-size: 12px;
  color: var(--safic-texto-suave);
}
</style>
