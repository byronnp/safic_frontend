<template>
  <div class="app-pagina reservar">
    <!-- El mockup usa una barra blanca con "volver" en lugar del encabezado de color. -->
    <header class="reservar-barra">
      <router-link
        :to="{ name: 'app-mi-hogar' }"
        class="reservar-barra__volver"
        aria-label="Volver"
      >
        <q-icon name="sym_r_chevron_left" size="26px" />
      </router-link>
      <h1 class="reservar-barra__titulo">Reservar</h1>
    </header>

    <template v-if="!hecho">
      <div class="reservar-cuerpo">
        <div v-if="restringida" class="reservar-mora" role="alert">
          <strong>Reservas restringidas por cuotas vencidas.</strong> Paga o solicita un convenio y
          se habilitan en máximo 24 horas.
          <router-link :to="{ name: 'app-mi-cuenta' }" class="reservar-mora__enlace">
            Ver mi cuenta
          </router-link>
        </div>
        <div v-if="errorGeneral" class="reservar-mora" role="alert">{{ errorGeneral }}</div>

        <div v-if="areasConsulta.isError.value" class="safic-alerta" role="alert">
          {{ areasConsulta.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="areasConsulta.refetch()" />
        </div>
        <div v-else-if="areasConsulta.isPending.value" aria-busy="true">
          <q-skeleton type="rect" height="40px" />
        </div>
        <div v-else-if="areas.length === 0" class="app-tarjeta reservar-vacio">
          Por ahora no hay áreas habilitadas para reservar.
        </div>

        <template v-if="area">
          <div class="reservar-areas" role="group" aria-label="Área">
            <button
              v-for="item in areas"
              :key="item.id"
              type="button"
              class="reservar-area"
              :class="{ 'reservar-area--activa': item.id === area.id }"
              :aria-pressed="item.id === area.id"
              @click="elegirArea(item.id)"
            >
              {{ item.nombre }}
            </button>
          </div>

          <div class="app-tarjeta reservar-info">
            <span>{{ capacidadTexto }}</span
            ><span>{{ resumenCosto }}</span
            ><span>{{ textoAprobacion(area) }}</span>
          </div>

          <label v-if="unidades.length > 1" class="reservar-unidad">
            Reservar para la unidad
            <select v-model="unidadId" class="reservar-unidad__select">
              <option v-for="u in unidades" :key="u.unidad_id" :value="u.unidad_id">
                {{ u.codigo }}
              </option>
            </select>
          </label>

          <h2 class="reservar-subtitulo">Fecha</h2>
          <div class="reservar-dias" role="group" aria-label="Fecha">
            <q-skeleton v-if="dispo.isPending.value" type="rect" height="56px" width="100%" />
            <button
              v-for="(d, i) in dias"
              :key="d.fecha"
              type="button"
              class="reservar-dia"
              :class="{ 'reservar-dia--activo': i === diaIndice }"
              :aria-pressed="i === diaIndice"
              :disabled="!d.conLugar"
              @click="elegirDia(i)"
            >
              <span class="reservar-dia__semana">{{ d.semana }}</span>
              <span class="reservar-dia__numero">{{ d.numero }}</span>
            </button>
          </div>
          <div v-if="dispo.isError.value" class="safic-alerta" role="alert">
            {{ dispo.error.value?.mensaje }}
            <q-btn flat no-caps dense label="Reintentar" @click="dispo.refetch()" />
          </div>

          <h2 class="reservar-subtitulo">Horario</h2>
          <div class="reservar-horarios" role="group" aria-label="Horario">
            <button
              v-for="horario in horarios"
              :key="horario.etiqueta"
              type="button"
              class="reservar-horario"
              :class="{
                'reservar-horario--ocupado': horario.ocupado,
                'reservar-horario--activo': horario.elegido,
              }"
              :disabled="horario.ocupado"
              :aria-pressed="horario.elegido"
              @click="horarioIndice = horario.indice"
            >
              {{ horario.etiqueta }}
              <span class="reservar-horario__estado">{{ horario.estado }}</span>
            </button>
          </div>

          <div class="reservar-espacio" />

          <div class="app-tarjeta reservar-costos">
            <div class="reservar-costos__fila">
              <span class="reservar-costos__etiqueta">Costo de uso</span
              ><strong>{{ tieneCosto(area) ? formatoMoneda(area.costo) : 'Gratis' }}</strong>
            </div>
            <div v-if="tieneGarantia(area)" class="reservar-costos__fila">
              <span class="reservar-costos__etiqueta">Garantía (se devuelve)</span
              ><strong>{{ formatoMoneda(area.garantia) }}</strong>
            </div>
            <div v-if="tieneCosto(area)" class="reservar-costos__nota">
              Paga hasta 24 h antes o la reserva se cancela sola.
            </div>
          </div>

          <label class="reservar-acepto">
            <input v-model="acepta" type="checkbox" class="reservar-check" />
            <span>
              Acepto el
              <a href="#" class="reservar-acepto__enlace" @click.prevent="verReglamento"
                >reglamento del área</a
              >
            </span>
          </label>
        </template>
      </div>

      <div class="reservar-pie">
        <button
          type="button"
          class="reservar-principal"
          :class="{ 'reservar-principal--listo': listo }"
          :aria-disabled="!listo"
          @click="reservar"
        >
          {{ etiquetaBoton }}
        </button>
      </div>
    </template>

    <div v-else class="reservar-resultado">
      <div
        class="reservar-resultado__icono"
        :class="{ 'reservar-resultado__icono--revision': hecha?.estado === 'pendiente' }"
      >
        <q-icon name="sym_r_check" size="34px" />
      </div>
      <h2 class="reservar-resultado__titulo">
        {{ hecha?.estado === 'pendiente' ? 'Solicitud enviada' : 'Reserva confirmada' }}
      </h2>
      <p class="reservar-resultado__texto">{{ textoHecho }}</p>
      <div class="app-tarjeta reservar-resumen">
        <div class="reservar-costos__fila">
          <span class="reservar-costos__etiqueta">Área</span><strong>{{ area?.nombre }}</strong>
        </div>
        <div class="reservar-costos__fila">
          <span class="reservar-costos__etiqueta">Fecha</span><strong>{{ fechaTexto }}</strong>
        </div>
        <div class="reservar-costos__fila">
          <span class="reservar-costos__etiqueta">Horario</span><strong>{{ horarioTexto }}</strong>
        </div>
      </div>
      <router-link
        v-if="area && tieneCosto(area) && hecha?.estado === 'confirmada'"
        :to="{ name: 'app-mi-cuenta' }"
        class="reservar-principal reservar-principal--listo reservar-principal--enlace"
      >
        Ir a pagar
      </router-link>
      <button type="button" class="reservar-secundario" @click="otraReserva">
        Hacer otra reserva
      </button>
      <router-link :to="{ name: 'app-mis-reservas' }" class="reservar-secundario">
        Ver mis reservas
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { aApiError } from '@/core/api/errors';
import {
  useAreasReservables,
  useDisponibilidad,
  useReservarArea,
} from '@/modules/reservas/composables/useReservas';
import {
  diaConLugar,
  diaDeTira,
  ETIQUETA_FRANJA,
  fechaCorta,
  textoAprobacion,
  textoFranja,
  tieneCosto,
  tieneGarantia,
} from '@/modules/reservas/reservas.logica';
import type { MiReserva } from '@/modules/reservas/services/reservas.service';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';
import { formatoMoneda } from '@/utils/formato';

const $q = useQuasar();
const route = useRoute();
const session = useSessionStore();

const areasConsulta = useAreasReservables();
const areas = computed(() =>
  (areasConsulta.data.value?.areas ?? []).filter((a) => a.estado === 'disponible'),
);
const unidades = computed(() => areasConsulta.data.value?.unidades ?? []);

const areaId = ref<number | null>(null);
const unidadId = ref<number | null>(null);
const diaIndice = ref(0);
const horarioIndice = ref(-1);
const acepta = ref(false);
const hecha = ref<MiReserva | null>(null);
const errorGeneral = ref<string | null>(null);

const area = computed(() => areas.value.find((a) => a.id === areaId.value) ?? null);

// Al llegar las áreas se elige la pedida en la ruta (?area=) o la primera; y la primera unidad
watch(
  [areas, unidades],
  () => {
    if (!areas.value.some((a) => a.id === areaId.value)) {
      const pedida = Number(route.query.area);
      areaId.value = areas.value.find((a) => a.id === pedida)?.id ?? areas.value[0]?.id ?? null;
    }
    if (!unidades.value.some((u) => u.unidad_id === unidadId.value)) {
      unidadId.value = unidades.value[0]?.unidad_id ?? null;
    }
  },
  { immediate: true },
);

const desde = ref(hoyEcuador());
const dispo = useDisponibilidad(areaId, desde);

const dias = computed(() =>
  (dispo.data.value ?? []).map((d) => ({
    ...diaDeTira(d.fecha),
    fecha: d.fecha,
    conLugar: diaConLugar(d),
  })),
);
const dia = computed(() => dispo.data.value?.[diaIndice.value] ?? null);

// Al llegar los días, se elige el primero con lugar
watch(
  () => dispo.data.value,
  (lista) => {
    const primero = (lista ?? []).findIndex(diaConLugar);
    if (!lista?.[diaIndice.value] || !diaConLugar(lista[diaIndice.value]!)) {
      diaIndice.value = Math.max(primero, 0);
    }
    horarioIndice.value = -1;
  },
);

const horarios = computed(() =>
  (dia.value?.franjas ?? []).map((f, indice) => ({
    etiqueta: textoFranja(f),
    indice,
    ocupado: f.estado !== 'libre',
    elegido: indice === horarioIndice.value,
    estado:
      f.estado === 'libre'
        ? indice === horarioIndice.value
          ? 'Elegido'
          : 'Libre'
        : ETIQUETA_FRANJA[f.estado],
  })),
);

const capacidadTexto = computed(() =>
  area.value?.capacidad != null
    ? `${area.value.capacidad} pers.`
    : `Máx. ${area.value?.duracion_max_horas ?? 0} h`,
);
const resumenCosto = computed(() => {
  const a = area.value;
  if (!a) return '';
  return !tieneCosto(a)
    ? 'Gratis'
    : tieneGarantia(a)
      ? `${formatoMoneda(a.costo)} + garantía`
      : formatoMoneda(a.costo);
});

const reservando = useReservarArea();
// Una unidad en mora no reserva áreas restringibles (Decreto 462); la API lo exige igual
const restringida = computed(
  () =>
    (area.value?.restringible_por_mora ?? false) &&
    (unidades.value.find((u) => u.unidad_id === unidadId.value)?.restringida ?? false),
);

const listo = computed(
  () =>
    area.value !== null &&
    unidadId.value !== null &&
    horarioIndice.value >= 0 &&
    acepta.value &&
    !restringida.value &&
    !reservando.isPending.value,
);
const etiquetaBoton = computed(() =>
  restringida.value
    ? 'Reservas restringidas'
    : reservando.isPending.value
      ? 'Reservando…'
      : area.value?.requiere_aprobacion
        ? 'Solicitar reserva'
        : 'Reservar',
);

const hecho = computed(() => hecha.value !== null);
const fechaTexto = computed(() =>
  hecha.value ? fechaCorta(hecha.value.fecha) : dia.value ? fechaCorta(dia.value.fecha) : '',
);
const horarioTexto = computed(() => {
  if (hecha.value) return `${hecha.value.inicio}–${hecha.value.fin}`;
  const f = dia.value?.franjas[horarioIndice.value];
  return f ? textoFranja(f) : '';
});

const textoHecho = computed(() => {
  const a = area.value;
  if (hecha.value?.estado === 'pendiente') {
    return 'La administración revisará tu solicitud en máximo 48 horas. Al aprobarla se generan el costo de uso y la garantía.';
  }
  if (a && !tieneCosto(a)) return 'Tu horario quedó reservado. El guardia registrará tu ingreso.';
  return a
    ? `Paga ${formatoMoneda(a.costo)} hasta 24 horas antes; si no, la reserva se cancela sola.`
    : '';
});

function elegirArea(id: number): void {
  areaId.value = id;
  diaIndice.value = 0;
  horarioIndice.value = -1;
  errorGeneral.value = null;
}

function elegirDia(indice: number): void {
  diaIndice.value = indice;
  horarioIndice.value = -1;
}

// Otro condominio: nada de lo elegido queda
watch(
  () => session.condominioId,
  () => {
    areaId.value = null;
    unidadId.value = null;
    hecha.value = null;
    horarioIndice.value = -1;
    acepta.value = false;
    errorGeneral.value = null;
  },
);

async function reservar(): Promise<void> {
  // Un doble toque no reserva dos veces
  if (!listo.value || reservando.isPending.value) return;
  const franja = dia.value?.franjas[horarioIndice.value];
  if (!area.value || unidadId.value === null || !dia.value || !franja) return;
  errorGeneral.value = null;

  try {
    hecha.value = await reservando.mutateAsync({
      amenidad_id: area.value.id,
      unidad_id: unidadId.value,
      fecha: dia.value.fecha,
      inicio: franja.inicio,
      horas: area.value.duracion_min_horas,
      acepta_reglamento: acepta.value,
    });
  } catch (error) {
    const apiError = aApiError(error);
    if (apiError.codigo === 'HORARIO_OCUPADO') {
      // Alguien reservó antes: se muestra la disponibilidad actual y se elige otro
      horarioIndice.value = -1;
      await dispo.refetch();
    }
    // Sin respuesta o 5xx la reserva pudo crearse: se avisa para no duplicarla
    errorGeneral.value =
      apiError.estado === 0 || apiError.estado >= 500
        ? `${apiError.mensaje} Revisa Mis reservas antes de reintentar: pudo crearse.`
        : apiError.mensaje;
  }
}

function otraReserva(): void {
  hecha.value = null;
  horarioIndice.value = -1;
  acepta.value = false;
}

function verReglamento(): void {
  const texto = area.value?.reglamento;
  $q.dialog({
    title: `Reglamento · ${area.value?.nombre ?? ''}`,
    message: texto && texto.trim() !== '' ? texto : 'Esta área no tiene un reglamento escrito.',
    ok: { label: 'Entendido', unelevated: true, noCaps: true, color: 'primary' },
  });
}
</script>

<style scoped>
/* Los mockups usan el interlineado normal del navegador. */
.reservar {
  line-height: normal;
}

.reservar-barra {
  height: 60px;
  flex-shrink: 0;
  background: var(--safic-superficie);
  border-bottom: 1px solid var(--safic-borde);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.reservar-barra__volver {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--safic-texto);
  border-radius: 10px;
  text-decoration: none;
}

.reservar-barra__titulo {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.reservar-cuerpo {
  flex-grow: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reservar-mora {
  background: #fde8e6;
  border: 1px solid #f3b8b2;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  color: #7f1810;
  line-height: 1.45;
}

.reservar-unidad {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}

.reservar-unidad__select {
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-campo);
  padding: 0 10px;
  font-family: inherit;
  font-size: 15px;
  background: #ffffff;
}

.reservar-vacio {
  padding: 24px 16px;
  text-align: center;
  color: var(--safic-texto-suave);
}

.reservar-mora__enlace {
  color: #7f1810;
  font-weight: 800;
}

.reservar-areas {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  /* Deja ver el área táctil ampliada de las píldoras. */
  padding: 2px 0;
  margin: -2px 0;
}

/* Píldora de 40px como el mockup, con área táctil de 44px. */
.reservar-area {
  position: relative;
  flex-shrink: 0;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde-2);
}

.reservar-area::after {
  content: '';
  position: absolute;
  inset: -3px 0;
}

.reservar-area--activa {
  background: var(--q-primary);
  color: #ffffff;
  border-color: var(--q-primary);
}

.reservar-info {
  padding: 12px 14px;
  font-size: 13px;
  color: var(--safic-texto-2);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.reservar-subtitulo {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.reservar-dias {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.reservar-dia {
  height: 56px;
  border-radius: 12px;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde);
}

.reservar-dia--activo {
  background: var(--q-primary);
  color: #ffffff;
  border-color: var(--q-primary);
}

.reservar-dia__semana {
  display: block;
  font-size: 11px;
  font-weight: 700;
}

.reservar-dia__numero {
  display: block;
  font-size: 17px;
  font-weight: 800;
}

.reservar-horarios {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.reservar-horario {
  height: 54px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde-2);
}

.reservar-horario--activo {
  background: #e3efec;
  color: #0b4a47;
  border: 2px solid var(--q-primary);
}

.reservar-horario--ocupado {
  background: #eceae4;
  color: #8a857a;
  border-color: var(--safic-borde);
  cursor: not-allowed;
}

.reservar-horario__estado {
  display: block;
  font-size: 11px;
  font-weight: 600;
}

.reservar-espacio {
  flex-grow: 1;
}

.reservar-costos {
  padding: 12px 14px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reservar-costos__fila {
  display: flex;
}

.reservar-costos__etiqueta {
  flex-grow: 1;
  color: var(--safic-texto-suave);
}

.reservar-costos__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.reservar-acepto {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-size: 13px;
  color: var(--safic-texto-2);
  cursor: pointer;
}

.reservar-check {
  width: 20px;
  height: 20px;
  margin: 0;
  flex-shrink: 0;
  accent-color: var(--q-primary);
  cursor: pointer;
}

.reservar-acepto__enlace {
  font-weight: 700;
}

.reservar-pie {
  padding: 0 16px 16px;
  flex-shrink: 0;
}

.reservar-principal {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.reservar-principal--listo {
  background: var(--q-primary);
  color: #ffffff;
}

.reservar-principal--enlace {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.reservar-principal--enlace:hover {
  color: #ffffff;
  filter: brightness(0.92);
}

.reservar-resultado {
  flex-grow: 1;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}

.reservar-resultado__icono {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e3efec;
  color: #0b4a47;
}

.reservar-resultado__icono--revision {
  background: #fff1dc;
  color: #8a3f0a;
}

.reservar-resultado__titulo {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.reservar-resultado__texto {
  margin: 0;
  font-size: 15px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.reservar-resumen {
  width: 100%;
  padding: 14px;
  font-size: 14px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reservar-secundario {
  height: 44px;
  border: none;
  background: transparent;
  color: var(--q-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
</style>
