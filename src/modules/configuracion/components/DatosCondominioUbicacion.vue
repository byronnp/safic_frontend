<template>
  <!-- Pestaña Ubicación (sin mockup): formulario y mapa con el pin de la entrada principal -->
  <q-form class="ubicacion" novalidate @submit="guardar">
    <div class="ubicacion__campos">
      <div>
        <div class="ubicacion__titulo">Ubicación</div>
        <div class="ubicacion__ayuda">Ayuda a proveedores y visitas a llegar al condominio.</div>
      </div>

      <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
      <div v-if="ubicaciones.isError.value" class="safic-alerta" role="alert">
        No se pudo cargar la lista de provincias.
        <q-btn flat no-caps dense label="Reintentar" @click="ubicaciones.refetch()" />
      </div>

      <div class="safic-campo">
        <label for="dc-ubi-provincia" class="safic-campo__etiqueta">Provincia</label>
        <q-select
          v-model="formulario.provincia"
          for="dc-ubi-provincia"
          class="safic-input"
          outlined
          dense
          emit-value
          map-options
          hide-bottom-space
          :options="opcionesProvincias"
          :loading="ubicaciones.isPending.value"
          :error="!!errores.provincia"
          :error-message="errores.provincia"
          @update:model-value="cambioProvincia"
        />
      </div>
      <div class="ubicacion__par">
        <div class="safic-campo">
          <label for="dc-ubi-canton" class="safic-campo__etiqueta">Cantón</label>
          <q-select
            v-model="formulario.canton"
            for="dc-ubi-canton"
            class="safic-input"
            outlined
            dense
            emit-value
            map-options
            hide-bottom-space
            :options="opcionesCantones"
            :disable="!formulario.provincia"
            :error="!!errores.canton"
            :error-message="errores.canton"
            @update:model-value="cambioCanton"
          />
        </div>
        <div class="safic-campo">
          <label for="dc-ubi-parroquia" class="safic-campo__etiqueta">Parroquia</label>
          <q-select
            v-model="formulario.parroquia"
            for="dc-ubi-parroquia"
            class="safic-input"
            outlined
            dense
            emit-value
            map-options
            hide-bottom-space
            :options="opcionesParroquias"
            :disable="!formulario.canton"
            :error="!!errores.parroquia"
            :error-message="errores.parroquia"
          />
        </div>
      </div>
      <div class="safic-campo">
        <label for="dc-ubi-direccion" class="safic-campo__etiqueta">Dirección</label>
        <q-input
          v-model="formulario.direccion"
          for="dc-ubi-direccion"
          class="safic-input"
          outlined
          dense
          type="textarea"
          autogrow
          maxlength="200"
          hide-bottom-space
          :error="!!errores.direccion"
          :error-message="errores.direccion"
        />
      </div>
      <div class="ubicacion__coordenadas">
        <div class="safic-campo">
          <label for="dc-ubi-latitud" class="safic-campo__etiqueta">Latitud</label>
          <q-input
            v-model="formulario.latitud"
            for="dc-ubi-latitud"
            class="safic-input"
            outlined
            dense
            inputmode="decimal"
            hide-bottom-space
            :error="!!errores.latitud"
            :error-message="errores.latitud"
          />
        </div>
        <div class="safic-campo">
          <label for="dc-ubi-longitud" class="safic-campo__etiqueta">Longitud</label>
          <q-input
            v-model="formulario.longitud"
            for="dc-ubi-longitud"
            class="safic-input"
            outlined
            dense
            inputmode="decimal"
            hide-bottom-space
            :error="!!errores.longitud"
            :error-message="errores.longitud"
          />
        </div>
      </div>
      <div class="col-grow" />
      <q-btn
        type="submit"
        unelevated
        no-caps
        color="primary"
        class="safic-btn"
        label="Guardar ubicación"
        :loading="actualizar.isPending.value"
        :disable="!hayCambios"
      />
    </div>
    <MapaUbicacion
      v-model:latitud="formulario.latitud"
      v-model:longitud="formulario.longitud"
      class="ubicacion__mapa"
      :centro="centroMapa"
    />
  </q-form>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import MapaUbicacion from '@/components/MapaUbicacion.vue';
