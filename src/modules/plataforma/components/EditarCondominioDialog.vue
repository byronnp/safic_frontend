<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 640px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Editar condominio</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              {{ condominio.nombre }} · {{ condominio.codigo }}. Los cambios quedan en la bitácora.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="ec-nombre" class="safic-campo__etiqueta">Nombre</label>
            <q-input
              v-model="f.nombre"
              for="ec-nombre"
              class="safic-input"
              outlined
              maxlength="120"
              autofocus
              hide-bottom-space
              :error="!!errores.nombre"
              :error-message="errores.nombre"
            />
          </div>

          <div class="ec__fila">
            <div class="safic-campo">
              <label for="ec-tipo" class="safic-campo__etiqueta">Tipo</label>
              <q-select
                v-model="f.tipo"
                for="ec-tipo"
                class="safic-input"
                outlined
                emit-value
                map-options
                :options="TIPOS_CONDOMINIO.map((t) => ({ value: t.valor, label: t.etiqueta }))"
              />
            </div>
            <div class="safic-campo">
              <label for="ec-ruc" class="safic-campo__etiqueta">RUC</label>
              <q-input
                v-model="f.ruc"
                for="ec-ruc"
                class="safic-input"
                outlined
                inputmode="numeric"
                maxlength="13"
                hide-bottom-space
                :error="!!errores.ruc"
                :error-message="errores.ruc"
              />
            </div>
          </div>

          <div class="safic-campo">
            <label for="ec-razon" class="safic-campo__etiqueta">Razón social</label>
            <q-input
              v-model="f.razon_social"
              for="ec-razon"
              class="safic-input"
              outlined
              maxlength="160"
              hide-bottom-space
              :error="!!errores.razon_social"
              :error-message="errores.razon_social"
            />
          </div>

          <div class="safic-campo">
            <label for="ec-direccion" class="safic-campo__etiqueta">Dirección</label>
            <q-input
              v-model="f.direccion"
              for="ec-direccion"
              class="safic-input"
              outlined
              maxlength="200"
              hide-bottom-space
              :error="!!errores.direccion"
              :error-message="errores.direccion"
            />
            <div class="text-suave" style="font-size: 12px">
              La provincia, el cantón, la parroquia y el mapa los edita el administrador del
              condominio en «Datos del condominio».
            </div>
          </div>

          <div class="ec__fila">
            <div class="safic-campo">
              <label for="ec-telefono" class="safic-campo__etiqueta">Teléfono</label>
              <q-input
                v-model="f.telefono"
                for="ec-telefono"
                class="safic-input"
                outlined
                inputmode="tel"
                maxlength="10"
                hide-bottom-space
                :error="!!errores.telefono"
                :error-message="errores.telefono"
              />
            </div>
            <div class="safic-campo">
              <label for="ec-correo" class="safic-campo__etiqueta">Correo de contacto</label>
              <q-input
                v-model="f.email_contacto"
                for="ec-correo"
                class="safic-input"
                outlined
                type="email"
                hide-bottom-space
                :error="!!errores.email_contacto"
                :error-message="errores.email_contacto"
              />
            </div>
          </div>

          <div class="ec__fila">
            <div class="safic-campo">
              <label for="ec-unidades" class="safic-campo__etiqueta">Total de unidades</label>
              <q-input
                v-model="f.total_unidades"
                for="ec-unidades"
                class="safic-input"
                outlined
                inputmode="numeric"
                hide-bottom-space
                :error="!!errores.total_unidades"
                :error-message="errores.total_unidades"
              />
            </div>
            <div class="safic-campo">
              <label for="ec-plan" class="safic-campo__etiqueta">Plan</label>
              <q-select
                v-model="f.plan_codigo"
                for="ec-plan"
                class="safic-input"
                outlined
                emit-value
                map-options
                hide-bottom-space
                :loading="planes.isPending.value"
                :options="
                  (planes.data.value ?? []).map((p) => ({ value: p.codigo, label: p.nombre }))
                "
                :error="!!errores.plan_codigo"
                :error-message="errores.plan_codigo"
              />
            </div>
            <div class="safic-campo">
              <label for="ec-valor" class="safic-campo__etiqueta">Valor por unidad (USD)</label>
              <q-input
                v-model="f.valor_unidad"
                for="ec-valor"
                class="safic-input"
                outlined
                inputmode="decimal"
                prefix="$"
                hide-bottom-space
                :error="!!errores.valor_unidad"
                :error-message="errores.valor_unidad"
              />
            </div>
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="editar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Guardar cambios"
              :loading="editar.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useEditarCondominio, usePlanes } from '../composables/usePlataforma';
import {
  cambiosDe,
  formularioDe,
  TIPOS_CONDOMINIO,
  validarEdicion,
  type ErroresEdicion,
} from '../condominio-edicion.logica';
import type { CondominioPlataforma } from '../services/plataforma.service';

const props = defineProps<{ condominio: CondominioPlataforma }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<CondominioPlataforma>();

const f = reactive(formularioDe(props.condominio));
const errores = reactive<ErroresEdicion>({});
const errorGeneral = ref<string | null>(null);

const planes = usePlanes();
const editar = useEditarCondominio();

/** Campos de la API → campos del formulario, para pintar el error bajo cada uno. */
const CAMPOS_API = {
  nombre: 'nombre',
  tipo: 'tipo',
  ruc: 'ruc',
  razon_social: 'razon_social',
  direccion: 'direccion',
  telefono: 'telefono',
  email_contacto: 'email_contacto',
  total_unidades: 'total_unidades',
  plan_codigo: 'plan_codigo',
  valor_unidad: 'valor_unidad',
} as const;

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se guarda dos veces
  if (editar.isPending.value) return;
  errorGeneral.value = null;
  for (const k of Object.keys(CAMPOS_API) as (keyof typeof CAMPOS_API)[]) errores[k] = undefined;

  const problemas = validarEdicion(f);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  const cambios = cambiosDe(props.condominio, f);
  if (Object.keys(cambios).length === 0) {
    onDialogCancel();
    return;
  }

  try {
    onDialogOK(await editar.mutateAsync({ id: props.condominio.id, cambios }));
  } catch (error) {
    const apiError = aApiError(error);
    let hayCampo = false;
    for (const [api, campo] of Object.entries(CAMPOS_API)) {
      const mensaje = apiError.campo(api);
      if (mensaje) {
        errores[campo] = mensaje;
        hayCampo = true;
      }
    }
    // Decide el código: el total de unidades no baja de las registradas
    if (apiError.codigo === 'UNIDADES_REGISTRADAS') {
      errores.total_unidades = apiError.mensaje;
      hayCampo = true;
    }
    if (!hayCampo) errorGeneral.value = apiError.mensaje;
  }
}
</script>

<style scoped>
.ec__fila {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
}
</style>
