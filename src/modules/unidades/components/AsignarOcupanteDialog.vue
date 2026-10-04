<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo asignar">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Asignar ocupante</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Unidad {{ codigo }}. Elige una persona registrada o regístrala aquí.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <!-- Persona: existente o nueva -->
          <div class="safic-campo">
            <div class="row items-center justify-between">
              <label for="ao-persona" class="safic-campo__etiqueta">Persona</label>
              <button type="button" class="asignar__enlace" @click="nueva = !nueva">
                {{ nueva ? 'Buscar una registrada' : 'Registrar persona nueva' }}
              </button>
            </div>
            <q-select
              v-if="!nueva"
              v-model="personaId"
              for="ao-persona"
              class="safic-input"
              outlined
              use-input
              input-debounce="300"
              emit-value
              map-options
              :options="opcionesPersona"
              :loading="personas.isFetching.value"
              placeholder="Nombre o número de documento"
              hide-bottom-space
              :error="!!errores.persona"
              :error-message="errores.persona"
              @filter="filtrar"
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-suave">
                    Nadie coincide. Usa «Registrar persona nueva».
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div v-if="nueva" class="asignar__persona">
            <div class="asignar__dos">
              <div class="safic-campo">
                <label for="ao-tipo" class="safic-campo__etiqueta">Tipo de documento</label>
                <q-select
                  v-model="persona.tipoDocumento"
                  for="ao-tipo"
                  class="safic-input"
                  outlined
                  emit-value
                  map-options
                  :options="TIPOS_DOCUMENTO.map((t) => ({ label: t.texto, value: t.valor }))"
                />
              </div>
              <div class="safic-campo">
                <label for="ao-documento" class="safic-campo__etiqueta">Número de documento</label>
                <q-input
                  v-model="persona.documento"
                  for="ao-documento"
                  class="safic-input"
                  outlined
                  maxlength="20"
                  hide-bottom-space
                  :error="!!erroresPersona.documento"
                  :error-message="erroresPersona.documento"
                />
              </div>
            </div>
            <div class="asignar__dos">
              <div class="safic-campo">
                <label for="ao-nombres" class="safic-campo__etiqueta">Nombres</label>
                <q-input
                  v-model="persona.nombres"
                  for="ao-nombres"
                  class="safic-input"
                  outlined
                  maxlength="80"
                  hide-bottom-space
                  :error="!!erroresPersona.nombres"
                  :error-message="erroresPersona.nombres"
                />
              </div>
              <div class="safic-campo">
                <label for="ao-apellidos" class="safic-campo__etiqueta">Apellidos</label>
                <q-input
                  v-model="persona.apellidos"
                  for="ao-apellidos"
                  class="safic-input"
                  outlined
                  maxlength="80"
                  hide-bottom-space
                  :error="!!erroresPersona.apellidos"
                  :error-message="erroresPersona.apellidos"
                />
              </div>
            </div>
            <div class="asignar__dos">
              <div class="safic-campo">
                <label for="ao-telefono" class="safic-campo__etiqueta">Celular</label>
                <q-input
                  v-model="persona.telefono"
                  for="ao-telefono"
                  class="safic-input"
                  outlined
                  inputmode="tel"
                  placeholder="09XXXXXXXX"
                  hide-bottom-space
                  :error="!!erroresPersona.telefono"
                  :error-message="erroresPersona.telefono"
                />
              </div>
              <div class="safic-campo">
                <label for="ao-email" class="safic-campo__etiqueta">Correo (opcional)</label>
                <q-input
                  v-model="persona.email"
                  for="ao-email"
                  class="safic-input"
                  outlined
                  type="email"
                  hide-bottom-space
                  :error="!!erroresPersona.email"
                  :error-message="erroresPersona.email"
                />
              </div>
            </div>
          </div>

          <!-- Relación con la unidad -->
          <div class="asignar__dos">
            <div class="safic-campo">
              <label for="ao-relacion" class="safic-campo__etiqueta">Relación</label>
              <q-select
                v-model="relacion"
                for="ao-relacion"
                class="safic-input"
                outlined
                emit-value
                map-options
                :options="RELACIONES.map((r) => ({ label: r.texto, value: r.valor }))"
                hide-bottom-space
                :error="!!errores.relacion"
                :error-message="errores.relacion"
              />
            </div>
            <div class="safic-campo justify-end">
              <q-toggle
                v-model="esPrincipal"
                :disable="relacion === 'contacto_emergencia'"
                label="Es el ocupante principal"
              />
              <div class="text-suave" style="font-size: 12px">
                Quien vive en la unidad como titular.
              </div>
              <div v-if="errores.principal" class="asignar__error" role="alert">
                {{ errores.principal }}
              </div>
            </div>
          </div>

          <div class="asignar__dos">
            <div class="safic-campo">
              <label for="ao-inicio" class="safic-campo__etiqueta">Desde</label>
              <q-input
                v-model="fechaInicio"
                for="ao-inicio"
                class="safic-input"
                outlined
                type="date"
                hide-bottom-space
                :error="!!errores.fechaInicio"
                :error-message="errores.fechaInicio"
              />
            </div>
            <div class="safic-campo">
              <label for="ao-fin" class="safic-campo__etiqueta">Hasta (opcional)</label>
              <q-input
                v-model="fechaFin"
                for="ao-fin"
                class="safic-input"
                outlined
                type="date"
                hide-bottom-space
                :error="!!errores.fechaFin"
                :error-message="errores.fechaFin"
              />
            </div>
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="ocupado"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Asignar ocupante"
              :loading="ocupado"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, reactive, ref, toRef, watch } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useBuscarPersonas, useCrearPersona } from '../composables/usePersonas';
