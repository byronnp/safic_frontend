<template>
  <!-- Panel "Agregar amenidad" (mockup F1AmenidadesCondominio) -->
  <div class="cabecera">
    <h2 class="cabecera__titulo">Agregar amenidad</h2>
    <button type="button" class="cabecera__cerrar" @click="emit('cerrar')">Cerrar</button>
  </div>

  <div class="fuentes" role="tablist" aria-label="Origen de la amenidad">
    <button
      v-for="f in FUENTES"
      :key="f.id"
      type="button"
      role="tab"
      class="fuentes__btn"
      :class="{ 'fuentes__btn--activa': fuente === f.id }"
      :aria-selected="fuente === f.id"
      @click="elegirFuente(f.id)"
    >
      {{ f.label }}
    </button>
  </div>

  <template v-if="fuente === 'cat'">
    <div class="seccion">ELIGE DEL CATÁLOGO</div>
    <div class="tipos">
      <button
        v-for="(t, i) in CATALOGO_AMENIDADES"
        :key="t.nombre"
        type="button"
        class="tipos__chip"
        :class="{ 'tipos__chip--activo': tipo === i }"
        :aria-pressed="tipo === i"
        @click="elegirTipo(i)"
      >
        {{ t.nombre }}{{ yaUsados(t.nombre) ? ` · tienes ${yaUsados(t.nombre)}` : '' }}
      </button>
    </div>
  </template>

  <template v-else>
    <div class="campo">
      <label for="amenidad-nombre">Nombre</label>
      <input
        id="amenidad-nombre"
        v-model="nombrePropio"
        class="campo__control"
        placeholder="Ej. Muelle, Huerto, Sala de cine"
      />
    </div>
    <div class="campo">
      <label for="amenidad-categoria">Categoría</label>
      <select
        id="amenidad-categoria"
        v-model="categoriaPropia"
        class="campo__control campo__control--select"
      >
        <option v-for="c in CATEGORIAS_PROPIAS" :key="c">{{ c }}</option>
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
        :class="{ 'interruptor--activo': reservablePropia }"
        :aria-checked="reservablePropia"
        aria-label="Reservable"
        @click="reservablePropia = !reservablePropia"
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
          @click="cantidad = Math.max(1, cantidad - 1)"
        >
          −
        </button>
        <span class="contador__valor" aria-live="polite">{{ cantidad }}</span>
        <button
          type="button"
          class="contador__btn"
          aria-label="Más"
          @click="cantidad = Math.min(10, cantidad + 1)"
        >
          +
        </button>
      </div>
    </div>
    <div class="campo">
      <label for="amenidad-ubicacion">Ubicación</label>
      <select
        id="amenidad-ubicacion"
        v-model="ubicacion"
        class="campo__control campo__control--select"
      >
        <option v-for="u in UBICACIONES_AMENIDAD" :key="u">{{ u }}</option>
      </select>
    </div>
  </div>

  <div class="aviso" :class="`aviso--${vista.tono}`" role="status">{{ vista.texto }}</div>
  <div class="col-grow" />
  <button
    type="button"
    class="agregar"
    :class="{ 'agregar--activo': valido }"
    :disabled="!valido"
    @click="agregar"
  >
    {{ nombres.length > 1 ? `Agregar ${nombres.length} amenidades` : 'Agregar amenidad' }}
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { CATALOGO_AMENIDADES, CATEGORIAS_PROPIAS, UBICACIONES_AMENIDAD } from '../demo/amenidades';
import type { Amenidad, CategoriaAmenidad, OrigenAmenidad } from '../demo/amenidades';

const props = defineProps<{ amenidades: Amenidad[] }>();
const emit = defineEmits<{ cerrar: []; agregar: [nuevas: Amenidad[]] }>();

const FUENTES: { id: OrigenAmenidad; label: string }[] = [
  { id: 'cat', label: 'Del catálogo' },
  { id: 'prop', label: 'Crear propia' },
];

const CATEGORIA_POR_NOMBRE: Record<string, CategoriaAmenidad> = {
  Recreación: 'rec',
  Deporte: 'dep',
  Social: 'soc',
  Servicios: 'ser',
  Seguridad: 'seg',
};

