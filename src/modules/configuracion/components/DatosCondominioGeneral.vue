<template>
  <!-- Pestaña General (sin mockup): formulario sencillo con el estilo de Apariencia -->
  <q-form class="formulario" novalidate @submit="guardar">
    <div>
      <div class="formulario__titulo">Datos generales</div>
      <div class="formulario__ayuda">Aparecen en recibos, correos y en la app de residentes.</div>
    </div>

    <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

    <div class="formulario__grilla">
      <div class="safic-campo formulario__ancho">
        <label for="dc-gen-nombre" class="safic-campo__etiqueta">Nombre del condominio</label>
        <q-input
          v-model="formulario.nombre"
          for="dc-gen-nombre"
          class="safic-input"
          outlined
          dense
          maxlength="120"
          hide-bottom-space
          :error="!!errores.nombre"
          :error-message="errores.nombre"
        />
      </div>
      <div class="safic-campo">
        <label for="dc-gen-ruc" class="safic-campo__etiqueta">RUC</label>
        <q-input
          :model-value="datos.ruc ?? ''"
          for="dc-gen-ruc"
          class="safic-input"
          outlined
          dense
          readonly
          hint="Lo cambia la plataforma."
        />
      </div>
      <div class="safic-campo">
        <label for="dc-gen-razon" class="safic-campo__etiqueta">Razón social</label>
        <q-input
          :model-value="datos.razon_social ?? ''"
          for="dc-gen-razon"
          class="safic-input"
          outlined
          dense
          readonly
          hint="Lo cambia la plataforma."
        />
      </div>
      <div class="safic-campo">
        <label for="dc-gen-telefono" class="safic-campo__etiqueta">Teléfono</label>
        <q-input
          v-model="formulario.telefono"
          for="dc-gen-telefono"
          class="safic-input"
          outlined
          dense
          type="tel"
          hide-bottom-space
          :error="!!errores.telefono"
          :error-message="errores.telefono"
        />
      </div>
      <div class="safic-campo">
        <label for="dc-gen-correo" class="safic-campo__etiqueta">Correo de la administración</label>
        <q-input
          v-model="formulario.correo"
          for="dc-gen-correo"
          class="safic-input"
          outlined
          dense
          type="email"
          hide-bottom-space
          :error="!!errores.correo"
          :error-message="errores.correo"
        />
      </div>
      <div class="safic-campo formulario__ancho">
        <label for="dc-gen-direccion" class="safic-campo__etiqueta">Dirección</label>
        <q-input
          v-model="formulario.direccion"
          for="dc-gen-direccion"
          class="safic-input"
          outlined
          dense
          maxlength="200"
          hide-bottom-space
          :error="!!errores.direccion"
          :error-message="errores.direccion"
        />
      </div>
    </div>
    <div class="formulario__acciones">
      <q-btn
        type="submit"
        unelevated
        no-caps
        color="primary"
        class="safic-btn"
        label="Guardar datos"
        :loading="actualizar.isPending.value"
        :disable="!hayCambios"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useActualizarDatosCondominio } from '../composables/useDatosCondominio';
import {
  CAMPOS_API_GENERAL,
  generalDesde,
  peticionGeneral,
  validarGeneral,
  type FormularioGeneral,
} from '../datos-condominio.logica';
import type { DatosCondominio } from '../services/condominio.service';

const props = defineProps<{ datos: DatosCondominio }>();

const $q = useQuasar();
const actualizar = useActualizarDatosCondominio();

const formulario = reactive<FormularioGeneral>(generalDesde(props.datos));
const errores = reactive<Partial<Record<keyof FormularioGeneral, string>>>({});
const errorGeneral = ref<string | null>(null);

const hayCambios = computed(
  () => JSON.stringify(formulario) !== JSON.stringify(generalDesde(props.datos)),
);

// Después de guardar, el formulario parte de lo guardado
// Un refresco no pisa lo que se está escribiendo
watch(
  () => props.datos,
  (nuevo) => {
    if (!hayCambios.value) {
      Object.assign(formulario, generalDesde(nuevo));
    }
  },
);

async function guardar(): Promise<void> {
  for (const campo of Object.keys(errores) as (keyof FormularioGeneral)[]) {
    delete errores[campo];
  }
  errorGeneral.value = null;

  Object.assign(errores, validarGeneral(formulario));
  if (Object.keys(errores).length > 0) {
    return;
  }

  try {
    // Después de guardar, el formulario muestra lo guardado (ej. el teléfono sin espacios)
    Object.assign(
      formulario,
      generalDesde(await actualizar.mutateAsync(peticionGeneral(formulario))),
    );
    $q.notify({ type: 'positive', message: 'Datos del condominio guardados.' });
  } catch (error) {
    const apiError = aApiError(error);
    let pintado = false;
    for (const [campoApi, campo] of Object.entries(CAMPOS_API_GENERAL)) {
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
.formulario {
  max-width: 760px;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.formulario__titulo {
  font-size: 14px;
  font-weight: 800;
}

.formulario__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.formulario__grilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.formulario__ancho {
  grid-column: 1 / -1;
}

.formulario__acciones {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 599px) {
  .formulario__grilla {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
