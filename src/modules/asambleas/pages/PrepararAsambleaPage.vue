<template>
  <q-page class="safic-main preparar">
    <section class="preparar__principal">
      <PaginaEncabezado
        miga="Asambleas / Preparar"
        :titulo="detalle?.titulo ?? (esNueva ? 'Nueva asamblea' : 'Asamblea')"
      >
        <template #acciones>
          <EstadoBadge
            :tono="ESTADOS[detalle?.estado ?? 'borrador'].tono"
            :texto="ESTADOS[detalle?.estado ?? 'borrador'].nombre"
          />
          <q-btn
            flat
            no-caps
            icon="sym_r_rule_settings"
            label="Reglas de asamblea"
            class="safic-btn safic-btn--secundario"
            @click="abrirReglas"
          />
        </template>
      </PaginaEncabezado>

      <div v-if="resultado" class="safic-alerta preparar__ok" role="status">{{ resultado }}</div>
      <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
      <div v-if="soloLectura" class="safic-alerta" role="status">
        Esta asamblea ya se convocó: los propietarios fueron notificados y su convocatoria no se
        edita.
        <router-link
          v-if="detalle?.estado === 'convocada'"
          :to="{ name: 'asambleas-convocatoria', params: { id: detalle.id } }"
          class="preparar__seguimiento"
        >
          Ver seguimiento de la convocatoria
        </router-link>
      </div>

      <q-form novalidate class="preparar__datos" @submit="guardar">
        <div class="preparar__campo preparar__campo--ancho">
          <label for="asm-titulo">Título</label>
          <q-input
            v-model="f.titulo"
            for="asm-titulo"
            class="safic-input"
            outlined
            dense
            maxlength="120"
            hide-bottom-space
            :readonly="soloLectura"
            :error="!!errores.titulo"
            :error-message="errores.titulo"
          />
        </div>

        <div class="preparar__campo">
          <label for="asm-tipo">Tipo</label>
          <q-select
            v-model="f.tipo"
            for="asm-tipo"
            class="safic-input"
            outlined
            dense
            emit-value
            map-options
            hide-bottom-space
            :readonly="soloLectura"
            :options="TIPOS_ASAMBLEA.map((t) => ({ label: t.etiqueta, value: t.valor }))"
          />
        </div>
        <div class="preparar__campo">
          <label for="asm-modalidad">Modalidad</label>
          <q-select
            v-model="f.modalidad"
            for="asm-modalidad"
            class="safic-input"
            outlined
            dense
            emit-value
            map-options
            hide-bottom-space
            :readonly="soloLectura"
            :options="
              MODALIDADES.map((m) => ({
                label: m.etiqueta,
                value: m.valor,
                disable: m.valor !== 'presencial' && !permiteVirtual,
              }))
            "
            :error="!!errores.modalidad"
            :error-message="errores.modalidad"
          />
        </div>
        <div class="preparar__campo">
          <label for="asm-fecha">Fecha y hora</label>
          <q-input
            v-model="f.fechaHora"
            for="asm-fecha"
            class="safic-input"
            outlined
            dense
            type="datetime-local"
            hide-bottom-space
            :readonly="soloLectura"
            :error="!!errores.fechaHora"
            :error-message="errores.fechaHora"
          />
        </div>
        <div v-if="f.modalidad !== 'virtual'" class="preparar__campo">
          <label for="asm-lugar">Lugar</label>
          <q-input
            v-model="f.lugar"
            for="asm-lugar"
            class="safic-input"
            outlined
            dense
            maxlength="160"
            hide-bottom-space
            :readonly="soloLectura"
            :error="!!errores.lugar"
            :error-message="errores.lugar"
          />
        </div>
        <div v-if="f.modalidad !== 'presencial'" class="preparar__campo preparar__campo--ancho">
          <label for="asm-enlace">Enlace de la videollamada (Zoom, Meet o Teams)</label>
          <q-input
            v-model="f.enlaceVideo"
            for="asm-enlace"
            class="safic-input"
            outlined
            dense
            maxlength="300"
            placeholder="https://"
            hide-bottom-space
            :readonly="soloLectura"
            :error="!!errores.enlaceVideo"
            :error-message="errores.enlaceVideo"
          />
        </div>

        <div
          v-if="anticipacion && !soloLectura"
          class="preparar__legal"
          :class="{ 'preparar__legal--alerta': !anticipacion.cumple }"
          role="status"
        >
          <q-icon
            :name="anticipacion.cumple ? 'sym_r_check' : 'sym_r_warning'"
            size="20px"
            class="preparar__legal-icono"
          />
          {{ mensajeAnticipacion(anticipacion) }}
        </div>

        <div v-if="faltan.length > 0 && !soloLectura" class="preparar__falta">
          Antes de convocar:
          <ul>
            <li v-for="m in faltan" :key="m">{{ m }}</li>
          </ul>
        </div>
      </q-form>

      <div class="preparar__orden">
        <div class="preparar__orden-cab">
          <h2 class="preparar__orden-titulo">Orden del día</h2>
          <button
            type="button"
            class="preparar__agregar"
            :disabled="esNueva || soloLectura"
            @click="abrirPunto(null)"
          >
            Agregar punto
          </button>
        </div>
        <div v-if="esNueva" class="preparar__vacio">
          Guarda el borrador para agregar el orden del día.
        </div>
        <div v-else class="preparar__scroll">
          <div class="preparar__fila preparar__fila--cabecera">
            <div>N.º</div>
            <div>PUNTO</div>
            <div>TIPO</div>
            <div>MAYORÍA</div>
            <div>INFORME</div>
            <div />
          </div>
          <div v-if="consulta.isPending.value" class="preparar__vacio">Cargando…</div>
          <div v-else-if="puntos.length === 0" class="preparar__vacio">
            Aún no hay puntos. Agrega el primero: constatación del quórum, informe, votaciones…
          </div>
          <div v-for="(p, i) in puntos" :key="p.id" class="preparar__fila">
            <div class="preparar__n">{{ p.orden }}</div>
            <div class="preparar__punto">{{ p.titulo }}</div>
            <div>
              <EstadoBadge :tono="TIPOS_PUNTO[p.tipo].tono" :texto="TIPOS_PUNTO[p.tipo].nombre" />
            </div>
            <div class="preparar__mayoria">{{ textoMayoria(p) }}</div>
            <div>
              <a
                v-if="urlSegura(p.adjunto_url)"
                :href="urlSegura(p.adjunto_url) ?? undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="preparar__informe"
                >PDF</a
              >
            </div>
            <div v-if="!soloLectura" class="preparar__acciones-fila">
              <q-btn
                flat
                round
                dense
                icon="sym_r_arrow_upward"
                aria-label="Subir"
                :disable="i === 0 || ocupado"
                @click="mover(p, 'sube')"
              />
              <q-btn
                flat
                round
                dense
                icon="sym_r_arrow_downward"
                aria-label="Bajar"
                :disable="i === puntos.length - 1 || ocupado"
                @click="mover(p, 'baja')"
              />
              <q-btn
                flat
                round
                dense
                icon="sym_r_edit"
                aria-label="Editar"
                :disable="ocupado"
                @click="abrirPunto(p)"
              />
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="sym_r_delete"
                aria-label="Quitar"
                :disable="ocupado"
                @click="quitar(p)"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <aside class="preparar__lateral">
      <div class="preparar__padron">
        <h2 class="preparar__padron-titulo">Padrón para la asamblea</h2>
        <template v-if="padron">
          <div class="preparar__dato">
            <span>Unidades con propietario</span><strong>{{ padron.unidades }}</strong>
          </div>
          <div class="preparar__dato">
            <span>Suma de alícuotas</span><strong>{{ porcentaje(padron.suma_alicuotas) }}</strong>
          </div>
          <div class="preparar__dato preparar__dato--mora">
            <span>En mora hoy (no votan)</span>
            <strong
              >{{ padron.en_mora.unidades }} · {{ porcentaje(padron.en_mora.alicuotas) }}</strong
            >
          </div>
          <div class="preparar__dato">
            <span>Quórum 1.ª convocatoria</span>
            <strong>&gt; {{ porcentaje(padron.quorum_minimo_pct) }} alícuotas</strong>
          </div>
        </template>
        <q-skeleton v-else type="rect" height="96px" />
        <div class="preparar__padron-nota">
          La foto definitiva de alícuotas, propietarios y mora se congela al instalar la asamblea.
        </div>
      </div>
      <div class="preparar__relleno" />
      <button
        v-if="!esNueva && !soloLectura"
        type="button"
        class="preparar__convocar"
        :disabled="ocupado || !detalle?.puede_convocar"
        @click="convocar"
      >
        Convocar asamblea
      </button>
      <button
        v-if="!soloLectura"
        type="button"
        class="preparar__guardar"
        :disabled="ocupado"
        @click="guardar"
      >
        Guardar borrador
      </button>
      <button
        v-if="!esNueva && !soloLectura"
        type="button"
        class="preparar__descartar"
        :disabled="ocupado"
        @click="descartar"
      >
        Descartar borrador
      </button>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { urlSegura } from '@/modules/comunicacion/anuncios.logica';