const fuente = ref<OrigenAmenidad>('cat');
const tipo = ref<number | null>(null);
const cantidad = ref(1);
const nombrePropio = ref('');
const categoriaPropia = ref(CATEGORIAS_PROPIAS[0] ?? 'Recreación');
const reservablePropia = ref(true);
const ubicacion = ref(UBICACIONES_AMENIDAD[0] ?? 'Área social');

const tipoCatalogo = computed(() =>
  tipo.value !== null ? (CATALOGO_AMENIDADES[tipo.value] ?? null) : null,
);

function yaUsados(nombreTipo: string): number {
  return props.amenidades.filter((a) => a.tipo === nombreTipo).length;
}

function elegirFuente(id: OrigenAmenidad) {
  fuente.value = id;
  cantidad.value = 1;
}

function elegirTipo(i: number) {
  tipo.value = i;
  cantidad.value = 1;
}

const nombreBase = computed(() =>
  fuente.value === 'cat' ? (tipoCatalogo.value?.nombre ?? '') : nombrePropio.value.trim(),
);

const reservable = computed(() =>
  fuente.value === 'cat' ? !!tipoCatalogo.value?.reservable : reservablePropia.value,
);

const enCatalogo = computed(
  () =>
    fuente.value === 'prop' &&
    CATALOGO_AMENIDADES.some((c) => c.nombre.toLowerCase() === nombreBase.value.toLowerCase()),
);

const nombres = computed(() => {
  const base = nombreBase.value;
  if (!base) {
    return [];
  }
  const usados = fuente.value === 'cat' ? yaUsados(base) : 0;
  if (reservable.value && cantidad.value > 1) {
    return Array.from({ length: cantidad.value }, (_, k) => `${base} ${usados + k + 1}`);
  }
  if (reservable.value && usados > 0) {
    return [`${base} ${usados + 1}`];
  }
  return [cantidad.value > 1 ? `${base} (${cantidad.value})` : base];
});

const valido = computed(() => !!nombreBase.value && !enCatalogo.value);

const vista = computed<{ texto: string; tono: 'neutro' | 'error' | 'info' | 'exito' }>(() => {
  if (!nombreBase.value) {
    return {
      texto:
        fuente.value === 'cat'
          ? 'Elige un tipo del catálogo.'
          : 'Escribe el nombre de la amenidad.',
      tono: 'neutro',
    };
  }
  if (enCatalogo.value) {
    return {
      texto: `"${nombreBase.value}" ya existe en el catálogo. Agrégala desde "Del catálogo" para mantener los valores sugeridos.`,
      tono: 'error',
    };
  }
  if (reservable.value && cantidad.value > 1) {
    return {
      texto: `Se crearán ${cantidad.value} registros para reservarlos por separado: ${nombres.value.join(', ')}.`,
      tono: 'info',
    };
  }
  return {
    texto:
      `Se creará: ${nombres.value[0] ?? ''}` +
      (reservable.value ? '. Después configura horarios y cobro en Áreas comunes.' : '.') +
      (fuente.value === 'prop' ? ' Solo tu condominio la verá.' : ''),
    tono: 'exito',
  };
});

function agregar() {
  if (!valido.value) {
    return;
  }
  const cat = tipoCatalogo.value;
  const deCatalogo = fuente.value === 'cat' && cat !== null;
  const categoria: CategoriaAmenidad = deCatalogo
    ? cat.categoria
    : (CATEGORIA_POR_NOMBRE[categoriaPropia.value] ?? 'rec');
  emit(
    'agregar',
    nombres.value.map((nombre) => ({
      nombre,
      tipo: deCatalogo ? nombreBase.value : 'Propia del condominio',
      categoria,
      origen: fuente.value,
      ubicacion: ubicacion.value,
      reservable: reservable.value,
      esencial: deCatalogo ? cat.esencial : false,
      info: reservable.value ? 'Falta configurar reservas' : 'Uso libre',
      fotos: 0,
      mantenimiento: null,
    })),
  );
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
