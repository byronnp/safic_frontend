<template>
  <div class="app-pagina">
    <AppEncabezado
      class="directorio-encabezado"
      :antetitulo="`${DIRECTORIO_TURNO.garita} · ${DIRECTORIO_TURNO.turno}`"
      titulo="Directorio"
    >
      <template #derecha>
        <div class="directorio-avatar" :title="DIRECTORIO_TURNO.guardia" aria-hidden="true">
          {{ iniciales(DIRECTORIO_TURNO.guardia) }}
        </div>
      </template>

      <label class="directorio-buscar">
        <q-icon name="sym_r_search" size="22px" class="directorio-buscar__icono" />
        <input
          v-model="busqueda"
          type="search"
          class="directorio-buscar__campo"
          :aria-label="etiquetaBusqueda"
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
      <div class="directorio-conteo" aria-live="polite">
        {{ resultados.length }} {{ resultados.length === 1 ? 'resultado' : 'resultados' }}
      </div>
      <DirectorioTarjeta
        v-for="residente in resultados"
        :key="residente.id"
        :residente="residente"
      />
      <div v-if="!resultados.length" class="directorio-vacio">
        No hay coincidencias. Revisa la {{ nombreCampo }} o cambia el filtro.
      </div>
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
import { iniciales } from '@/core/theme/avatar';
import DirectorioTarjeta from '@/modules/app-guardia/components/DirectorioTarjeta.vue';
import type { DirectorioResidente } from '@/modules/app-guardia/demo/directorio';
import {
  DIRECTORIO_BUSQUEDA_INICIAL,
  DIRECTORIO_RESIDENTES,
  DIRECTORIO_TURNO,
} from '@/modules/app-guardia/demo/directorio';

type CampoBusqueda = 'placa' | 'nombre' | 'unidad';

const FILTROS: { id: CampoBusqueda; etiqueta: string }[] = [
  { id: 'placa', etiqueta: 'Placa' },
  { id: 'nombre', etiqueta: 'Nombre' },
  { id: 'unidad', etiqueta: 'Unidad' },
];

const busqueda = ref(DIRECTORIO_BUSQUEDA_INICIAL);
const campo = ref<CampoBusqueda>('placa');

const nombreCampo = computed(
  () => FILTROS.find((f) => f.id === campo.value)?.etiqueta.toLowerCase() ?? '',
);
const etiquetaBusqueda = computed(() => `Buscar por ${nombreCampo.value}`);

/** Sin tildes, mayúsculas ni guiones/espacios: "pbc 4821" encuentra "PBC-4821". */
function normalizar(texto: string, compacto: boolean): string {
  const base = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return compacto ? base.replace(/[\s-]/g, '') : base.replace(/\s+/g, ' ');
}

function coincide(residente: DirectorioResidente, termino: string): boolean {
  switch (campo.value) {
    case 'placa': {
      const t = normalizar(termino, true);
      return residente.vehiculos.some((v) => normalizar(v.placa, true).includes(t));
    }
    case 'unidad': {
      const t = normalizar(termino, true);
      return normalizar(residente.unidad, true).includes(t);
    }
    case 'nombre': {
      const t = normalizar(termino, false);
      return normalizar(residente.nombre, false).includes(t);
    }
  }
}

const resultados = computed<DirectorioResidente[]>(() => {
  const termino = busqueda.value.trim();
  if (!termino) {
    return DIRECTORIO_RESIDENTES;
  }
  return DIRECTORIO_RESIDENTES.filter((r) => coincide(r, termino));
});
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