import {
  aSolicitudAsamblea,
  ahoraLocal,
  asambleaVacia,
  ESTADOS,
  MODALIDADES,
  mensajeAnticipacion,
  porcentaje,
  textoMayoria,
  TIPOS_ASAMBLEA,
  TIPOS_PUNTO,
  validarAsamblea,
  type ErroresAsamblea,
} from '../asambleas.logica';
import PuntoAsambleaDialog from '../components/PuntoAsambleaDialog.vue';
import ReglasAsambleaDialog from '../components/ReglasAsambleaDialog.vue';
import {
  useActualizarAsamblea,
  useAnticipacion,
  useAsamblea,
  useConfiguracionAsambleas,
  useConvocarAsamblea,
  useCrearAsamblea,
  useDescartarAsamblea,
  useMoverPunto,
  usePadron,
  useQuitarPunto,
} from '../composables/useAsambleas';
import type { PuntoAsamblea } from '../services/asambleas.service';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const id = computed(() => (route.params.id ? Number(route.params.id) : null));
const esNueva = computed(() => id.value === null);

const consulta = useAsamblea(id);
const detalle = computed(() => consulta.data.value ?? null);
const soloLectura = computed(() => detalle.value !== null && detalle.value.estado !== 'borrador');
const puntos = computed(() => detalle.value?.puntos ?? []);
const faltan = computed(() => detalle.value?.falta_para_convocar ?? []);

