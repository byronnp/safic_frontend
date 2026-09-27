<template>
  <span class="badge" :class="`badge--${tono}`">
    <slot>{{ texto }}</slot>
  </span>
</template>

<script setup lang="ts">
/**
 * Insignia de estado de los mockups. Los tonos son fijos para todos los
 * condominios (no dependen de la apariencia):
 * - exito: pagado, ocupada, al día, aprobado
 * - alerta: pendiente, por vencer
 * - error: vencido, rechazado, en mora
 * - info: arrendada, en revisión
 * - neutro: vacía, borrador, inactivo
 * - acento: nuevo, principal
 */
export type TonoEstado = 'exito' | 'alerta' | 'error' | 'info' | 'neutro' | 'acento';

withDefaults(defineProps<{ tono?: TonoEstado; texto?: string }>(), { tono: 'neutro', texto: '' });
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1.2;
}

.badge--exito {
  background: #e3efec;
  color: #0b4a47;
}

.badge--alerta {
  background: #fff1dc;
  color: #8a3f0a;
}

.badge--error {
  background: #fde8e6;
  color: #9b1c12;
}

.badge--info {
  background: #e6ecf7;
  color: #23407a;
}

.badge--neutro {
  background: #f1efe8;
  color: #4e4a42;
}

.badge--acento {
  background: #fff1dc;
  color: #8a3f0a;
  font-weight: 800;
}
</style>
