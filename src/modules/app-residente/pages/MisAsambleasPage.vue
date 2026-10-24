<template>
  <div class="app-pagina asm">
    <AppEncabezado :antetitulo="session.condominioActivo?.nombre ?? ''" titulo="Asambleas" />

    <div class="app-cuerpo asm__cuerpo">
      <div v-if="resultado" class="safic-alerta asm__ok" role="status">{{ resultado }}</div>
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 2" :key="i" type="rect" height="150px" aria-busy="true" />
      </template>
      <div v-else-if="asambleas.length === 0" class="app-tarjeta asm__vacio">
        <q-icon name="sym_r_how_to_vote" size="36px" class="text-suave" />
        <div>No hay asambleas convocadas por ahora.</div>
      </div>

      <article v-for="a in asambleas" :key="a.id" class="app-tarjeta asm__asamblea">
        <div class="asm__cab">
          <h2 class="asm__titulo">{{ a.titulo }}</h2>
          <EstadoBadge :tono="ESTADOS[a.estado].tono" :texto="ESTADOS[a.estado].nombre" />
        </div>
        <div class="asm__meta">
          <q-icon name="sym_r_event" size="18px" />{{ fechaHoraLarga(a.fecha_hora) }}
        </div>
        <div v-if="a.lugar" class="asm__meta">
          <q-icon name="sym_r_location_on" size="18px" />{{ a.lugar }}
        </div>

        <div v-if="a.representa.length > 0" class="asm__representa">
          <q-icon name="sym_r_badge" size="18px" />
          Representas por poder a: {{ a.representa.map((r) => r.unidad_codigo).join(', ') }}
        </div>

        <div v-if="a.unidades.length === 0" class="asm__nota">
          Solo los propietarios votan; los inquilinos pueden asistir con un poder del propietario.
        </div>
        <ul v-else class="asm__unidades">
          <li v-for="u in a.unidades" :key="u.unidad_id" class="asm__unidad">
            <div class="asm__unidad-cab">
              <strong>{{ u.codigo }}</strong>
              <EstadoBadge
                v-if="u.poder"
                :tono="ESTADOS_PODER[u.poder.estado].tono"
                :texto="ESTADOS_PODER[u.poder.estado].nombre"
              />
              <span v-else class="asm__nota">Asistes tú</span>
            </div>
            <div v-if="u.poder" class="asm__nota">
              {{ nombreTipoPoder(u.poder.tipo) }} a {{ u.poder.representante_nombre }}.
              {{ mensajeDePoder(u.poder) }}
            </div>
            <button
              v-if="
                u.poder &&
                (u.poder.estado === 'pendiente' || u.poder.estado === 'validado') &&
                a.puede_dar_poder
              "
              type="button"
              class="asm__enlace"
              :disabled="ocupado"
              @click="retirar(u.poder.id, u.codigo)"
            >
              Retirar poder
            </button>
          </li>
        </ul>

        <button
          v-if="a.puede_dar_poder && sinPoder(a).length > 0"
          type="button"
          class="asm__boton"
          :disabled="ocupado"
          @click="darPoder(a)"
        >
          <q-icon name="sym_r_badge" size="20px" />Dar poder a un representante
        </button>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { ESTADOS, fechaHoraLarga } from '@/modules/asambleas/asambleas.logica';
import PoderDialog from '@/modules/asambleas/components/PoderDialog.vue';
import { useMisAsambleas, useRetirarPoder } from '@/modules/asambleas/composables/useAsambleas';
import { ESTADOS_PODER, mensajeDePoder, nombreTipoPoder } from '@/modules/asambleas/poderes.logica';
import type { MiAsamblea } from '@/modules/asambleas/services/asambleas.service';
import { useSessionStore } from '@/stores/session';

const $q = useQuasar();
const session = useSessionStore();
const consulta = useMisAsambleas(computed(() => session.tienePermiso('asambleas.propias')));
const retirando = useRetirarPoder();
const asambleas = computed(() => consulta.data.value ?? []);
const ocupado = computed(() => retirando.isPending.value);
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

watch(
  () => session.condominioId,
  () => {
    resultado.value = null;
    errorAccion.value = null;
  },
);

/** Unidades que todavía no tienen un poder en pie (uno rechazado se puede reemplazar). */
function sinPoder(a: MiAsamblea): { unidad_id: number; codigo: string }[] {
  return a.unidades.filter((u) => u.poder === null || u.poder.estado === 'rechazado');
}

function darPoder(a: MiAsamblea): void {
  resultado.value = null;
  $q.dialog({
    component: PoderDialog,
    componentProps: { asambleaId: a.id, unidades: sinPoder(a) },
  }).onOk((mensaje: string) => {
    resultado.value = mensaje;
  });
}

function retirar(poderId: number, codigo: string): void {
  $q.dialog({
    title: 'Retirar poder',
    message: `Se retira el poder de ${codigo}. Podrás asistir tú o dar uno nuevo.`,
    cancel: { label: 'Volver', flat: true, noCaps: true },
    ok: { label: 'Retirar', color: 'negative', unelevated: true, noCaps: true },
  }).onOk(() => {
    errorAccion.value = null;
    resultado.value = null;
    retirando.mutate(poderId, {
      onSuccess: () => {
        resultado.value = 'Poder retirado.';
      },
      onError: (error) => {
        errorAccion.value = aApiError(error).mensaje;
      },
    });
  });
}
</script>

<style scoped>
.asm__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.asm__asamblea {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asm__cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.asm__titulo {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}

.asm__meta,
.asm__representa {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.asm__representa {
  font-weight: 700;
}

.asm__nota {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.asm__unidades {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asm__unidad {
  padding: 10px 12px;
  border: 1px solid var(--safic-borde);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asm__unidad-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.asm__enlace {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: #9b1c12;
  font-weight: 700;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.asm__boton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  border: none;
  border-radius: 10px;
  background: var(--q-primary);
  color: #ffffff;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.asm__boton:disabled {
  opacity: 0.6;
  cursor: default;
}

.asm__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  text-align: center;
}
</style>
