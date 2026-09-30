<template>
  <q-page class="mesa">
    <!-- Barra oscura de la vista para proyector (no es el encabezado del layout) -->
    <div class="mesa__barra">
      <div class="mesa__barra-textos">
        <div class="mesa__barra-antetitulo">
          {{ ASAMBLEA_MESA.condominio }} · {{ ASAMBLEA_MESA.fecha }}
        </div>
        <div class="mesa__barra-titulo">{{ ASAMBLEA_MESA.titulo }}</div>
      </div>
      <span class="mesa__chip">{{ ASAMBLEA_MESA.instalacion }}</span>
      <span class="mesa__chip mesa__chip--presidente"
        >Presidente: {{ ASAMBLEA_MESA.presidente }}</span
      >
    </div>

    <div class="mesa__cuerpo">
      <aside class="mesa__lateral">
        <div class="mesa__quorum">
          <div class="mesa__seccion">QUÓRUM (ALÍCUOTAS PRESENTES)</div>
          <div class="mesa__quorum-valor">{{ formatoPct(QUORUM_MESA.porcentaje) }}</div>
          <div
            class="mesa__quorum-barra"
            role="progressbar"
            :aria-valuenow="QUORUM_MESA.porcentaje"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Quórum de alícuotas presentes"
          >
            <div class="mesa__quorum-relleno" :style="{ width: `${QUORUM_MESA.porcentaje}%` }" />
            <div class="mesa__quorum-minimo" :style="{ left: `${QUORUM_MESA.minimo}%` }" />
          </div>
          <div class="mesa__quorum-nota">{{ QUORUM_MESA.minimoTexto }}</div>
          <div class="mesa__asistencia">
            <div class="mesa__asistencia-caja">
              <div class="mesa__asistencia-n">{{ QUORUM_MESA.presencial }}</div>
              <div class="mesa__asistencia-etiqueta">Presencial</div>
            </div>
            <div class="mesa__asistencia-caja">
              <div class="mesa__asistencia-n">{{ QUORUM_MESA.enApp }}</div>
              <div class="mesa__asistencia-etiqueta">En la app</div>
            </div>
            <div class="mesa__asistencia-caja">
              <div class="mesa__asistencia-n">{{ QUORUM_MESA.conPoder }}</div>
              <div class="mesa__asistencia-etiqueta">Con poder</div>
            </div>
          </div>
        </div>

        <div class="mesa__orden">
          <div class="mesa__seccion mesa__seccion--orden">ORDEN DEL DÍA</div>
          <div v-for="(p, i) in puntos" :key="p.titulo" class="mesa__punto">
            <span class="mesa__punto-n" :class="`mesa__punto-n--${p.clase}`">{{ i + 1 }}</span>
            <span class="mesa__punto-titulo" :class="{ 'mesa__punto-titulo--actual': p.actual }">{{
              p.titulo
            }}</span>
            <span class="mesa__punto-estado" :class="`mesa__punto-estado--${p.claseEstado}`">{{
              p.estado
            }}</span>
          </div>
        </div>
      </aside>

      <section class="mesa__votacion" aria-live="polite">
        <div>
          <div class="mesa__antetitulo">{{ VOTACION_MESA.antetitulo }}</div>
          <h1 class="mesa__titulo">{{ VOTACION_MESA.titulo }}</h1>
        </div>
        <div class="mesa__cifras">
          <div class="mesa__cifra">
            <div class="mesa__cifra-etiqueta">Unidades con derecho a voto presentes</div>
            <div class="mesa__cifra-valor">{{ VOTACION_MESA.presentesConVoto }}</div>
          </div>
          <div class="mesa__cifra">
            <div class="mesa__cifra-etiqueta">Votos emitidos</div>
            <div class="mesa__cifra-valor">
              {{ resultado.emitidos }} de {{ VOTACION_MESA.presentesConVoto }}
            </div>
          </div>
          <div class="mesa__cifra mesa__cifra--mora">
            <div class="mesa__cifra-etiqueta">Presentes que no votan por mora</div>
            <div class="mesa__cifra-valor">{{ VOTACION_MESA.presentesEnMora }}</div>
          </div>
        </div>

        <div v-for="b in barras" :key="b.etiqueta" class="mesa__resultado">
          <div class="mesa__resultado-etiqueta">{{ b.etiqueta }}</div>
          <div class="mesa__resultado-pista">
            <div
              class="mesa__resultado-barra"
              :style="{ width: `${b.valor}%`, background: b.color }"
            />
          </div>
          <div class="mesa__resultado-pct">{{ formatoPct(b.valor) }}</div>
        </div>
        <div class="mesa__nota">
          Porcentajes sobre las alícuotas presentes con derecho a voto. Los asistentes ven el
          resultado al cerrar la votación.
        </div>

        <div v-if="cerrada" class="mesa__final">{{ VOTACION_MESA.resultadoFinal }}</div>
        <div class="mesa__relleno" />
        <div class="mesa__acciones">
          <button type="button" class="mesa__registrar" @click="registrarVoto">
            Registrar voto en mesa
          </button>
          <div class="mesa__relleno" />
          <button
            type="button"
            class="mesa__accion"
            :class="cerrada ? 'mesa__accion--siguiente' : 'mesa__accion--cerrar'"
            @click="cerrada = !cerrada"
          >
            {{ cerrada ? `Siguiente punto: ${VOTACION_MESA.siguientePunto}` : 'Cerrar votación' }}
          </button>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