import { useAsignarOcupante } from '../composables/useUnidades';
import {
  CAMPOS_API_PERSONA,
  RELACIONES,
  TIPOS_DOCUMENTO,
  hoyEcuador,
  personaVacia,
  validarPersona,
  type CampoPersona,
} from '../persona.formulario';
import type { Persona } from '../services/personas.service';
import type { Ocupante, RelacionOcupante } from '../services/unidades.service';

const props = defineProps<{ unidadId: number; codigo: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<Ocupante>();

const nueva = ref(false);
const buscar = ref('');
const personaId = ref<number | null>(null);
const persona = reactive(personaVacia());
const relacion = ref<RelacionOcupante>('propietario');
const esPrincipal = ref(false);
const fechaInicio = ref(hoyEcuador());
const fechaFin = ref('');

type CampoOcupante = 'persona' | 'relacion' | 'principal' | 'fechaInicio' | 'fechaFin';
const errores = reactive<Partial<Record<CampoOcupante, string | undefined>>>({});
const erroresPersona = reactive<Partial<Record<CampoPersona, string>>>({});
const errorGeneral = ref<string | null>(null);

// Personas ya creadas en este diálogo (por si se reintenta la asignación)
const creada = ref<Persona | null>(null);

const personas = useBuscarPersonas(buscar);
const crearPersona = useCrearPersona();
const asignar = useAsignarOcupante(toRef(props, 'unidadId'));
const ocupado = computed(() => crearPersona.isPending.value || asignar.isPending.value);

const opcionesPersona = computed(() =>
  (personas.data.value?.personas ?? []).map((p) => ({
    label: `${p.nombre_completo} · ${p.documento}`,
    value: p.id,
  })),
);

// Si cambian los datos de la persona nueva, se registra otra vez (no se reutiliza la creada)
watch(
  () => ({ ...persona }),
  () => {
    creada.value = null;
  },
);

watch(relacion, (r) => {
  if (r === 'contacto_emergencia') esPrincipal.value = false;
});

function filtrar(texto: string, actualizar: (fn: () => void) => void): void {
  actualizar(() => {
    buscar.value = texto;
  });
}

function limpiarErrores(): void {
  for (const k of Object.keys(errores) as CampoOcupante[]) delete errores[k];
  for (const k of Object.keys(erroresPersona) as CampoPersona[]) delete erroresPersona[k];
  errorGeneral.value = null;
}

async function obtenerPersonaId(): Promise<number | null> {
  if (!nueva.value) {
    if (personaId.value === null) errores.persona = 'Elige la persona.';
    return personaId.value;
  }
  if (creada.value) return creada.value.id;

  const validacion = validarPersona(persona);
  if (!validacion.ok) {
    Object.assign(erroresPersona, validacion.errores);
    return null;
  }
  try {
    creada.value = await crearPersona.mutateAsync(validacion.datos);
    return creada.value.id;
  } catch (error) {
    const apiError = aApiError(error);
    let enCampo = false;
    for (const [campoApi, campo] of Object.entries(CAMPOS_API_PERSONA)) {
      const mensaje = apiError.campo(campoApi);
      if (mensaje) {
        erroresPersona[campo] = mensaje;
        enCampo = true;
      }
    }
    if (!enCampo) errorGeneral.value = apiError.mensaje;
    return null;
  }
}

async function guardar(): Promise<void> {
  if (ocupado.value) return;
  limpiarErrores();

  if (!fechaInicio.value) errores.fechaInicio = 'Indica desde cuándo.';
  if (fechaFin.value && fechaFin.value < fechaInicio.value) {
    errores.fechaFin = 'La fecha de fin no puede ser anterior al inicio.';
  }

  const id = await obtenerPersonaId();
  if (id === null || errores.fechaInicio || errores.fechaFin) return;

  try {
    onDialogOK(
      await asignar.mutateAsync({
        persona_id: id,
        relacion: relacion.value,
        es_principal: esPrincipal.value,
        fecha_inicio: fechaInicio.value,
        fecha_fin: fechaFin.value || null,
      }),
    );
  } catch (error) {
    const apiError = aApiError(error);
    switch (apiError.codigo) {
      case 'PRINCIPAL_OCUPADO':
        // La unidad ya tiene principal en esas fechas: se puede asignar sin marcarlo
        errores.principal = apiError.mensaje;
        break;
      case 'OCUPANTE_DUPLICADO':
        errores.relacion = apiError.mensaje;
        break;
      default:
        errores.persona = apiError.campo('persona_id');
        errores.relacion = apiError.campo('relacion') ?? apiError.campo('es_principal');
        errores.fechaInicio = apiError.campo('fecha_inicio');
        errores.fechaFin = apiError.campo('fecha_fin');
        if (!Object.values(errores).some(Boolean)) errorGeneral.value = apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.asignar {
  width: 640px;
  max-width: 100%;
}

.asignar__dos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.asignar__persona {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: var(--safic-radio-control);
  background: var(--safic-fondo-2);
  border: 1px solid var(--safic-linea);
}

.asignar__enlace {
  border: none;
  background: none;
  padding: 0;
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.asignar__enlace:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.asignar__error {
  font-size: 12px;
  font-weight: 700;
  color: #9b1c12;
}

@media (max-width: 599px) {
  .asignar__dos {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
