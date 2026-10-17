<template>
  <q-page class="safic-main agenda">
    <PaginaEncabezado miga="Áreas comunes / Agenda" :titulo="titulo">
      <template #acciones>
        <button type="button" class="agenda__nav" aria-label="Semana anterior" @click="mover(-7)">
          <q-icon name="sym_r_chevron_left" size="20px" />
        </button>
        <button type="button" class="agenda__boton" @click="irAHoy">Hoy</button>
        <button type="button" class="agenda__nav" aria-label="Semana siguiente" @click="mover(7)">
          <q-icon name="sym_r_chevron_right" size="20px" />
        </button>
        <button
          v-if="puedeGestionar"
          type="button"
          class="agenda__boton agenda__boton--primario"
          :disabled="areas.length === 0"
          @click="bloquear"
        >
          Bloquear área
        </button>
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="agenda__resultado" role="status">{{ resultado }}</div>
    <div v-if="errorAccion" class="safic-alerta agenda__error" role="alert">{{ errorAccion }}</div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div class="agenda__cuerpo">
      <section
        class="agenda__calendario"
        aria-label="Calendario de la semana"
        :aria-busy="consulta.isPending.value"
      >
        <div class="agenda__scroll">
          <div class="agenda__grilla agenda__grilla--cabecera">
            <div class="agenda__cab-area">ÁREA</div>
            <div v-for="d in dias" :key="d.fecha" class="agenda__cab-dia">
              <div class="agenda__dow">{{ d.dow }}</div>
              <div class="agenda__num">{{ d.num }}</div>
            </div>
          </div>

          <div v-if="consulta.isPending.value" class="q-pa-md">
            <q-skeleton v-for="i in 4" :key="i" type="rect" height="64px" class="q-mb-sm" />
          </div>
          <div v-else-if="areas.length === 0" class="agenda__vacio">
            Aún no hay áreas reservables. Márcalas como reservables en Configuración › Amenidades y
            fija sus reglas en Áreas y reglas.
          </div>
          <div v-for="fila in grilla" :key="fila.area.id" class="agenda__grilla agenda__fila">
            <div class="agenda__area">
              <div class="agenda__area-nombre">{{ fila.area.nombre }}</div>
              <div class="agenda__area-meta">
                {{ fila.area.en_mantenimiento ? 'En mantenimiento' : metaDeArea(fila.area) }}
              </div>
            </div>
            <div v-for="(celda, i) in fila.celdas" :key="i" class="agenda__celda">
              <button
                v-for="it in celda"
                :key="it.clave"
                type="button"
                class="agenda__item"
                :class="`agenda__item--${it.tipo}`"
                :disabled="!puedeGestionar"
                @click="abrirItem(fila.area, it)"
              >
                <div class="agenda__item-hora">{{ it.hora }}</div>
                <div>{{ it.texto }}</div>
              </button>
            </div>
          </div>
        </div>
        <div class="agenda__leyenda">
          <span class="agenda__ley"
            ><span class="agenda__muestra agenda__muestra--ok" />Confirmada</span
          >
          <span class="agenda__ley"
            ><span class="agenda__muestra agenda__muestra--pend" />Por aprobar</span
          >
          <span class="agenda__ley"
            ><span class="agenda__muestra agenda__muestra--blk" />Bloqueo</span
          >
        </div>
      </section>

      <aside class="agenda__lateral">
        <h2 class="agenda__lateral-titulo">Por aprobar ({{ pendientes.length }})</h2>

        <div v-if="solicitudes.isError.value" class="safic-alerta" role="alert">
          {{ solicitudes.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="solicitudes.refetch()" />
        </div>
        <q-skeleton v-else-if="solicitudes.isPending.value" type="rect" height="140px" />

        <div v-for="p in pendientes" :key="p.id" class="agenda__solicitud">
          <div class="agenda__sol-cab">
            <div class="agenda__sol-area">{{ p.area }}</div>
            <span class="agenda__vence">{{ venceEn(p.vence_en, ahora) }}</span>
          </div>
          <div class="agenda__sol-texto">
            <strong>{{ fechaCorta(p.fecha) }}</strong> · {{ p.inicio }}–{{ p.fin }}
          </div>
          <div class="agenda__sol-texto">{{ p.unidad }} · {{ p.solicitante ?? 'Sin nombre' }}</div>
          <div v-if="p.unidad_restringida" class="agenda__sol-mora" role="alert">
            Unidad restringida por mora: no se puede aprobar
          </div>
          <div v-else-if="!p.unidad_al_dia" class="agenda__sol-mora">Unidad en mora</div>
          <div v-else class="agenda__sol-ok">
            <q-icon name="sym_r_check" size="16px" class="agenda__sol-ok-icono" />Unidad al día
          </div>
          <div v-if="resumenCobro(p)" class="agenda__sol-nota">
            Al aprobar se generan los cargos: {{ resumenCobro(p) }}
          </div>
          <div v-if="puedeGestionar" class="agenda__sol-acciones">
            <button type="button" class="agenda__rechazar" :disabled="ocupado" @click="rechazar(p)">
              Rechazar
            </button>
            <button
              type="button"
              class="agenda__aprobar"
              :disabled="ocupado || p.unidad_restringida"
              @click="aprobar(p)"
            >
              Aprobar
            </button>
          </div>
        </div>
        <div v-if="solicitudes.data.value && pendientes.length === 0" class="agenda__vacio">
          No hay reservas por aprobar.
        </div>
        <div class="agenda__pie">
          Las solicitudes sin respuesta en 48 horas vencen solas y liberan el horario.
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador, sumarDias } from '@/utils/fecha';

import {
  armarGrilla,
  diasDeSemana,
  lunesDe,
  metaDeArea,
  resumenCobro,
  tituloSemana,
  venceEn,
  type ItemAgenda,
} from '../agenda.logica';
import BloquearAreaDialog from '../components/BloquearAreaDialog.vue';
import {
  useAgenda,
  useAprobarReserva,
  useCancelarReservaAdmin,
  useQuitarBloqueo,
  useRechazarReserva,
  useSolicitudes,
} from '../composables/useAgenda';
import { fechaCorta } from '../reservas.logica';
import type { AreaAgenda, Solicitud } from '../services/agenda.service';

const $q = useQuasar();
const session = useSessionStore();

// Mostrar los botones es comodidad; la API exige reservas.gestionar igual.
const puedeGestionar = computed(() => session.tienePermiso('reservas.gestionar'));

const desde = ref(lunesDe(hoyEcuador()));
const consulta = useAgenda(desde);
const solicitudes = useSolicitudes();

const dias = computed(() => diasDeSemana(desde.value));
const titulo = computed(() => tituloSemana(desde.value));
const areas = computed(() => consulta.data.value?.areas ?? []);
const grilla = computed(() =>
  consulta.data.value ? armarGrilla(consulta.data.value, dias.value) : [],
);
const pendientes = computed(() => solicitudes.data.value ?? []);

// Para «Vence en 20 h»: se refresca cada minuto sin pedir nada al servidor
const ahora = ref(Date.now());
const reloj = setInterval(() => (ahora.value = Date.now()), 60_000);
onBeforeUnmount(() => clearInterval(reloj));

// El cuadro abierto (motivo, quitar bloqueo): se cierra si cambia el condominio
let dialogoAbierto: { hide: () => void } | null = null;
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

const aprobando = useAprobarReserva();
const rechazando = useRechazarReserva();
const cancelando = useCancelarReservaAdmin();
const quitando = useQuitarBloqueo();
const ocupado = computed(
  () =>
    aprobando.isPending.value ||
    rechazando.isPending.value ||
    cancelando.isPending.value ||
    quitando.isPending.value,
);

// Otro condominio: nada de lo mostrado ni de lo avisado queda
watch(
  () => session.condominioId,
  () => {
    dialogoAbierto?.hide();
    resultado.value = null;
    errorAccion.value = null;
    desde.value = lunesDe(hoyEcuador());
  },
);

function mover(dias: number): void {
  desde.value = sumarDias(desde.value, dias);
}

function irAHoy(): void {
  desde.value = lunesDe(hoyEcuador());
}

function avisar(mensaje: string): void {
  errorAccion.value = null;
  resultado.value = mensaje;
}

function fallar(error: unknown): void {
  resultado.value = null;
  const apiError = aApiError(error);
  // Sin respuesta o 5xx el cambio pudo hacerse: se avisa para no repetirlo a ciegas
  errorAccion.value =
    apiError.estado === 0 || apiError.estado >= 500
      ? `${apiError.mensaje} Revisa la agenda antes de reintentar: el cambio pudo hacerse.`
      : apiError.mensaje;
}

function aprobar(p: Solicitud): void {
  if (ocupado.value) return;
  aprobando.mutate(p.id, {
    onSuccess: () =>
      avisar(`Reserva de ${p.unidad} aprobada. Se generaron los cargos en su cuenta.`),
    onError: fallar,
  });
}

/** Pide el motivo con un cuadro de texto; con menos de 3 letras no deja continuar. */
function pedirMotivo(
  titulo: string,
  mensaje: string,
  etiqueta: string,
  alAceptar: (m: string) => void,
): void {
  dialogoAbierto = $q
    .dialog({
      title: titulo,
      message: mensaje,
      prompt: {
        model: '',
        type: 'text',
        isValid: (v: string) => v.trim().length >= 3,
        outlined: true,
      },
      cancel: { label: 'Volver', flat: true, noCaps: true },
      ok: { label: etiqueta, unelevated: true, noCaps: true, color: 'negative' },
      persistent: true,
    })
    .onOk((motivo: string) => alAceptar(motivo.trim()));
}

function rechazar(p: Solicitud): void {
  if (ocupado.value) return;
  pedirMotivo(
    'Rechazar solicitud',
    `El motivo lo verá ${p.solicitante ?? 'el residente'} de ${p.unidad}.`,
    'Rechazar',
    (motivo) =>
      rechazando.mutate(
        { id: p.id, motivo },
        { onSuccess: () => avisar(`Solicitud de ${p.unidad} rechazada.`), onError: fallar },
      ),
  );
}

function abrirItem(area: AreaAgenda, it: ItemAgenda): void {
  if (ocupado.value || !puedeGestionar.value) return;
  if (it.tipo === 'blk') {
    dialogoAbierto = $q
      .dialog({
        title: 'Quitar bloqueo',
        message: `${area.nombre} · ${it.hora}: ${it.texto}. Volverá a poder reservarse.`,
        cancel: { label: 'Volver', flat: true, noCaps: true },
        ok: { label: 'Quitar bloqueo', unelevated: true, noCaps: true, color: 'primary' },
        persistent: true,
      })
      .onOk(() =>
        quitando.mutate(it.id, { onSuccess: () => avisar('Bloqueo quitado.'), onError: fallar }),
      );
    return;
  }
  pedirMotivo(
    'Cancelar reserva',
    `${area.nombre} · ${it.hora} · ${it.texto.replace(' · por aprobar', '')}. El motivo lo verá el residente y se le avisa por correo.`,
    'Cancelar reserva',
    (motivo) =>
      cancelando.mutate(
        { id: it.id, motivo },
        { onSuccess: () => avisar('Reserva cancelada. Se avisó al residente.'), onError: fallar },
      ),
  );
}

function bloquear(): void {
  $q.dialog({ component: BloquearAreaDialog, componentProps: { areas: areas.value } }).onOk(avisar);
}
</script>

<style scoped>
button.agenda__item {
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.agenda__sol-mora {
  font-size: 12px;
  font-weight: 700;
  color: #b3261e;
}

.agenda__error {
  margin: 0;
}

.agenda__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.agenda__aprobar:disabled,
.agenda__rechazar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.agenda.safic-main {
  padding: 24px 32px;
  gap: 16px;
}

.agenda :deep(.safic-encabezado) {
  align-items: center;
}

.agenda__nav,
.agenda__boton {
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  cursor: pointer;
  font-family: inherit;
  color: var(--safic-texto);
}

.agenda__nav {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.agenda__boton {
  padding: 0 16px;
  font-size: 14px;
  font-weight: 700;
}

.agenda__boton--primario {
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.agenda__cuerpo {
  display: flex;
  gap: 16px;
  flex-grow: 1;
  min-height: 0;
}

.agenda__calendario {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.agenda__scroll {
  overflow-x: auto;
}

.agenda__grilla {
  display: grid;
  grid-template-columns: 150px repeat(7, minmax(0, 1fr));
  min-width: 720px;
}

.agenda__grilla--cabecera {
  background: var(--safic-fondo-2);
  border-bottom: 1px solid var(--safic-linea);
}

.agenda__cab-area {
  padding: 12px 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.agenda__cab-dia {
  padding: 10px 8px;
  border-left: 1px solid var(--safic-linea);
  text-align: center;
}

.agenda__dow {
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.agenda__num {
  font-size: 16px;
  font-weight: 800;
}

.agenda__fila {
  border-bottom: 1px solid var(--safic-linea-2);
  min-height: 108px;
}

.agenda__area {
  padding: 12px 14px;
}

.agenda__area-nombre {
  font-size: 14px;
  font-weight: 800;
}

.agenda__area-meta {
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: 2px;
}

.agenda__celda {
  border-left: 1px solid var(--safic-linea-2);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.agenda__item {
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.agenda__item-hora {
  font-weight: 800;
}

.agenda__item--ok {
  background: #e3efec;
  border: 1px solid #9fc7c0;
  color: #0b4a47;
}

.agenda__item--pend {
  background: #fff1dc;
  border: 1px solid #e8b874;
  color: #7a3808;
}

.agenda__item--blk {
  background: #eceae4;
  border: 1px dashed #a8a396;
  color: #4e4a42;
}

.agenda__leyenda {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 12px 16px;
  font-size: 12px;
  color: var(--safic-texto-2);
  font-weight: 600;
}

.agenda__ley {
  display: flex;
  align-items: center;
  gap: 6px;
}

.agenda__muestra {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.agenda__muestra--ok {
  background: #e3efec;
  border: 1px solid #9fc7c0;
}

.agenda__muestra--pend {
  background: #fff1dc;
  border: 1px solid #e8b874;
}

.agenda__muestra--blk {
  background: #eceae4;
  border: 1px dashed #a8a396;
}

.agenda__ley-nota {
  margin-left: auto;
  color: var(--safic-texto-suave);
}

.agenda__lateral {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agenda__lateral-titulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: 0;
}

.agenda__solicitud {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.agenda__sol-cab {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agenda__sol-area {
  font-size: 15px;
  font-weight: 800;
  flex-grow: 1;
}

.agenda__vence {
  padding: 3px 8px;
  border-radius: 999px;
  background: #fff1dc;
  color: #8a3f0a;
  font-size: 11px;
  font-weight: 800;
}

.agenda__sol-texto {
  color: var(--safic-texto-2);
}

.agenda__sol-ok {
  display: flex;
  gap: 6px;
  align-items: center;
  color: #0b4a47;
  font-weight: 600;
}

.agenda__sol-ok-icono {
  font-weight: 700;
}

.agenda__sol-nota {
  color: var(--safic-texto-suave);
}

.agenda__sol-acciones {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.agenda__rechazar,
.agenda__aprobar {
  flex-grow: 1;
  height: 42px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.agenda__rechazar {
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: #9b1c12;
}

.agenda__aprobar {
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.agenda__vacio {
  background: #e3efec;
  color: #0b4a47;
  border-radius: 14px;
  padding: 16px;
  font-size: 14px;
  font-weight: 700;
}

.agenda__pie {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

@media (max-width: 1100px) {
  .agenda__cuerpo {
    flex-direction: column;
  }

  .agenda__lateral {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .agenda.safic-main {
    padding: 20px 16px;
  }
}
</style>