const configuracion = useConfiguracionAsambleas();
const permiteVirtual = computed(() => configuracion.data.value?.permite_virtual ?? false);
const porcentajeReforma = computed(() => configuracion.data.value?.porcentaje_reforma ?? null);

const f = reactive(asambleaVacia());
const errores = reactive<ErroresAsamblea>({});
const errorGeneral = ref<string | null>(null);
const resultado = ref<string | null>(null);

// El formulario se rellena una vez por asamblea: guardar un punto no debe pisar lo que se está escribiendo
let cargada: number | null = null;
watch(
  detalle,
  (d) => {
    if (d && cargada !== d.id) {
      cargada = d.id;
      Object.assign(f, {
        titulo: d.titulo,
        tipo: d.tipo,
        modalidad: d.modalidad,
        fechaHora: d.fecha_hora,
        lugar: d.lugar ?? '',
        enlaceVideo: d.enlace_video ?? '',
      });
    }
  },
  { immediate: true },
);
watch(id, (nuevo) => {
  resultado.value = null;
  errorGeneral.value = null;
  if (nuevo === null) {
    cargada = null;
    Object.assign(f, asambleaVacia());
  }
});

// La anticipación se calcula en el servidor (feriados y días hábiles) con la fecha que hay en el formulario
const fechaParaAnticipacion = computed(() =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(f.fechaHora) && f.fechaHora > ahoraLocal()
    ? f.fechaHora
    : null,
);
const anticipacionConsulta = useAnticipacion(fechaParaAnticipacion);
const anticipacion = computed(() =>
  fechaParaAnticipacion.value ? (anticipacionConsulta.data.value ?? null) : null,
);

const padronNuevo = usePadron(esNueva);
const padron = computed(() => detalle.value?.padron ?? padronNuevo.data.value ?? null);

const creando = useCrearAsamblea();
const actualizando = useActualizarAsamblea();
const descartando = useDescartarAsamblea();
const convocando = useConvocarAsamblea();
const moviendo = useMoverPunto();
const quitando = useQuitarPunto();
const ocupado = computed(
  () =>
    creando.isPending.value ||
    actualizando.isPending.value ||
    descartando.isPending.value ||
    convocando.isPending.value ||
    moviendo.isPending.value ||
    quitando.isPending.value,
);

function avisar(mensaje: string): void {
  errorGeneral.value = null;
  resultado.value = mensaje;
}

function fallar(error: unknown): void {
  const e = aApiError(error);
  resultado.value = null;
  // Sin respuesta o 5xx el cambio pudo hacerse: se avisa para no repetirlo a ciegas
  errorGeneral.value =
    e.estado === 0 || e.estado >= 500
      ? `${e.mensaje} Revisa el borrador antes de reintentar: el cambio pudo guardarse.`
      : e.mensaje;
}