import {
  ASAMBLEA_MESA,
  PUNTO_ACTUAL_MESA,
  PUNTOS_MESA,
  QUORUM_MESA,
  RESULTADO_ABIERTA,
  RESULTADO_CERRADA,
  VOTACION_MESA,
} from '@/modules/asambleas/demo/mesa';

const $q = useQuasar();
const cerrada = ref(false);

function formatoPct(n: number): string {
  return `${n.toFixed(1).replace('.', ',')} %`;
}

const resultado = computed(() => (cerrada.value ? RESULTADO_CERRADA : RESULTADO_ABIERTA));

const barras = computed(() => [
  { etiqueta: 'Sí', valor: resultado.value.si, color: 'var(--q-primary)' },
  { etiqueta: 'No', valor: resultado.value.no, color: '#b8641c' },
  { etiqueta: 'Abstención', valor: resultado.value.abstencion, color: '#8a857a' },
]);

const puntos = computed(() =>
  PUNTOS_MESA.map((p, i) => {
    const actual = i === PUNTO_ACTUAL_MESA;
    const estado = actual && cerrada.value ? 'Aprobado' : p.estado;
    const hecho = estado === 'Hecho' || estado === 'Aprobado';
    return {
      titulo: p.titulo,
      estado,
      actual,
      clase: actual ? 'actual' : hecho ? 'hecho' : 'pendiente',
      claseEstado: hecho ? 'hecho' : actual ? 'actual' : 'pendiente',
    };
  }),
);

function registrarVoto(): void {
  $q.dialog({
    title: 'Registrar voto en mesa',
    message: 'Voto de una unidad presente que no usa la app.',
    prompt: { model: '', type: 'text', label: 'Unidad (p. ej. A-305)', outlined: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Continuar', color: 'primary', unelevated: true, noCaps: true },
  }).onOk((unidad: string) => {
    const codigo = unidad.trim().toUpperCase();
    if (!codigo) return;
    $q.dialog({
      title: `Voto de ${codigo}`,
      options: {
        type: 'radio',
        model: 'si',
        items: [
          { label: 'Sí', value: 'si' },
          { label: 'No', value: 'no' },
          { label: 'Abstención', value: 'abstencion' },
        ],
      },
      cancel: { label: 'Cancelar', flat: true, noCaps: true },
      ok: { label: 'Registrar voto', color: 'primary', unelevated: true, noCaps: true },
    }).onOk(() => {
      $q.notify({ type: 'positive', message: `Voto de ${codigo} registrado` });
    });
  });
}
</script>

<style scoped>
.mesa {
  display: flex;
  flex-direction: column;
}

.mesa__barra {
  min-height: 76px;
  flex-shrink: 0;
  background: var(--safic-tinta);
  color: #ffffff;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 10px 32px;
}

.mesa__barra-textos {
  flex-grow: 1;
  min-width: 220px;
}

.mesa__barra-antetitulo {
  font-size: 13px;
  color: #b9cdc9;
  font-weight: 600;
}

.mesa__barra-titulo {
  font-size: 22px;
  font-weight: 800;
}

.mesa__chip {
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--safic-tinta-2);
  color: #c6e3dd;
  font-size: 13px;
  font-weight: 800;
}

.mesa__chip--presidente {
  background: var(--q-accent);
  color: var(--safic-tinta);
}

.mesa__cuerpo {
  flex-grow: 1;
  display: flex;
  gap: 20px;
  padding: 22px 32px;
  min-height: 0;
}

