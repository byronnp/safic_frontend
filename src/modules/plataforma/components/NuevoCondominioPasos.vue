<template>
  <ol class="pasos" aria-label="Pasos del asistente">
    <li v-for="(p, i) in pasos" :key="p.titulo" class="pasos__item">
      <button
        type="button"
        class="pasos__boton"
        :class="{
          'pasos__boton--activo': i + 1 === actual,
          'pasos__boton--hecho': i + 1 < actual,
        }"
        :aria-current="i + 1 === actual ? 'step' : undefined"
        @click="emit('ir', i + 1)"
      >
        <span class="pasos__numero" aria-hidden="true">
          <q-icon v-if="i + 1 < actual" name="sym_r_check" size="18px" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="pasos__textos">
          <span class="pasos__titulo">{{ p.titulo }}</span>
          <span class="pasos__sub">{{ p.sub }}</span>
        </span>
      </button>
    </li>
  </ol>
</template>

<script setup lang="ts">
export interface PasoAsistente {
  titulo: string;
  sub: string;
}

defineProps<{ pasos: readonly PasoAsistente[]; actual: number }>();
const emit = defineEmits<{ ir: [paso: number] }>();
</script>

<style scoped>
.pasos {
  display: flex;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.pasos__item {
  flex: 1 1 0;
  min-width: 0;
}

.pasos__boton {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--safic-fondo-2);
  border: 1px solid var(--safic-borde);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.pasos__boton--hecho {
  background: #f1f6f5;
}

.pasos__boton--activo {
  background: #ffffff;
  border-color: var(--q-primary);
}

.pasos__numero {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
  background: var(--safic-borde);
  color: var(--safic-texto-suave);
}

.pasos__boton--activo .pasos__numero,
.pasos__boton--hecho .pasos__numero {
  background: var(--q-primary);
  color: #ffffff;
}

.pasos__textos {
  min-width: 0;
}

.pasos__titulo {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: var(--safic-texto);
}

.pasos__sub {
  display: block;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

@media (max-width: 1023px) {
  .pasos {
    flex-wrap: wrap;
  }

  .pasos__item {
    flex: 1 1 calc(50% - 10px);
  }
}
</style>