async function guardar(): Promise<void> {
  if (ocupado.value || soloLectura.value) return;
  errorGeneral.value = null;
  resultado.value = null;
  for (const k of ['titulo', 'tipo', 'modalidad', 'fechaHora', 'lugar', 'enlaceVideo'] as const) {
    errores[k] = undefined;
  }

  const problemas = validarAsamblea(f, permiteVirtual.value);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    const datos = aSolicitudAsamblea(f);
    if (esNueva.value) {
      const creada = await creando.mutateAsync(datos);
      $q.notify({ type: 'positive', message: 'Borrador guardado. Ahora arma el orden del día.' });
      await router.replace({ name: 'asambleas-editar', params: { id: creada.id } });
    } else {
      await actualizando.mutateAsync({ id: id.value as number, datos });
      avisar('Borrador guardado.');
    }
  } catch (error) {
    const e = aApiError(error);
    errores.titulo = e.campo('titulo');
    errores.fechaHora =
      e.campo('fecha_hora') ?? (e.codigo === 'FECHA_PASADA' ? e.mensaje : undefined);
    errores.modalidad = e.codigo === 'MODALIDAD_NO_PERMITIDA' ? e.mensaje : e.campo('modalidad');
    errores.lugar = e.codigo === 'LUGAR_REQUERIDO' ? e.mensaje : e.campo('lugar');
    errores.enlaceVideo = e.codigo === 'ENLACE_REQUERIDO' ? e.mensaje : e.campo('enlace_video');
    if (!Object.values(errores).some(Boolean)) fallar(error);
  }
}

function abrirPunto(punto: PuntoAsamblea | null): void {
  if (id.value === null) return;
  $q.dialog({
    component: PuntoAsambleaDialog,
    componentProps: { asambleaId: id.value, punto, porcentajeReforma: porcentajeReforma.value },
  }).onOk(avisar);
}

function abrirReglas(): void {
  $q.dialog({ component: ReglasAsambleaDialog }).onOk(avisar);
}

function mover(punto: PuntoAsamblea, direccion: 'sube' | 'baja'): void {
  if (ocupado.value || id.value === null) return;
  moviendo.mutate({ id: id.value, puntoId: punto.id, direccion }, { onError: fallar });
}

function quitar(punto: PuntoAsamblea): void {
  if (id.value === null) return;
  const asambleaId = id.value;
  $q.dialog({
    title: 'Quitar punto',
    message: `Se quitará «${punto.titulo}» del orden del día${punto.adjunto_nombre ? ' y su informe' : ''}.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Quitar', color: 'negative', unelevated: true, noCaps: true },
  }).onOk(() => {
    quitando.mutate(
      { id: asambleaId, puntoId: punto.id },
      { onSuccess: () => avisar('Punto quitado.'), onError: fallar },
    );
  });
}

function convocar(): void {
  const d = detalle.value;
  if (id.value === null || d === null || ocupado.value) return;
  const asambleaId = id.value;
  $q.dialog({
    title: 'Convocar asamblea',
    message: `Se enviará la convocatoria a todos los propietarios y residentes (${d.padron.unidades} unidades con propietario) por la app y por correo, con confirmación de recepción. Después ya no podrás editar la asamblea.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Convocar', color: 'primary', unelevated: true, noCaps: true },
  }).onOk(() => {
    convocando.mutate(asambleaId, {
      onSuccess: () => {
        $q.notify({ type: 'positive', message: 'Asamblea convocada. Se avisó a los residentes.' });
        void router.replace({ name: 'asambleas-convocatoria', params: { id: asambleaId } });
      },
      onError: (error) => {
        const e = aApiError(error);
        // Si el servidor dice que ya no se llega a tiempo, el detalle se vuelve a pedir para que el aviso quede al día
        if (e.codigo === 'SIN_ANTICIPACION') void consulta.refetch();
        fallar(error);
      },
    });
  });
}

function descartar(): void {
  if (id.value === null) return;
  const asambleaId = id.value;
  $q.dialog({
    title: 'Descartar borrador',
    message: 'Se borrará el borrador con su orden del día y sus informes. No se puede deshacer.',
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Descartar', color: 'negative', unelevated: true, noCaps: true },
  }).onOk(() => {
    descartando.mutate(asambleaId, {
      onSuccess: () => {
        $q.notify({ type: 'positive', message: 'Borrador descartado.' });
        void router.replace({ name: 'asambleas-preparar' });
      },
      onError: fallar,
    });
  });
}
</script>