.mesa__lateral {
  width: 330px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mesa__quorum {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 16px;
  padding: 20px;
}

.mesa__seccion {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.mesa__seccion--orden {
  margin-bottom: 8px;
}

.mesa__quorum-valor {
  font-size: 52px;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -1px;
  color: #0b4a47;
  margin-top: 4px;
}

.mesa__quorum-barra {
  position: relative;
  height: 14px;
  border-radius: 7px;
  background: var(--safic-linea);
  overflow: hidden;
  margin-top: 6px;
}

.mesa__quorum-relleno {
  height: 14px;
  background: var(--q-primary);
}

.mesa__quorum-minimo {
  position: absolute;
  top: 0;
  width: 2px;
  height: 14px;
  background: var(--safic-texto);
}

.mesa__quorum-nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: 6px;
}

.mesa__asistencia {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
  text-align: center;
}

.mesa__asistencia-caja {
  background: #f7f6f2;
  border-radius: 10px;
  padding: 10px 4px;
}

.mesa__asistencia-n {
  font-size: 22px;
  font-weight: 800;
}

.mesa__asistencia-etiqueta {
  font-size: 11px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.mesa__orden {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 16px;
  padding: 16px 18px;
  flex-grow: 1;
}

.mesa__punto {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--safic-linea-2);
  font-size: 13px;
}

.mesa__punto-n {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.mesa__punto-n--actual {
  background: var(--q-accent);
  color: var(--safic-tinta);
}

.mesa__punto-n--hecho {
  background: var(--q-primary);
  color: #ffffff;
}

.mesa__punto-n--pendiente {
  background: var(--safic-borde);
  color: var(--safic-texto-suave);
}

.mesa__punto-titulo {
  flex-grow: 1;
  font-weight: 600;
}

.mesa__punto-titulo--actual {
  font-weight: 800;
}

.mesa__punto-estado {
  font-size: 11px;
  font-weight: 800;
}

.mesa__punto-estado--hecho {
  color: #0b4a47;
}

.mesa__punto-estado--actual {
  color: #8a3f0a;
}

.mesa__punto-estado--pendiente {
  color: var(--safic-texto-tenue);
}

.mesa__votacion {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 16px;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.mesa__antetitulo {
  font-size: 14px;
  font-weight: 800;
  color: var(--q-primary);
}

.mesa__titulo {
  margin: 6px 0 0 0;
  font-size: 34px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.6px;
}

.mesa__cifras {
  display: flex;
  gap: 14px;
}

.mesa__cifra {
  flex-grow: 1;
  background: #f7f6f2;
  border-radius: 12px;
  padding: 14px 16px;
}

.mesa__cifra-etiqueta {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.mesa__cifra-valor {
  font-size: 26px;
  font-weight: 800;
}

.mesa__cifra--mora {
  background: #fde8e6;
}

.mesa__cifra--mora .mesa__cifra-etiqueta,
.mesa__cifra--mora .mesa__cifra-valor {
  color: #9b1c12;
}

.mesa__resultado {
  display: grid;
  grid-template-columns: 150px 1fr 110px;
  align-items: center;
  gap: 16px;
}

.mesa__resultado-etiqueta {
  font-size: 20px;
  font-weight: 800;
}

.mesa__resultado-pista {
  height: 34px;
  border-radius: 10px;
  background: #f1efe8;
  overflow: hidden;
}

.mesa__resultado-barra {
  height: 34px;
  transition: width 0.4s ease;
}

.mesa__resultado-pct {
  font-size: 22px;
  font-weight: 800;
  text-align: right;
}

.mesa__nota {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.mesa__final {
  background: #e3efec;
  color: #0b4a47;
  border-radius: 14px;
  padding: 16px 20px;
  font-size: 22px;
  font-weight: 800;
}

.mesa__relleno {
  flex-grow: 1;
}

.mesa__acciones {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.mesa__registrar,
.mesa__accion {
  height: 54px;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  font-family: inherit;
}

.mesa__registrar {
  padding: 0 22px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-weight: 700;
}

.mesa__accion {
  padding: 0 26px;
  border: none;
  font-weight: 800;
  color: #ffffff;
}

.mesa__accion--cerrar {
  background: #9b1c12;
}

.mesa__accion--siguiente {
  background: var(--safic-tinta);
}

@media (max-width: 1100px) {
  .mesa__cuerpo {
    flex-direction: column;
  }

  .mesa__lateral {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .mesa__barra {
    padding: 12px 16px;
  }

  .mesa__cuerpo {
    padding: 16px;
  }

  .mesa__votacion {
    padding: 20px 16px;
  }

  .mesa__titulo {
    font-size: 26px;
  }

  .mesa__cifras {
    flex-direction: column;
  }

  .mesa__resultado {
    grid-template-columns: 90px 1fr 76px;
    gap: 10px;
  }

  .mesa__resultado-etiqueta {
    font-size: 15px;
  }

  .mesa__resultado-pct {
    font-size: 17px;
  }

  .mesa__registrar,
  .mesa__accion {
    width: 100%;
  }
}
</style>
