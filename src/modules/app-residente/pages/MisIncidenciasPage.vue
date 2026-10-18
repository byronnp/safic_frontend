<template>
  <div class="app-pagina mis-incidencias">
    <AppEncabezado :antetitulo="session.condominioActivo?.nombre ?? ''" titulo="Incidencias">
      <template #derecha>
        <button
          type="button"
          class="mis-incidencias__nueva"
          aria-label="Reportar una incidencia"
          :disabled="!visitas.isSuccess.value"
          @click="reportar"
        >
          <q-icon name="sym_r_add" size="24px" />
        </button>
      </template>
    </AppEncabezado>

    <div class="app-cuerpo mis-incidencias__cuerpo">
      <div v-if="resultado" class="mis-incidencias__resultado" role="status">{{ resultado }}</div>
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

      <div role="tablist" aria-label="Incidencias" class="mis-incidencias__pestanas">
        <button
          type="button"
          role="tab"
          class="mis-incidencias__pestana"
          :class="{ 'mis-incidencias__pestana--activa': pestana === 'abiertas' }"
          :aria-selected="pestana === 'abiertas'"
          @click="pestana = 'abiertas'"
        >
          Abiertas ({{ abiertas.length }})
        </button>
        <button
          type="button"
          role="tab"
          class="mis-incidencias__pestana"
          :class="{ 'mis-incidencias__pestana--activa': pestana === 'cerradas' }"
          :aria-selected="pestana === 'cerradas'"
          @click="pestana = 'cerradas'"
        >
          Cerradas
        </button>
      </div>

      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="84px" aria-busy="true" />
      </template>
      <div v-else-if="lista.length === 0" class="app-tarjeta mis-incidencias__vacio">
        <q-icon name="sym_r_support_agent" size="36px" class="text-suave" />
        <div>
          {{
            pestana === 'abiertas'
              ? 'No tienes incidencias abiertas.'
              : 'Aún no hay incidencias cerradas.'
          }}
        </div>
      </div>

      <article v-for="i in lista" :key="i.id" class="app-tarjeta mis-incidencias__incidencia">
        <button
          type="button"
          class="mis-incidencias__cabecera"
          :aria-expanded="abierta === i.id"
          @click="abrir(i.id)"
        >
          <span class="mis-incidencias__textos">
            <span class="mis-incidencias__titulo">{{ i.titulo }}</span>
            <span class="mis-incidencias__meta"
              >#{{ i.numero }} · {{ etiquetaCategoria(i.categoria) }} ·
              {{ hace(i.creada_en, ahora) }}</span
            >
          </span>
          <EstadoBadge :tono="insigniaEstado(i.estado).tono">{{
            insigniaEstado(i.estado).texto
          }}</EstadoBadge>
        </button>

        <div v-if="i.estado === 'resuelto'" class="mis-incidencias__resuelta">
          <div v-if="ultimaRespuestaPublica(i.comentarios)" class="mis-incidencias__cita">
            Administración: «{{ ultimaRespuestaPublica(i.comentarios) }}»
          </div>
          <div class="mis-incidencias__pregunta">
            ¿Se solucionó? Si no respondes en 7 días se cierra solo.
          </div>
          <div class="mis-incidencias__botones">
            <button
              type="button"
              class="mis-incidencias__reabrir"
              :disabled="ocupado"
              @click="reabrir(i)"
            >
              Reabrir
            </button>
            <button
              type="button"
              class="mis-incidencias__ok"
              :disabled="ocupado"
              @click="confirmar(i)"
            >
              Sí, se solucionó
            </button>
          </div>
        </div>

        <div v-if="abierta === i.id" class="mis-incidencias__detalle">
          <p class="mis-incidencias__descripcion">{{ i.descripcion }}</p>
          <div v-if="i.fotos.length" class="mis-incidencias__fotos">
            <template v-for="(f, n) in i.fotos" :key="f.id">
              <img v-if="f.url" :src="f.url" :alt="`Foto ${n + 1}`" referrerpolicy="no-referrer" />
            </template>
          </div>
          <div
            v-for="c in comentariosPublicos(i.comentarios)"
            :key="c.id"
            class="mis-incidencias__comentario"
          >
            <strong>{{ c.de_administracion ? 'Administración' : 'Tú' }}</strong> · {{ c.texto }}
          </div>
          <template v-if="i.estado !== 'cerrado'">
            <textarea
              v-model="respuesta"
              rows="2"
              maxlength="1000"
              class="mis-incidencias__texto"
              aria-label="Escribe un mensaje a la administración"
              placeholder="Escribe un mensaje a la administración"
            />
            <div v-if="errorRespuesta" class="mis-incidencias__error" role="alert">
              {{ errorRespuesta }}
            </div>
            <button
              type="button"
              class="mis-incidencias__enviar"
              :disabled="ocupado"
              @click="responder(i)"
            >
              Enviar mensaje
            </button>
          </template>
          <div v-else class="mis-incidencias__nota">
            {{ textoCierre(i.cierre) }} Si el problema sigue, reporta una nueva incidencia.
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import { aApiError } from '@/core/api/errors';
import ReportarIncidenciaDialog from '@/modules/comunicacion/components/ReportarIncidenciaDialog.vue';
import {
  useComentarMiIncidencia,
  useConfirmarIncidencia,
  useMisIncidencias,
  useReabrirIncidencia,
} from '@/modules/comunicacion/composables/useIncidencias';
import {
  comentariosPublicos,
  etiquetaCategoria,
  hace,
  insigniaEstado,
  ultimaRespuestaPublica,
} from '@/modules/comunicacion/incidencias.logica';
import type { IncidenciaDetalle } from '@/modules/comunicacion/services/incidencias.service';
import { useMisVisitas } from '@/modules/garita/composables/useVisitas';
import { useSessionStore } from '@/stores/session';

