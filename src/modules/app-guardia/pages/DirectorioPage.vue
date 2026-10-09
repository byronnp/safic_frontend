<template>
  <div class="app-pagina">
    <AppEncabezado
      class="directorio-encabezado"
      :antetitulo="session.condominioActivo?.nombre ?? 'Garita'"
      titulo="Directorio"
    >
      <template #derecha>
        <div class="directorio-avatar" :title="session.usuario?.nombre" aria-hidden="true">
          {{ iniciales(session.usuario?.nombre ?? '') }}
        </div>
      </template>

      <label class="directorio-buscar">
        <q-icon :name="ICONOS.buscar" size="22px" class="directorio-buscar__icono" />
        <input
          v-model="busqueda"
          type="search"
          class="directorio-buscar__campo"
          :aria-label="etiquetaBusqueda"
          maxlength="60"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
        />
      </label>
      <div class="directorio-filtros" role="group" aria-label="Buscar por">
        <button
          v-for="filtro in FILTROS"
          :key="filtro.id"
          type="button"
          class="directorio-filtro"
          :aria-pressed="campo === filtro.id"
          @click="campo = filtro.id"
        >
          <span
            class="directorio-filtro__pildora"
            :class="{ 'directorio-filtro__pildora--activa': campo === filtro.id }"
          >
            {{ filtro.etiqueta }}
          </span>
        </button>
      </div>
    </AppEncabezado>

    <div class="app-cuerpo directorio-cuerpo">
      <div v-if="!buscando" class="directorio-vacio">
        Escribe al menos 2 letras o números de un nombre, una unidad o una placa.
      </div>

      <div v-else-if="directorio.isError.value" class="safic-alerta" role="alert">
        {{ directorio.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="directorio.refetch()" />
      </div>

      <template v-else>
        <div class="directorio-conteo" aria-live="polite">
          <template v-if="directorio.isPending.value">Buscando…</template>
          <template v-else>
            {{ resultados.length }} {{ resultados.length === 1 ? 'resultado' : 'resultados' }}
          </template>
        </div>
        <DirectorioTarjeta
          v-for="resultado in resultados"
          :key="resultado.unidad.id"
          :resultado="resultado"
        />
        <div v-if="sinCoincidencias" class="directorio-vacio">
          No hay coincidencias. Revisa la {{ nombreCampo }} o cambia el filtro.
        </div>
      </template>

      <div class="directorio-nota">
        Solo se muestran nombre, unidad, teléfono y placas. Cédulas y correos están ocultos para el
        rol de guardia.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { ICONOS } from '@/core/navigation/icons';
import { iniciales } from '@/core/theme/avatar';
import { useSessionStore } from '@/stores/session';
import { refDebounced } from '@/utils/debounce';

import DirectorioTarjeta from '../components/DirectorioTarjeta.vue';
import { useDirectorio } from '../composables/useDirectorio';
import { coincideCampo, terminoValido, type CampoBusqueda } from '../directorio.logica';

const FILTROS: { id: CampoBusqueda; etiqueta: string }[] = [
  { id: 'placa', etiqueta: 'Placa' },
  { id: 'nombre', etiqueta: 'Nombre' },
  { id: 'unidad', etiqueta: 'Unidad' },
];

const session = useSessionStore();

const busqueda = ref('');
const campo = ref<CampoBusqueda>('placa');
// Se espera a que deje de escribir: cada consulta cuenta para el límite por minuto
const termino = refDebounced(busqueda, 500);

const buscando = computed(() => terminoValido(busqueda.value));
const directorio = useDirectorio(termino);

const nombreCampo = computed(
  () => FILTROS.find((f) => f.id === campo.value)?.etiqueta.toLowerCase() ?? '',
);
const etiquetaBusqueda = computed(() => `Buscar por ${nombreCampo.value}`);

const resultados = computed(() =>
  (directorio.data.value ?? []).filter((r) => coincideCampo(r, campo.value, busqueda.value)),
);
const sinCoincidencias = computed(
  () => !directorio.isPending.value && resultados.value.length === 0,
);
</script>

<style scoped>
.app-encabezado.directorio-encabezado {
  padding: 24px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.directorio-avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--q-accent);
  color: var(--safic-tinta);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
}

.directorio-buscar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border-radius: 14px;
  background: #ffffff;
  box-sizing: border-box;
  cursor: text;
}

.directorio-buscar:focus-within {
  outline: 3px solid var(--q-accent);
  outline-offset: 0;
}

.directorio-buscar__icono {
  color: var(--safic-texto-suave);
}

.directorio-buscar__campo {
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 18px;
  font-weight: 700;
  flex-grow: 1;
  min-width: 0;
  height: 100%;
  background: transparent;
  color: var(--safic-texto);
  padding: 0;
}

.directorio-buscar__campo::-webkit-search-cancel-button {
  cursor: pointer;
}

/* La píldora mide 34px como en el mockup; el botón da 44px de área táctil. */
.directorio-filtros {
  display: flex;
  gap: 8px;
  margin: -5px 0;
}

.directorio-filtro {
  height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.directorio-filtro__pildora {
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--safic-tinta-2);
  color: #d6e3e0;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.directorio-filtro__pildora--activa {
  background: var(--q-accent);
  color: var(--safic-tinta);
  font-weight: 800;
}

.directorio-filtro:focus-visible {
  outline: none;
}

.directorio-filtro:focus-visible .directorio-filtro__pildora {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.app-cuerpo.directorio-cuerpo {
  padding: 16px;
  gap: 12px;
}

.directorio-conteo {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.directorio-vacio {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 16px;
  padding: 16px;
  font-size: 14px;
  color: var(--safic-texto-2);
}

.directorio-nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
  padding: 4px 4px 0;
}
</style>
