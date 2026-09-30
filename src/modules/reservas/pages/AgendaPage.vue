<template>
  <q-page class="safic-main agenda">
    <PaginaEncabezado miga="Áreas comunes / Agenda" :titulo="SEMANA_AGENDA">
      <template #acciones>
        <button type="button" class="agenda__nav" aria-label="Semana anterior">
          <q-icon name="sym_r_chevron_left" size="20px" />
        </button>
        <button type="button" class="agenda__boton">Hoy</button>
        <button type="button" class="agenda__nav" aria-label="Semana siguiente">
          <q-icon name="sym_r_chevron_right" size="20px" />
        </button>
        <button type="button" class="agenda__boton agenda__boton--primario" @click="bloquear">
          Bloquear área
        </button>
      </template>
    </PaginaEncabezado>

    <div class="agenda__cuerpo">
      <section class="agenda__calendario" aria-label="Calendario de la semana">
        <div class="agenda__scroll">
          <div class="agenda__grilla agenda__grilla--cabecera">
            <div class="agenda__cab-area">ÁREA</div>
            <div v-for="d in DIAS_AGENDA" :key="d.dow" class="agenda__cab-dia">
              <div class="agenda__dow">{{ d.dow }}</div>
              <div class="agenda__num">{{ d.num }}</div>
            </div>
          </div>
          <div v-for="fila in grilla" :key="fila.area" class="agenda__grilla agenda__fila">
            <div class="agenda__area">
              <div class="agenda__area-nombre">{{ fila.area }}</div>
              <div class="agenda__area-meta">{{ fila.meta }}</div>
            </div>
            <div v-for="(celda, i) in fila.celdas" :key="i" class="agenda__celda">
              <div
                v-for="(it, j) in celda"
                :key="j"
                class="agenda__item"
                :class="`agenda__item--${it.k}`"
              >
                <div class="agenda__item-hora">{{ it.hora }}</div>
                <div>{{ it.txt }}</div>
              </div>
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
          <span class="agenda__ley-nota"
            >Piscina y gimnasio: acceso libre con aforo, sin reserva</span
          >
        </div>
      </section>

      <aside class="agenda__lateral">
        <h2 class="agenda__lateral-titulo">Por aprobar ({{ pendientes.length }})</h2>
        <div v-for="p in pendientes" :key="p.id" class="agenda__solicitud">
          <div class="agenda__sol-cab">
            <div class="agenda__sol-area">{{ p.area }}</div>
            <span class="agenda__vence">{{ p.vence }}</span>
          </div>
          <div class="agenda__sol-texto">
            <strong>{{ p.fecha }}</strong> · {{ p.hora }}
          </div>
          <div class="agenda__sol-texto">{{ p.unidad }} · {{ p.persona }} · {{ p.invitados }}</div>
          <div class="agenda__sol-ok">
            <q-icon name="sym_r_check" size="16px" class="agenda__sol-ok-icono" />Unidad al día ·
            reglas cumplidas
          </div>
          <div class="agenda__sol-nota">
            Al aprobar se generan los cargos: uso $ 50,00 y garantía $ 100,00
          </div>
          <div class="agenda__sol-acciones">
            <button type="button" class="agenda__rechazar" @click="responder(p, 'rej')">
              Rechazar
            </button>
            <button type="button" class="agenda__aprobar" @click="responder(p, 'ok')">
              Aprobar
            </button>
          </div>
        </div>
        <div v-if="pendientes.length === 0" class="agenda__vacio">No hay reservas por aprobar.</div>
        <div class="agenda__pie">
          Las solicitudes sin respuesta en 48 horas vencen solas y liberan el horario.
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import {
  AREAS_AGENDA,
  DIAS_AGENDA,
  RESERVAS_AGENDA,
  SEMANA_AGENDA,
  SOLICITUDES_AGENDA,
} from '@/modules/reservas/demo/agenda';
import type { ReservaAgenda, SolicitudAgenda } from '@/modules/reservas/demo/agenda';

type Respuesta = 'ok' | 'rej';

const $q = useQuasar();
const respuestas = ref<Record<string, Respuesta>>({});

const reservas = computed<ReservaAgenda[]>(() => {
  const lista = [...RESERVAS_AGENDA];
  for (const p of SOLICITUDES_AGENDA) {
    const r = respuestas.value[p.id];
    if (r === 'rej') continue;
    lista.push({
      row: p.row,
      day: p.day,
      hora: p.hora,
      txt: p.unidad + (r === 'ok' ? '' : ' · por aprobar'),
      k: r === 'ok' ? 'ok' : 'pend',
    });
  }
  return lista;
});

const grilla = computed(() =>
  AREAS_AGENDA.map((a, r) => ({
    area: a.area,
    meta: a.meta,
    celdas: DIAS_AGENDA.map((_d, di) => reservas.value.filter((f) => f.row === r && f.day === di)),
  })),
);

const pendientes = computed(() => SOLICITUDES_AGENDA.filter((p) => !respuestas.value[p.id]));

function responder(p: SolicitudAgenda, r: Respuesta): void {
  respuestas.value = { ...respuestas.value, [p.id]: r };
  $q.notify({
    type: 'positive',
    message: r === 'ok' ? `Reserva de ${p.unidad} aprobada` : `Reserva de ${p.unidad} rechazada`,
  });
}

function bloquear(): void {
  $q.notify({ type: 'info', message: 'Elige el área y el horario que quieres bloquear' });
}
</script>

<style scoped>
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