import { aApiError } from '@/core/api/errors';
import { useUbicaciones } from '@/core/catalogos/ubicaciones';

import { useActualizarDatosCondominio } from '../composables/useDatosCondominio';
import {
  CAMPOS_API_UBICACION,
  peticionUbicacion,
  ubicacionDesde,
  validarUbicacion,
  type FormularioUbicacion,
} from '../datos-condominio.logica';
import type { DatosCondominio } from '../services/condominio.service';

const props = defineProps<{ datos: DatosCondominio }>();

const $q = useQuasar();
const ubicaciones = useUbicaciones();
const actualizar = useActualizarDatosCondominio();

const formulario = reactive<FormularioUbicacion>(ubicacionDesde(props.datos));
const errores = reactive<Partial<Record<keyof FormularioUbicacion, string>>>({});
const errorGeneral = ref<string | null>(null);

const hayCambios = computed(
  () => JSON.stringify(formulario) !== JSON.stringify(ubicacionDesde(props.datos)),
);

// Un refresco no pisa lo que se está escribiendo
watch(
  () => props.datos,
  (nuevo) => {
    if (!hayCambios.value) {
      Object.assign(formulario, ubicacionDesde(nuevo));
    }
  },
);

const provincia = computed(() =>
  ubicaciones.data.value?.find((p) => p.codigo === formulario.provincia),
);
const canton = computed(() =>
  provincia.value?.cantones.find((c) => c.codigo === formulario.canton),
);

const opcionesProvincias = computed(() =>
  (ubicaciones.data.value ?? []).map((p) => ({ label: p.nombre, value: p.codigo })),
);
const opcionesCantones = computed(() =>
  (provincia.value?.cantones ?? []).map((c) => ({ label: c.nombre, value: c.codigo })),
);
const opcionesParroquias = computed(() =>
  (canton.value?.parroquias ?? []).map((q) => ({ label: q.nombre, value: q.codigo })),
);

/** Dónde abre el mapa si todavía no hay pin: el cantón elegido (o la provincia). */
const centroMapa = computed(() => {
  const lugar = canton.value ?? provincia.value;
  const lat = Number(lugar?.latitud);
  const lng = Number(lugar?.longitud);
  return lugar && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
});

function cambioProvincia(): void {
  formulario.canton = '';
  formulario.parroquia = '';
}

function cambioCanton(): void {
  formulario.parroquia = '';
}

async function guardar(): Promise<void> {
  for (const campo of Object.keys(errores) as (keyof FormularioUbicacion)[]) {
    delete errores[campo];
  }
  errorGeneral.value = null;

  Object.assign(errores, validarUbicacion(formulario));
  if (Object.keys(errores).length > 0) {
    return;
  }

  try {
    Object.assign(
      formulario,
      ubicacionDesde(await actualizar.mutateAsync(peticionUbicacion(formulario))),
    );
    $q.notify({ type: 'positive', message: 'Ubicación guardada.' });
  } catch (error) {
    const apiError = aApiError(error);
    let pintado = false;
    for (const [campoApi, campo] of Object.entries(CAMPOS_API_UBICACION)) {
      const mensaje = apiError.campo(campoApi);
      if (mensaje) {
        errores[campo] = mensaje;
        pintado = true;
      }
    }
    if (!pintado) {
      errorGeneral.value = apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.ubicacion {
  display: flex;
  gap: 18px;
  flex-grow: 1;
  min-height: 0;
}

.ubicacion__campos {
  width: 420px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.ubicacion__titulo {
  font-size: 14px;
  font-weight: 800;
}

.ubicacion__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.ubicacion__par {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ubicacion__mapa {
  flex-grow: 1;
  min-width: 0;
  min-height: 280px;
}

.ubicacion__coordenadas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 1023px) {
  .ubicacion {
    flex-direction: column;
  }

  .ubicacion__campos {
    width: 100%;
  }
}
</style>
