<template>
  <q-page class="safic-main incidencias">
    <PaginaEncabezado miga="Seguridad y comunicación / Incidencias" titulo="Incidencias">
      <template #acciones>
        <div class="incidencias__promedio">
          Tiempo promedio de respuesta:
          <strong>{{
            textoTiempoPromedio(tablero.data.value?.tiempo_promedio_horas ?? null)
          }}</strong>
        </div>
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="incidencias__resultado" role="status">{{ resultado }}</div>
    <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>
    <div v-if="tablero.isError.value" class="safic-alerta" role="alert">
      {{ tablero.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="tablero.refetch()" />
    </div>

    <div class="incidencias__cuerpo">
      <div class="incidencias__tablero" :aria-busy="tablero.isPending.value">
        <template v-if="tablero.isPending.value">
          <q-skeleton v-for="i in 4" :key="i" type="rect" height="220px" />
        </template>
        <div v-for="col in columnas" v-else :key="col.estado" class="incidencias__columna">
          <div class="incidencias__col-cab">
            <div class="incidencias__col-nombre">{{ col.nombre }}</div>
            <div class="incidencias__col-n">{{ col.items.length }}</div>
          </div>
          <button
            v-for="t in col.items"
            :key="t.id"
            type="button"
            class="incidencias__tarjeta"
            :class="{ 'incidencias__tarjeta--activa': t.id === seleccionId }"
            :aria-pressed="t.id === seleccionId"
            @click="elegir(t.id)"
          >
            <span class="incidencias__tarjeta-meta">
              <IncidenciasPrioridad :prio="t.prioridad" />
              <span class="incidencias__cat">{{ etiquetaCategoria(t.categoria) }}</span>
            </span>
            <span class="incidencias__tarjeta-titulo">{{ t.titulo }}</span>
            <span class="incidencias__tarjeta-pie"
              >{{ t.unidad ?? 'Áreas comunes' }} · {{ hace(t.creada_en, ahora) }}</span
            >
          </button>
        </div>
        <div
          v-if="tablero.data.value && tablero.data.value.incidencias.length === 0"
          class="incidencias__vacio"
        >
          <q-icon name="sym_r_support_agent" size="40px" class="text-suave" />
          <div class="text-weight-bold">No hay incidencias</div>
          <div>Cuando un residente o el guardia reporte un problema, aparecerá aquí.</div>
        </div>
      </div>

      <aside class="incidencias__detalle" aria-label="Detalle de la incidencia">
        <div v-if="seleccionId === null" class="incidencias__vacio">
          Elige una incidencia para verla.
        </div>
        <q-skeleton v-else-if="detalle.isPending.value" type="rect" height="320px" />
        <div v-else-if="detalle.isError.value" class="safic-alerta" role="alert">
          {{ detalle.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="detalle.refetch()" />
        </div>
        <template v-else-if="sel">
          <div class="incidencias__det-meta">
            <IncidenciasPrioridad :prio="sel.prioridad" />
            <span class="incidencias__det-cat"
              >{{ etiquetaCategoria(sel.categoria) }} · #{{ sel.numero }}</span
            >
          </div>
          <h2 class="incidencias__det-titulo">{{ sel.titulo }}</h2>
          <div class="incidencias__det-autor">
            Reportado por {{ sel.autor ?? '—' }} · {{ sel.unidad ?? 'Áreas comunes' }} ·
            {{ hace(sel.creada_en, ahora) }}
          </div>
          <div class="incidencias__ajustes">
            <select
              class="incidencias__select"
              aria-label="Prioridad"
              :value="sel.prioridad"
              :disabled="ocupado || sel.estado === 'cerrado'"
              @change="
                cambiarPrioridad(($event.target as HTMLSelectElement).value as PrioridadIncidencia)
              "
            >
              <option v-for="p in PRIORIDADES" :key="p.id" :value="p.id">
                Prioridad {{ p.etiqueta.toLowerCase() }}
              </option>
            </select>
          </div>
          <div class="incidencias__det-desc">{{ sel.descripcion }}</div>
          <div v-if="sel.fotos.length" class="incidencias__fotos">
            <div v-for="(f, i) in sel.fotos" :key="f.id" class="incidencias__foto">
              <img v-if="f.url" :src="f.url" :alt="`Foto ${i + 1}`" referrerpolicy="no-referrer" />
              <span v-else>Foto {{ i + 1 }}</span>
            </div>
          </div>
          <div class="incidencias__seccion">COMENTARIOS</div>
          <div
            v-for="c in sel.comentarios"
            :key="c.id"
            class="incidencias__comentario"
            :class="{ 'incidencias__comentario--interna': c.interna }"
          >
            <strong>{{ c.interna ? 'Nota interna' : c.autor }}</strong> · {{ c.texto }}
          </div>
          <div v-if="sel.comentarios.length === 0" class="incidencias__vacio">
            Sin comentarios todavía.
          </div>
          <div class="incidencias__espacio" />
          <textarea
            v-model="texto"
            rows="2"
            maxlength="1000"
            class="incidencias__texto"
            aria-label="Escribe un comentario"
            placeholder="Escribe un comentario para el residente"
            :disabled="sel.estado === 'cerrado'"
          />
          <div v-if="errorTexto" class="incidencias__error" role="alert">{{ errorTexto }}</div>
          <div class="incidencias__acciones">
            <button
              type="button"
              class="incidencias__nota"
              :disabled="ocupado || sel.estado === 'cerrado'"
              @click="comentar(true)"
            >
              Nota interna
            </button>
            <button
              type="button"
              class="incidencias__nota"
              :disabled="ocupado || sel.estado === 'cerrado'"
              @click="comentar(false)"
            >
              Enviar al residente
            </button>
            <button
              type="button"
              class="incidencias__avanzar"
              :class="{ 'incidencias__avanzar--off': !avance.siguiente }"
              :disabled="!avance.siguiente || ocupado"
              @click="avanzar"
            >
              {{ avance.texto }}
            </button>
          </div>
        </template>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import IncidenciasPrioridad from '../components/IncidenciasPrioridad.vue';
import {
  useAjustarIncidencia,
  useCambiarEstadoIncidencia,
  useComentarIncidencia,
  useDetalleIncidencia,
  useTableroIncidencias,
} from '../composables/useIncidencias';
import {
  accionAvanzar,
  armarTablero,
  etiquetaCategoria,
  etiquetaEstado,
  hace,
  PRIORIDADES,
  textoTiempoPromedio,
} from '../incidencias.logica';
import type { PrioridadIncidencia } from '../services/incidencias.service';

const session = useSessionStore();

const tablero = useTableroIncidencias();
const seleccionId = ref<number | null>(null);
const detalle = useDetalleIncidencia(seleccionId);
const comentando = useComentarIncidencia();
const cambiando = useCambiarEstadoIncidencia();
const ajustando = useAjustarIncidencia();
const ocupado = computed(
  () => comentando.isPending.value || cambiando.isPending.value || ajustando.isPending.value,
);

const columnas = computed(() => armarTablero(tablero.data.value?.incidencias ?? []));
const sel = computed(() => detalle.data.value ?? null);
const avance = computed(() => accionAvanzar(sel.value?.estado ?? 'cerrado'));

// Para «hace 2 h»: se refresca cada minuto sin pedir nada al servidor
const ahora = ref(Date.now());
const reloj = setInterval(() => (ahora.value = Date.now()), 60_000);
onBeforeUnmount(() => clearInterval(reloj));

const texto = ref('');
const errorTexto = ref<string | null>(null);
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

// Al llegar el tablero se elige la primera tarjeta; si la elegida ya no está, otra
watch(
  () => tablero.data.value,
  (t) => {
    const filas = t?.incidencias ?? [];
    if (!filas.some((f) => f.id === seleccionId.value)) seleccionId.value = filas[0]?.id ?? null;
  },
);

// Otro condominio: nada de lo abierto ni escrito queda
watch(
  () => session.condominioId,
  () => {
    seleccionId.value = null;
    texto.value = '';
    errorTexto.value = null;
    resultado.value = null;
    errorAccion.value = null;
  },
);

function elegir(id: number): void {
  seleccionId.value = id;
  texto.value = '';
  errorTexto.value = null;
}

function fallar(error: unknown): void {
  resultado.value = null;
  const apiError = aApiError(error);
  // Otra persona ya cambió el estado: se vuelve a leer todo
  if (apiError.codigo === 'TRANSICION_NO_PERMITIDA') {
    void tablero.refetch();
    void detalle.refetch();
  }
  // Sin respuesta o 5xx el cambio pudo hacerse: se avisa para no repetirlo a ciegas
  errorAccion.value =
    apiError.estado === 0 || apiError.estado >= 500
      ? `${apiError.mensaje} Revisa la incidencia antes de reintentar: el cambio pudo hacerse.`
      : apiError.mensaje;
}

function comentar(interna: boolean): void {
  const id = seleccionId.value;
  if (id === null || ocupado.value) return;
  errorTexto.value = null;
  errorAccion.value = null;
  const t = texto.value.trim();
  if (t === '') {
    errorTexto.value = interna
      ? 'Escribe la nota antes de guardarla.'
      : 'Escribe el comentario antes de enviarlo.';
    return;
  }
  comentando.mutate(
    { id, texto: t, interna },
    {
      onSuccess: () => {
        texto.value = '';
        resultado.value = interna ? 'Nota interna guardada.' : 'Comentario enviado al residente.';
      },
      onError: fallar,
    },
  );
}

function avanzar(): void {
  const id = seleccionId.value;
  const siguiente = avance.value.siguiente;
  if (id === null || siguiente === null || ocupado.value) return;
  errorAccion.value = null;
  cambiando.mutate(
    { id, estado: siguiente },
    {
      onSuccess: () => (resultado.value = `Incidencia movida a ${etiquetaEstado(siguiente)}.`),
      onError: fallar,
    },
  );
}

function cambiarPrioridad(prioridad: PrioridadIncidencia): void {
  const id = seleccionId.value;
  if (id === null || ocupado.value) return;
  errorAccion.value = null;
  ajustando.mutate({ id, cambios: { prioridad } }, { onError: fallar });
}
</script>

<style scoped>
.incidencias__error {
  font-size: 12px;
  font-weight: 600;
  color: #b3261e;
}

.incidencias__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.incidencias__vacio {
  padding: 24px 12px;
  text-align: center;
  color: var(--safic-texto-suave);
}

.incidencias__det-desc,
.incidencias__comentario {
  white-space: pre-line;
}

.incidencias__ajustes {
  display: flex;
  gap: 8px;
}

.incidencias__select {
  height: 40px;
  border-radius: 9px;
  border: 1px solid var(--safic-borde-campo);
  padding: 0 8px;
  font-family: inherit;
  font-size: 13px;
  background: #ffffff;
}

.incidencias__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.incidencias__avanzar:disabled,
.incidencias__nota:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.incidencias.safic-main {
  padding: 24px 32px;
  gap: 16px;
}

.incidencias__promedio {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.incidencias__promedio strong {
  color: var(--safic-texto);
}

.incidencias__cuerpo {
  display: flex;
  gap: 16px;
  flex-grow: 1;
  min-height: 0;
}

.incidencias__tablero {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}

.incidencias__columna {
  background: var(--safic-linea);
  border-radius: 14px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.incidencias__col-cab {
  display: flex;
  align-items: center;
  padding: 4px 4px 2px 4px;
}

.incidencias__col-nombre {
  font-size: 13px;
  font-weight: 800;
  flex-grow: 1;
}

.incidencias__col-n {
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.incidencias__tarjeta {
  display: block;
  text-align: left;
  cursor: pointer;
  border-radius: 12px;
  padding: 12px;
  background: #ffffff;
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde);
  font-family: inherit;
  /* Compensa el borde de 2px de la tarjeta activa */
  margin: 1px;
}

.incidencias__tarjeta--activa {
  border: 2px solid var(--q-primary);
  margin: 0;
}

.incidencias__tarjeta-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.incidencias__cat {
  font-size: 11px;
  color: var(--safic-texto-suave);
  font-weight: 600;
}

.incidencias__tarjeta-titulo {
  display: block;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
}

.incidencias__tarjeta-pie {
  display: block;
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: 6px;
}

.incidencias__detalle {
  width: 380px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.incidencias__det-meta {
  display: flex;
  gap: 6px;
  align-items: center;
}

.incidencias__det-cat {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 600;
}

.incidencias__det-titulo {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0;
}

.incidencias__det-autor {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.incidencias__det-desc {
  font-size: 14px;
  color: var(--safic-texto);
  line-height: 1.5;
}

.incidencias__fotos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.incidencias__foto {
  height: 70px;
  border-radius: 10px;
  background: var(--safic-borde);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.incidencias__seccion {
  font-size: 12px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
  margin-top: 4px;
}

.incidencias__comentario {
  background: #f7f6f2;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.45;
}

.incidencias__comentario--interna {
  background: #fff7ec;
  border: 1px dashed #e8b874;
  color: #7a3808;
}

.incidencias__espacio {
  flex-grow: 1;
}

.incidencias__texto {
  border: 1px solid var(--safic-borde-campo);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  color: var(--safic-texto);
}

.incidencias__texto:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
}

.incidencias__acciones {
  display: flex;
  gap: 8px;
}

.incidencias__nota,
.incidencias__avanzar {
  height: 44px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.incidencias__nota {
  flex-grow: 1;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 13px;
}

.incidencias__avanzar {
  flex-grow: 2;
  border: none;
  font-size: 14px;
  background: var(--q-primary);
  color: #ffffff;
}

.incidencias__avanzar--off {
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
  cursor: default;
}

@media (max-width: 1200px) {
  .incidencias__cuerpo {
    flex-direction: column;
  }

  .incidencias__detalle {
    width: 100%;
  }
}

@media (max-width: 899px) {
  .incidencias__tablero {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .incidencias.safic-main {
    padding: 20px 16px;
  }

  .incidencias__tablero {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
