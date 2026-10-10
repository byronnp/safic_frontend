<template>
  <!-- Panel de detalle de una amenidad (mockup F1AmenidadesCondominio) -->
  <AmenidadesFotos :amenidad="amenidad" />
  <div>
    <div class="detalle__antetitulo">
      {{ amenidad.tipo ?? 'Propia del condominio' }} ·
      {{ amenidad.origen === 'catalogo' ? 'del catálogo' : 'propia' }}
    </div>
    <div class="detalle__nombre">{{ amenidad.nombre }}</div>
  </div>
  <div class="datos">
    <div v-for="dato in datos" :key="dato.k" class="datos__fila">
      <span class="datos__clave">{{ dato.k }}</span
      ><strong>{{ dato.v }}</strong>
      <button
        v-if="dato.k === 'Ubicación' && !editandoUbicacion"
        type="button"
        class="datos__editar"
        :disabled="ocupado"
        :aria-label="`Editar la ubicación de ${amenidad.nombre}`"
        @click="editarUbicacion"
      >
        Editar
      </button>
    </div>
  </div>

  <form
    v-if="editandoUbicacion"
    class="mantenimiento"
    novalidate
    @submit.prevent="guardarUbicacion"
  >
    <label>
      Ubicación
      <input
        v-model="ubicacion"
        list="amenidad-ubicaciones-detalle"
        maxlength="90"
        placeholder="Área social, Torre A…"
      />
    </label>
    <datalist id="amenidad-ubicaciones-detalle">
      <option v-for="u in sugeridas" :key="u" :value="u" />
    </datalist>
    <div v-if="errorUbicacionTexto" class="mantenimiento__error">{{ errorUbicacionTexto }}</div>
    <div class="mantenimiento__botones">
      <button type="button" class="acciones__btn" @click="editandoUbicacion = false">
        Cancelar
      </button>
      <button type="submit" class="acciones__btn" :disabled="ocupado">Guardar</button>
    </div>
  </form>
  <router-link v-if="amenidad.reservable" :to="{ name: 'areas-reglas' }" class="configurar">
    Configurar reservas y cobro
  </router-link>

  <div v-if="error" class="safic-alerta" role="alert">{{ error }}</div>

  <form v-if="pidiendoFecha" class="mantenimiento" novalidate @submit.prevent="ponerMantenimiento">
    <label>
      Mantenimiento hasta
      <input v-model="hasta" type="date" :min="hoy" />
    </label>
    <div v-if="errorFecha" class="mantenimiento__error">{{ errorFecha }}</div>
    <div class="mantenimiento__botones">
      <button type="button" class="acciones__btn" @click="pidiendoFecha = false">Cancelar</button>
      <button type="submit" class="acciones__btn" :disabled="ocupado">Confirmar</button>
    </div>
  </form>

  <div class="col-grow" />
  <div class="nota" :class="{ 'nota--mantenimiento': amenidad.estado === 'mantenimiento' }">
    {{ nota }}
  </div>
  <div class="acciones">
    <template v-if="amenidad.estado === 'inactiva'">
      <button type="button" class="acciones__btn" :disabled="ocupado" @click="cambiarActiva(true)">
        Reactivar
      </button>
    </template>
    <template v-else>
      <button
        type="button"
        class="acciones__btn"
        :disabled="ocupado"
        @click="alternarMantenimiento"
      >
        {{
          amenidad.estado === 'mantenimiento' ? 'Quitar mantenimiento' : 'Poner en mantenimiento'
        }}
      </button>
      <button
        type="button"
        class="acciones__btn acciones__btn--peligro"
        :disabled="ocupado"
        @click="confirmarDesactivar"
      >
        Desactivar
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useBloques } from '@/modules/unidades/composables/useBloques';

import {
  detalleAmenidad,
  errorUbicacion,
  estadoAmenidad,
  ubicacionesSugeridas,
  ubicacionParaGuardar,
  usoAmenidad,
} from '../amenidades.logica';
import { useActualizarAmenidad } from '../composables/useAmenidades';
import AmenidadesFotos from './AmenidadesFotos.vue';
import type { ActualizarAmenidad, AmenidadCondominio } from '../services/amenidades.service';
import { hoyEcuador } from '../usuarios.logica';

const props = defineProps<{ amenidad: AmenidadCondominio }>();

const $q = useQuasar();
const actualizar = useActualizarAmenidad();
const bloques = useBloques();

const hoy = hoyEcuador();
const pidiendoFecha = ref(false);
const hasta = ref('');
const error = ref<string | null>(null);
const errorFecha = ref<string | null>(null);
const editandoUbicacion = ref(false);
const ubicacion = ref('');
const errorUbicacionTexto = ref<string | null>(null);
const sugeridas = computed(() =>
  ubicacionesSugeridas((bloques.data.value ?? []).map((b) => b.nombre)),
);
const ocupado = computed(() => actualizar.isPending.value);

// Al elegir otra amenidad no queda un formulario ni un error de la anterior
watch(
  () => props.amenidad.id,
  () => {
    pidiendoFecha.value = false;
    hasta.value = '';
    error.value = null;
    errorFecha.value = null;
    editandoUbicacion.value = false;
    errorUbicacionTexto.value = null;
  },
);

