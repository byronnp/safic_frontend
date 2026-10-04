<template>
  <!-- Mapa de OpenStreetMap con un pin arrastrable. Las coordenadas también se pueden
       escribir a mano en los campos de al lado (alternativa sin mouse). -->
  <div class="mapa-ubicacion">
    <div ref="lienzo" class="mapa-ubicacion__lienzo" role="application" :aria-label="etiqueta" />
    <div class="mapa-ubicacion__ayuda">{{ ayuda }}</div>
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    latitud: string;
    longitud: string;
    /** Dónde abrir el mapa si todavía no hay pin (ej. el cantón elegido). */
    centro?: { lat: number; lng: number } | null;
    etiqueta?: string;
    ayuda?: string;
  }>(),
  {
    centro: null,
    etiqueta: 'Mapa de ubicación',
    ayuda: 'Arrastra el pin o haz clic en el mapa para marcar la entrada principal',
  },
);

const emit = defineEmits<{
  (e: 'update:latitud', valor: string): void;
  (e: 'update:longitud', valor: string): void;
}>();

/** Quito, si no hay pin ni cantón. */
const QUITO = { lat: -0.180653, lng: -78.467834 };

const lienzo = ref<HTMLDivElement | null>(null);
let mapa: L.Map | null = null;
let pin: L.Marker | null = null;

const icono = L.divIcon({
  className: 'mapa-ubicacion__pin',
  html: '<svg width="36" height="46" viewBox="0 0 36 46" aria-hidden="true"><path d="M18 1C8.6 1 1 8.4 1 17.6 1 30 18 45 18 45s17-15 17-27.4C35 8.4 27.4 1 18 1z" fill="#0E5E5B" stroke="#FFFFFF" stroke-width="2"/><circle cx="18" cy="17.5" r="6" fill="#FFFFFF"/></svg>',
  iconSize: [36, 46],
  iconAnchor: [18, 45],
});

function coordenadas(): L.LatLng | null {
  const lat = Number(props.latitud);
  const lng = Number(props.longitud);
  return props.latitud.trim() !== '' && Number.isFinite(lat) && Number.isFinite(lng)
    ? L.latLng(lat, lng)
    : null;
}

function emitir(punto: L.LatLng): void {
  emit('update:latitud', punto.lat.toFixed(6));
  emit('update:longitud', punto.lng.toFixed(6));
}

function colocar(punto: L.LatLng): void {
  if (!mapa) {
    return;
  }
  if (pin) {
    pin.setLatLng(punto);
    return;
  }
  pin = L.marker(punto, {
    draggable: true,
    icon: icono,
    keyboard: false,
    title: 'Entrada principal',
  })
    .addTo(mapa)
    .on('dragend', () => pin && emitir(pin.getLatLng()));
}

onMounted(() => {
  if (!lienzo.value) {
    return;
  }
  const inicial = coordenadas();
  const centro = inicial ?? (props.centro ? L.latLng(props.centro) : L.latLng(QUITO));

  mapa = L.map(lienzo.value, { center: centro, zoom: inicial ? 17 : 14, scrollWheelZoom: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);

  if (inicial) {
    colocar(inicial);
  }

  mapa.on('click', (e: L.LeafletMouseEvent) => {
    colocar(e.latlng);
    emitir(e.latlng);
  });
});

// Coordenadas escritas a mano → mover el pin.
watch(
  () => [props.latitud, props.longitud],
  () => {
    const punto = coordenadas();
    if (punto && mapa) {
      colocar(punto);
      if (!mapa.getBounds().contains(punto)) {
        mapa.setView(punto);
      }
    }
  },
);

// Cambió el cantón y aún no hay pin → abrir el mapa ahí.
watch(
  () => props.centro,
  (centro) => {
    if (centro && mapa && !coordenadas()) {
      mapa.setView(centro, 14);
    }
  },
);

onBeforeUnmount(() => {
  mapa?.remove();
  mapa = null;
  pin = null;
});
</script>

<style scoped>
.mapa-ubicacion {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  align-self: stretch;
  min-height: 320px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #d6dcd2;
  background: #e8ede6;
}

.mapa-ubicacion__lienzo {
  position: absolute;
  inset: 0;
}

.mapa-ubicacion__ayuda {
  position: absolute;
  left: 60px;
  right: 16px;
  top: 12px;
  width: fit-content;
  z-index: 500;
  background: #ffffff;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

:deep(.mapa-ubicacion__pin) {
  background: transparent;
  border: none;
}
</style>