const $q = useQuasar();
const session = useSessionStore();
const consulta = useMisIncidencias();
// Las unidades del residente, para elegir desde cuál reporta
const visitas = useMisVisitas();
const comentando = useComentarMiIncidencia();
const reabriendo = useReabrirIncidencia();
const confirmando = useConfirmarIncidencia();
const ocupado = computed(
  () => comentando.isPending.value || reabriendo.isPending.value || confirmando.isPending.value,
);

const pestana = ref<'abiertas' | 'cerradas'>('abiertas');
const abierta = ref<number | null>(null);
const respuesta = ref('');
const errorRespuesta = ref<string | null>(null);
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

const todas = computed(() => consulta.data.value ?? []);
const abiertas = computed(() => todas.value.filter((i) => i.estado !== 'cerrado'));
const lista = computed(() =>
  pestana.value === 'abiertas' ? abiertas.value : todas.value.filter((i) => i.estado === 'cerrado'),
);

// Para «hace 2 días»: se refresca cada minuto sin pedir nada al servidor
const ahora = ref(Date.now());
const reloj = setInterval(() => (ahora.value = Date.now()), 60_000);
onBeforeUnmount(() => clearInterval(reloj));

watch(
  () => session.condominioId,
  () => {
    abierta.value = null;
    respuesta.value = '';
    errorRespuesta.value = null;
    resultado.value = null;
    errorAccion.value = null;
  },
);

function abrir(id: number): void {
  abierta.value = abierta.value === id ? null : id;
  respuesta.value = '';
  errorRespuesta.value = null;
}

function textoCierre(cierre: IncidenciaDetalle['cierre']): string {
  if (cierre === 'residente') return 'La cerraste tú: se solucionó.';
  if (cierre === 'automatico') return 'Se cerró sola al no recibir respuesta en 7 días.';
  return 'La administración la cerró.';
}

function reportar(): void {
  resultado.value = null;
  errorAccion.value = null;
  $q.dialog({
    component: ReportarIncidenciaDialog,
    componentProps: { unidades: visitas.data.value?.unidades ?? [] },
  }).onOk((m: string) => {
    pestana.value = 'abiertas';
    resultado.value = m;
  });
}