<style scoped>
.preparar.safic-main {
  padding: 24px 32px;
  flex-direction: row;
  gap: 20px;
  align-items: stretch;
}

.preparar__principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.preparar__seguimiento {
  margin-left: 8px;
  font-weight: 700;
}

.preparar__estado {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f1efe8;
  color: var(--safic-texto-2);
  font-size: 13px;
  font-weight: 700;
}

.preparar__estado--convocada {
  background: #e3efec;
  color: #0b4a47;
}

.preparar__datos {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 20px 22px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 18px;
}

.preparar__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
  min-width: 0;
}

.preparar__campo--ancho {
  grid-column: span 2;
}

.preparar__campo label {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.preparar__ok {
  background: #e3efec;
  color: #0b4a47;
}

.preparar__legal--alerta {
  background: #fff1ee;
  color: #9b1c12;
}

.preparar__legal {
  grid-column: span 4;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #e3efec;
  color: #0b4a47;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
}

.preparar__legal-icono {
  flex-shrink: 0;
}

.preparar__orden {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
  flex-grow: 1;
}

.preparar__orden-cab {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--safic-linea);
}

.preparar__orden-titulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: 0;
  flex-grow: 1;
}

.preparar__agregar {
  height: 40px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--q-primary);
  background: #ffffff;
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.preparar__scroll {
  overflow-x: auto;
}

.preparar__fila {
  display: grid;
  grid-template-columns: 36px minmax(140px, 1fr) 184px 126px 56px 148px;
  align-items: center;
  padding: 0 20px;
  height: 54px;
  border-top: 1px solid var(--safic-linea-2);
  font-size: 14px;
  min-width: 720px;
}

.preparar__fila--cabecera {
  height: auto;
  padding: 10px 20px;
  border-top: none;
  background: var(--safic-fondo-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.preparar__n {
  font-weight: 800;
}

.preparar__punto {
  font-weight: 600;
}

.preparar__mayoria {
  color: var(--safic-texto-2);
  font-size: 13px;
}

.preparar__adjunto {
  color: var(--q-primary);
  font-weight: 700;
  font-size: 13px;
}

.preparar__lateral {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preparar__padron {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preparar__padron-titulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: 0;
}

.preparar__dato {
  display: flex;
}

.preparar__dato span {
  flex-grow: 1;
  color: var(--safic-texto-2);
}

.preparar__dato--mora span,
.preparar__dato--mora strong {
  color: #9b1c12;
}

.preparar__padron-nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.preparar__aviso {
  background: #fff7ec;
  border: 1px solid #f1d6ae;
  border-radius: 14px;
  padding: 16px 18px;
  font-size: 13px;
  color: #7a3808;
  line-height: 1.5;
}

.preparar__relleno {
  flex-grow: 1;
}

.preparar__convocar,
.preparar__guardar,
.preparar__descartar {
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.preparar__convocar {
  height: 46px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 14px;
}

.preparar__convocar:disabled,
.preparar__guardar:disabled {
  opacity: 0.6;
  cursor: default;
}

.preparar__guardar {
  height: 46px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 14px;
}

.preparar__descartar {
  height: 40px;
  border: none;
  background: transparent;
  color: #9b1c12;
  font-size: 13px;
}

.preparar__guardar:disabled {
  opacity: 0.6;
  cursor: default;
}

.preparar__falta {
  grid-column: span 4;
  background: #fff7ec;
  border: 1px solid #f1d6ae;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #7a3808;
}

.preparar__falta ul {
  margin: 4px 0 0;
  padding-left: 18px;
}

.preparar__acciones-fila {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
}

.preparar__vacio {
  padding: 28px 20px;
  text-align: center;
  color: var(--safic-texto-suave);
  font-size: 14px;
}

.preparar__informe {
  color: var(--q-primary);
  font-weight: 700;
  font-size: 13px;
  text-decoration: none;
}

@media (max-width: 1100px) {
  .preparar.safic-main {
    flex-direction: column;
  }

  .preparar__lateral {
    width: 100%;
  }

  .preparar__datos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .preparar__legal,
  .preparar__falta {
    grid-column: span 2;
  }
}

@media (max-width: 599px) {
  .preparar.safic-main {
    padding: 20px 16px;
  }

  .preparar__datos {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
  }

  .preparar__legal,
  .preparar__falta {
    grid-column: span 1;
  }
}
</style>