const datos = computed(() => [
  { k: 'Ubicación', v: props.amenidad.ubicacion ?? '—' },
  { k: 'Uso', v: usoAmenidad(props.amenidad) },
  { k: 'Detalle', v: detalleAmenidad(props.amenidad) },
  { k: 'Estado', v: estadoAmenidad(props.amenidad) },
]);

const nota = computed(() => {
  const a = props.amenidad;
  if (a.estado === 'inactiva') {
    return 'Inactiva: los residentes no la ven ni la pueden reservar. Se conserva su historial.';
  }
  if (a.estado === 'mantenimiento') {
    return 'En mantenimiento no se puede reservar. Las reservas ya hechas en esas fechas se avisan a los residentes.';
  }
  if (a.esencial) {
    return 'Amenidad esencial: nunca se restringe a residentes en mora.';
  }
  if (a.reservable) {
    return 'Si tiene reservas registradas no se puede eliminar, solo desactivar.';
  }
  return 'Visible para los residentes en Mi condominio.';
});

async function guardar(
  cambios: ActualizarAmenidad,
  mensaje: string,
  id: number = props.amenidad.id,
): Promise<boolean> {
  error.value = null;
  errorFecha.value = null;
  errorUbicacionTexto.value = null;
  try {
    await actualizar.mutateAsync({ id, datos: cambios });
    $q.notify({ type: 'positive', message: mensaje });
    return true;
  } catch (e) {
    const apiError = aApiError(e);
    const fecha = apiError.campo('mantenimiento_hasta');
    const lugar = apiError.campo('ubicacion');
    if (fecha) {
      errorFecha.value = fecha;
    } else if (lugar) {
      errorUbicacionTexto.value = lugar;
    } else {
      error.value = apiError.mensaje;
    }
    return false;
  }
}

function editarUbicacion(): void {
  ubicacion.value = props.amenidad.ubicacion ?? '';
  errorUbicacionTexto.value = null;
  editandoUbicacion.value = true;
}

async function guardarUbicacion(): Promise<void> {
  const invalido = errorUbicacion(ubicacion.value);
  if (invalido) {
    errorUbicacionTexto.value = invalido;
    return;
  }
  // Sin cambios no se llama a la API
  const nueva = ubicacionParaGuardar(ubicacion.value);
  if (nueva === props.amenidad.ubicacion) {
    editandoUbicacion.value = false;
    return;
  }
  if (await guardar({ ubicacion: nueva }, 'Ubicación actualizada.')) {
    editandoUbicacion.value = false;
  }
}

function alternarMantenimiento(): void {
  if (props.amenidad.estado === 'mantenimiento') {
    void guardar({ mantenimiento_hasta: null }, 'Mantenimiento terminado.');
    return;
  }
  pidiendoFecha.value = true;
}

async function ponerMantenimiento(): Promise<void> {
  if (hasta.value === '') {
    errorFecha.value = 'Elige hasta cuándo dura el mantenimiento.';
    return;
  }
  if (hasta.value < hoy) {
    errorFecha.value = 'La fecha de fin del mantenimiento no puede ser pasada.';
    return;
  }
  if (await guardar({ mantenimiento_hasta: hasta.value }, 'Amenidad en mantenimiento.')) {
    pidiendoFecha.value = false;
    hasta.value = '';
  }
}

function cambiarActiva(activa: boolean, id: number = props.amenidad.id): void {
  void guardar({ activa }, activa ? 'Amenidad reactivada.' : 'Amenidad desactivada.', id);
}

function confirmarDesactivar(): void {
  // Se toma la amenidad al abrir el diálogo, no al confirmar: si la lista cambia mientras tanto
  // no se desactiva otra
  const { id, nombre } = props.amenidad;
  // Los residentes dejan de verla: se pide confirmar
  $q.dialog({
    title: 'Desactivar amenidad',
    message: `${nombre} dejará de verse y de poder reservarse. Puedes reactivarla cuando quieras.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Desactivar', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => cambiarActiva(false, id));
}
</script>

<style scoped>
.detalle__antetitulo {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.detalle__nombre {
  font-size: 20px;
  font-weight: 800;
}

.datos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.datos__fila {
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--safic-linea-2);
  padding-bottom: 7px;
}

.datos__fila strong {
  text-align: right;
}

.datos__editar {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  color: var(--q-primary);
  cursor: pointer;
  text-decoration: underline;
}

.datos__editar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.datos__clave {
  flex-grow: 1;
  color: var(--safic-texto-suave);
}

.configurar {
  height: 42px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid var(--q-primary);
  color: var(--q-primary);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nota {
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
  background: #f1efe8;
  color: var(--safic-texto-2);
}

.nota--mantenimiento {
  background: #fff7ec;
  color: #7a3808;
}

.mantenimiento {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
}

.mantenimiento label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.mantenimiento input {
  height: 42px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  background: #ffffff;
}

.mantenimiento__error {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-negative);
}

.mantenimiento__botones {
  display: flex;
  gap: 8px;
}

.acciones {
  display: flex;
  gap: 10px;
}

.acciones__btn {
  flex-grow: 1;
  height: 44px;
  white-space: nowrap;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.acciones__btn--peligro {
  border-color: #9b1c12;
  color: #9b1c12;
}
</style>