function fallar(error: unknown): void {
  resultado.value = null;
  const apiError = aApiError(error);
  // Otra persona ya la cerró o cambió: se vuelve a leer la lista
  if (
    apiError.codigo === 'INCIDENCIA_CERRADA' ||
    apiError.codigo === 'INCIDENCIA_NO_RESUELTA' ||
    apiError.estado === 404
  ) {
    void consulta.refetch();
  }
  errorAccion.value =
    apiError.estado === 0 || apiError.estado >= 500
      ? `${apiError.mensaje} Revisa tus incidencias antes de reintentar: el cambio pudo hacerse.`
      : apiError.mensaje;
}

function responder(i: IncidenciaDetalle): void {
  if (ocupado.value) return;
  errorRespuesta.value = null;
  errorAccion.value = null;
  const t = respuesta.value.trim();
  if (t === '') {
    errorRespuesta.value = 'Escribe tu mensaje.';
    return;
  }
  comentando.mutate(
    { id: i.id, texto: t },
    {
      onSuccess: () => {
        respuesta.value = '';
        resultado.value = 'Mensaje enviado a la administración.';
      },
      onError: fallar,
    },
  );
}

function reabrir(i: IncidenciaDetalle): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  reabriendo.mutate(
    { id: i.id, texto: null },
    {
      onSuccess: () =>
        (resultado.value = `Incidencia #${i.numero} reabierta. La administración volverá a revisarla.`),
      onError: fallar,
    },
  );
}

function confirmar(i: IncidenciaDetalle): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  confirmando.mutate(i.id, {
    onSuccess: () => (resultado.value = 'Gracias. La incidencia quedó cerrada.'),
    onError: fallar,
  });
}
</script>

<style scoped>
.mis-incidencias__nueva {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mis-incidencias__nueva:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mis-incidencias__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mis-incidencias__resultado {
  padding: 12px 14px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
  font-size: 14px;
}

.mis-incidencias__pestanas {
  display: flex;
  border-bottom: 1px solid var(--safic-borde);
}

.mis-incidencias__pestana {
  flex: 1 1 0;
  min-height: 44px;
  border: none;
  border-bottom: 3px solid transparent;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  cursor: pointer;
}

.mis-incidencias__pestana--activa {
  color: var(--safic-texto);
  border-bottom-color: var(--q-primary);
}

.mis-incidencias__incidencia {
  overflow: hidden;
}

.mis-incidencias__cabecera {
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  text-align: left;
  font-family: inherit;
  color: inherit;
  cursor: pointer;
}

.mis-incidencias__textos {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mis-incidencias__titulo {
  font-size: 15px;
  font-weight: 800;
}

.mis-incidencias__meta {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.mis-incidencias__resuelta {
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mis-incidencias__cita {
  font-size: 13px;
  line-height: 1.45;
}

.mis-incidencias__pregunta {
  font-size: 13px;
  font-weight: 700;
}

.mis-incidencias__botones {
  display: flex;
  gap: 8px;
}

.mis-incidencias__reabrir,
.mis-incidencias__ok,
.mis-incidencias__enviar {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.mis-incidencias__reabrir {
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
}

.mis-incidencias__ok,
.mis-incidencias__enviar {
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.mis-incidencias__reabrir:disabled,
.mis-incidencias__ok:disabled,
.mis-incidencias__enviar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mis-incidencias__detalle {
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--safic-borde);
}

.mis-incidencias__descripcion {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-line;
}

.mis-incidencias__fotos {
  display: flex;
  gap: 8px;
}

.mis-incidencias__fotos img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 10px;
}

.mis-incidencias__comentario {
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-line;
  padding: 8px 10px;
  background: #f7f6f2;
  border-radius: 10px;
}

.mis-incidencias__texto {
  border: 1px solid var(--safic-borde-campo);
  border-radius: 10px;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
}

.mis-incidencias__error {
  font-size: 12px;
  font-weight: 600;
  color: #b3261e;
}

.mis-incidencias__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.mis-incidencias__vacio {
  padding: 28px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
