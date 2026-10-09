<template>
  <!-- Panel "Agregar amenidad" (mockup F1AmenidadesCondominio) -->
  <div class="cabecera">
    <h2 class="cabecera__titulo">Agregar amenidad</h2>
    <button
      type="button"
      class="cabecera__cerrar"
      :disabled="agregar.isPending.value"
      @click="emit('cerrar')"
    >
      Cerrar
    </button>
  </div>

  <div class="fuentes" role="tablist" aria-label="Origen de la amenidad">
    <button
      v-for="f in FUENTES"
      :key="f.id"
      type="button"
      role="tab"
      class="fuentes__btn"
      :class="{ 'fuentes__btn--activa': formulario.origen === f.id }"
      :aria-selected="formulario.origen === f.id"
      @click="elegirOrigen(f.id)"
    >
      {{ f.label }}
    </button>
  </div>

  <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

  <template v-if="formulario.origen === 'catalogo'">
    <div class="seccion">ELIGE DEL CATÁLOGO</div>
    <div v-if="catalogo.isPending.value" class="estado-carga" aria-busy="true">
      Cargando catálogo…
    </div>
    <div v-else-if="catalogo.isError.value" class="safic-alerta" role="alert">
      {{ catalogo.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="catalogo.refetch()" />
    </div>
    <div v-else class="tipos">
      <button
        v-for="t in tipos"
        :key="t.id"
        type="button"
        class="tipos__chip"
        :class="{ 'tipos__chip--activo': formulario.tipoId === t.id }"
        :aria-pressed="formulario.tipoId === t.id"
        @click="elegirTipo(t.id)"
      >
        {{ t.nombre }}{{ yaUsados(t.nombre) ? ` · tienes ${yaUsados(t.nombre)}` : '' }}
      </button>
    </div>
    <div v-if="errores.tipoId" class="campo__error">{{ errores.tipoId }}</div>
  </template>

  <template v-else>
    <div class="campo">
      <label for="amenidad-nombre">Nombre</label>
      <input
        id="amenidad-nombre"
        v-model="formulario.nombre"
        class="campo__control"
        maxlength="70"
        placeholder="Ej. Muelle, Huerto, Sala de cine"
      />
      <span v-if="errores.nombre" class="campo__error">{{ errores.nombre }}</span>
    </div>
    <div class="campo">
      <label for="amenidad-categoria">Categoría</label>
      <select
        id="amenidad-categoria"
        v-model="formulario.categoria"
        class="campo__control campo__control--select"
      >
        <option v-for="c in CATEGORIAS" :key="c.valor" :value="c.valor">{{ c.etiqueta }}</option>
      </select>
    </div>
    <div class="reservable">
      <div class="col-grow">
        <div class="reservable__titulo">Reservable</div>
        <div class="reservable__ayuda">Los residentes podrán reservarla</div>
      </div>
      <button
        type="button"
        role="switch"
        class="interruptor"
        :class="{ 'interruptor--activo': formulario.reservable }"
        :aria-checked="formulario.reservable"
        aria-label="Reservable"
        @click="formulario.reservable = !formulario.reservable"
      >
        <span class="interruptor__perilla" />
      </button>
    </div>
  </template>

  <div class="par">
    <div class="campo">
      <span id="amenidad-cantidad">Cantidad</span>
      <div class="contador" role="group" aria-labelledby="amenidad-cantidad">
        <button
          type="button"
          class="contador__btn"
          aria-label="Menos"
          @click="formulario.cantidad = Math.max(1, formulario.cantidad - 1)"
        >
          −
        </button>
        <span class="contador__valor" aria-live="polite">{{ formulario.cantidad }}</span>
        <button
          type="button"
          class="contador__btn"
          aria-label="Más"
          @click="formulario.cantidad = Math.min(20, formulario.cantidad + 1)"
        >
          +
        </button>
      </div>
    </div>
    <div class="campo">
      <label for="amenidad-ubicacion">Ubicación</label>
      <input
        id="amenidad-ubicacion"
        v-model="formulario.ubicacion"
        class="campo__control"
        list="amenidad-ubicaciones"
        maxlength="80"
        autocomplete="off"
      />
      <datalist id="amenidad-ubicaciones">
        <option v-for="u in ubicaciones" :key="u" :value="u" />
      </datalist>
      <span v-if="errores.ubicacion" class="campo__error">{{ errores.ubicacion }}</span>
    </div>
  </div>

  <div class="aviso" :class="`aviso--${vista.tono}`" role="status">{{ vista.texto }}</div>
  <div class="col-grow" />
  <button
    type="button"
    class="agregar"
    :class="{ 'agregar--activo': vista.valido }"
    :disabled="!vista.valido || agregar.isPending.value"
    @click="enviar"
  >
    {{
      agregar.isPending.value
        ? 'Agregando…'
        : vista.nombres.length > 1
          ? `Agregar ${vista.nombres.length} amenidades`
          : 'Agregar amenidad'
    }}
  </button>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useBloques } from '@/modules/unidades/composables/useBloques';

import { useAgregarAmenidad, useCatalogoAmenidades } from '../composables/useAmenidades';
import {
  CAMPOS_API_AMENIDAD,
  CATEGORIAS,
  FORMULARIO_AMENIDAD_VACIO,
  peticionAmenidad,
  ubicacionesSugeridas,
  vistaAmenidad,
  type FormularioAmenidad,
} from '../amenidades.logica';
import type { AmenidadCondominio, OrigenAmenidad } from '../services/amenidades.service';

const props = defineProps<{ amenidades: AmenidadCondominio[] }>();
const emit = defineEmits<{ cerrar: []; agregadas: [creadas: AmenidadCondominio[]] }>();

const FUENTES: { id: OrigenAmenidad; label: string }[] = [
  { id: 'catalogo', label: 'Del catálogo' },
  { id: 'propia', label: 'Crear propia' },
];

const $q = useQuasar();
const catalogo = useCatalogoAmenidades(() => true);
const bloques = useBloques();
const agregar = useAgregarAmenidad();

const formulario = reactive<FormularioAmenidad>({ ...FORMULARIO_AMENIDAD_VACIO });
const errores = reactive<Partial<Record<keyof FormularioAmenidad, string>>>({});
const errorGeneral = ref<string | null>(null);

const tipos = computed(() => catalogo.data.value ?? []);
const ubicaciones = computed(() =>
  ubicacionesSugeridas((bloques.data.value ?? []).map((b) => b.nombre)),
);
const vista = computed(() => vistaAmenidad(formulario, tipos.value, props.amenidades));

function yaUsados(nombreTipo: string): number {
  return props.amenidades.filter((a) => a.tipo === nombreTipo).length;
}

function elegirOrigen(id: OrigenAmenidad) {
  formulario.origen = id;
  formulario.cantidad = 1;
}

function elegirTipo(id: number) {
  formulario.tipoId = id;
  formulario.cantidad = 1;
}

async function enviar(): Promise<void> {
  if (!vista.value.valido) {
    return;
  }
  for (const campo of Object.keys(errores) as (keyof FormularioAmenidad)[]) {
    delete errores[campo];
  }
  errorGeneral.value = null;

  try {
    const creadas = await agregar.mutateAsync(peticionAmenidad(formulario));
    $q.notify({
      type: 'positive',
      message:
        creadas.length > 1 ? `${creadas.length} amenidades agregadas.` : 'Amenidad agregada.',
    });
    emit('agregadas', creadas);
  } catch (e) {
    const apiError = aApiError(e);
    let pintado = false;
    for (const [campoApi, campo] of Object.entries(CAMPOS_API_AMENIDAD)) {
      const mensaje = apiError.campo(campoApi);
      if (mensaje) {
        (errores as Record<string, string>)[campo] = mensaje;
        pintado = true;
      }
    }
    if (!pintado) {
      // AMENIDAD_EXISTE u otro error: el mensaje ya viene en español
      errorGeneral.value = apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.cabecera {
  display: flex;
  align-items: center;
}

.cabecera__titulo {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 800;
  flex-grow: 1;
  letter-spacing: 0;
}

.cabecera__cerrar {
  border: none;
  background: none;
  color: var(--safic-texto-suave);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.fuentes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f1efe8;
  border-radius: 10px;
  padding: 4px;
}

.fuentes__btn {
  height: 36px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  background: transparent;
  color: var(--safic-texto-suave);
}

.fuentes__btn--activa {
  background: #ffffff;
  color: var(--safic-texto);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.seccion {
  font-size: 12px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.tipos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tipos__chip {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  background: #ffffff;
  color: var(--safic-texto-2);
  border: 1px solid var(--safic-borde-2);
}

.tipos__chip--activo {
  background: var(--q-primary);
  color: #ffffff;
  border-color: var(--q-primary);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.campo__control {
  height: 40px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  color: var(--safic-texto);
  background: #ffffff;
  box-sizing: border-box;
  width: 100%;
}

.campo__control--select {
  padding: 0 8px;
  font-size: 14px;
}

.campo__control:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 1px;
}

.reservable {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--safic-borde);
  border-radius: 10px;
  padding: 10px 12px;
}

.reservable__titulo {
  font-size: 13px;
  font-weight: 700;
}

.reservable__ayuda {
  font-size: 11px;
  color: var(--safic-texto-suave);
}

.interruptor {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  position: relative;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  background: var(--safic-borde-2);
}

.interruptor--activo {
  background: var(--q-primary);
}

.interruptor__perilla {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: left 0.15s;
}

.interruptor--activo .interruptor__perilla {
  left: 23px;
}

.par {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.contador {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
}

.contador__btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 18px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
}

.contador__valor {
  min-width: 28px;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  color: var(--safic-texto);
}

.estado-carga {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.campo__error {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-negative);
}

.aviso {
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
}

.aviso--neutro {
  background: #f1efe8;
  color: var(--safic-texto-2);
}

.aviso--error {
  background: #fde8e6;
  color: #7f1810;
}

.aviso--info {
  background: #e6ecf7;
  color: #23407a;
}

.aviso--exito {
  background: #e3efec;
  color: #0b4a47;
}

.agregar {
  height: 46px;
  flex-shrink: 0;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: not-allowed;
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.agregar--activo {
  cursor: pointer;
  background: var(--q-primary);
  color: #ffffff;
}
</style>
