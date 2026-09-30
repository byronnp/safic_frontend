<template>
  <q-page class="safic-main incidencias">
    <PaginaEncabezado miga="Seguridad y comunicación / Incidencias" titulo="Incidencias">
      <template #acciones>
        <div class="incidencias__promedio">
          Tiempo promedio de respuesta: <strong>{{ TIEMPO_PROMEDIO_RESPUESTA }}</strong>
        </div>
      </template>
    </PaginaEncabezado>

    <div class="incidencias__cuerpo">
      <div class="incidencias__tablero">
        <div v-for="col in columnas" :key="col.nombre" class="incidencias__columna">
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
            @click="seleccionId = t.id"
          >
            <span class="incidencias__tarjeta-meta">
              <IncidenciasPrioridad :prio="t.prio" />
              <span class="incidencias__cat">{{ t.cat }}</span>
            </span>
            <span class="incidencias__tarjeta-titulo">{{ t.titulo }}</span>
            <span class="incidencias__tarjeta-pie">{{ t.unidad }} · {{ t.hace }}</span>
          </button>
        </div>
      </div>

      <aside class="incidencias__detalle" aria-label="Detalle de la incidencia">
        <div class="incidencias__det-meta">
          <IncidenciasPrioridad :prio="sel.prio" />
          <span class="incidencias__det-cat">{{ sel.cat }} · #{{ sel.num }}</span>
        </div>
        <h2 class="incidencias__det-titulo">{{ sel.titulo }}</h2>
        <div class="incidencias__det-autor">
          Reportado por {{ sel.autor }} · {{ sel.unidad }} · {{ sel.hace }}
        </div>
        <div class="incidencias__det-desc">{{ sel.desc }}</div>
        <div class="incidencias__fotos">
          <div class="incidencias__foto">Foto 1</div>
          <div class="incidencias__foto">Foto 2</div>
        </div>
        <div class="incidencias__seccion">COMENTARIOS</div>
        <div
          v-for="(c, i) in comentarios"
          :key="i"
          class="incidencias__comentario"
          :class="{ 'incidencias__comentario--interna': c.interna }"
        >
          <strong>{{ c.autor }}</strong> · {{ c.texto }}
        </div>
        <div class="incidencias__espacio" />
        <textarea
          v-model="texto"
          rows="2"
          class="incidencias__texto"
          aria-label="Escribe un comentario"
          placeholder="Escribe un comentario para el residente"
        />
        <div class="incidencias__acciones">
          <button type="button" class="incidencias__nota" @click="agregarNota">Nota interna</button>
          <button
            type="button"
            class="incidencias__avanzar"
            :class="{ 'incidencias__avanzar--off': sel.estado >= 2 }"
            :disabled="sel.estado >= 2"
            @click="avanzar"
          >
            {{ ACCION_AVANZAR_INCIDENCIA[sel.estado] }}
          </button>
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import IncidenciasPrioridad from '@/modules/comunicacion/components/IncidenciasPrioridad.vue';
import {
  ACCION_AVANZAR_INCIDENCIA,
  COLUMNAS_INCIDENCIAS,
  COMENTARIOS_INCIDENCIA,
  INCIDENCIAS,
  TIEMPO_PROMEDIO_RESPUESTA,
} from '@/modules/comunicacion/demo/incidencias';
import type {
  ComentarioIncidencia,
  EstadoIncidencia,
  Incidencia,
} from '@/modules/comunicacion/demo/incidencias';

const $q = useQuasar();

const incidencias = ref<Incidencia[]>(INCIDENCIAS.map((t) => ({ ...t })));
const seleccionId = ref(INCIDENCIAS[0]!.id);
const comentarios = ref<ComentarioIncidencia[]>([...COMENTARIOS_INCIDENCIA]);
const texto = ref('');

const columnas = computed(() =>
  COLUMNAS_INCIDENCIAS.map((nombre, ci) => ({
    nombre,
    items: incidencias.value.filter((t) => t.estado === ci),
  })),
);

const sel = computed<Incidencia>(
  () => incidencias.value.find((t) => t.id === seleccionId.value) ?? incidencias.value[0]!,
);

function avanzar(): void {
  const actual = sel.value;
  if (actual.estado >= 2) return;
  const siguiente = (actual.estado + 1) as EstadoIncidencia;
  incidencias.value = incidencias.value.map((t) =>
    t.id === actual.id ? { ...t, estado: siguiente } : t,
  );
  $q.notify({
    type: 'positive',
    message: `Incidencia #${actual.num} movida a ${COLUMNAS_INCIDENCIAS[siguiente]}`,
  });
}

function agregarNota(): void {
  const nota = texto.value.trim();
  if (!nota) {
    $q.notify({ type: 'warning', message: 'Escribe la nota antes de guardarla' });
    return;
  }
  comentarios.value = [...comentarios.value, { autor: 'Nota interna', texto: nota, interna: true }];
  texto.value = '';
  $q.notify({ type: 'positive', message: 'Nota interna guardada' });
}
</script>

<style scoped>
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
