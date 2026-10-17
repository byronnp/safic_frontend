<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 420px; max-width: 100%">
      <div class="q-pa-lg column" style="gap: 14px">
        <div>
          <div class="safic-dialogo__titulo">Escanear QR</div>
          <div class="text-suave q-mt-xs" style="font-size: 14px">
            Apunta la cámara al QR del visitante o escribe su código.
          </div>
        </div>

        <div v-if="soportado && !errorCamara" class="escaner__marco">
          <video ref="video" class="escaner__video" playsinline muted aria-label="Cámara" />
        </div>
        <div v-else class="safic-alerta" role="status">
          {{
            errorCamara ??
            'Este navegador no puede leer QR con la cámara. Escribe el código del visitante.'
          }}
        </div>

        <q-form novalidate @submit="usarCodigo">
          <div class="safic-campo">
            <label for="qr-codigo" class="safic-campo__etiqueta">Código del QR</label>
            <q-input
              v-model="codigo"
              for="qr-codigo"
              class="safic-input"
              outlined
              maxlength="64"
              hide-bottom-space
              autocomplete="off"
              :error="!!errorCodigo"
              :error-message="errorCodigo ?? undefined"
            />
          </div>
          <div class="row justify-end q-mt-md" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              class="safic-btn"
              label="Usar código"
            />
          </div>
        </q-form>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useSessionStore } from '@/stores/session';

// El navegador (Chrome, Edge, Android) trae un lector de QR propio; los tipos aún no vienen en TypeScript.
interface DetectorDeCodigos {
  detect: (fuente: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
}
type ConstructorDetector = new (opciones: { formats: string[] }) => DetectorDeCodigos;

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const Detector = (window as unknown as { BarcodeDetector?: ConstructorDetector }).BarcodeDetector;
const soportado = Detector !== undefined && !!navigator.mediaDevices?.getUserMedia;

const video = ref<HTMLVideoElement | null>(null);
const codigo = ref('');
const errorCodigo = ref<string | null>(null);
const errorCamara = ref<string | null>(null);

let leido = false;
let flujo: MediaStream | null = null;
let temporizador: ReturnType<typeof setInterval> | null = null;

function detener(): void {
  if (temporizador !== null) clearInterval(temporizador);
  temporizador = null;
  flujo?.getTracks().forEach((t) => t.stop());
  flujo = null;
}

async function iniciar(): Promise<void> {
  if (!soportado || Detector === undefined) return;
  try {
    flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch {
    errorCamara.value = 'No hay permiso para usar la cámara. Escribe el código del visitante.';
    return;
  }
  // El diálogo se cierra mientras se pedía el permiso: se suelta la cámara
  if (!video.value) {
    detener();
    return;
  }
  video.value.srcObject = flujo;
  await video.value.play().catch(() => undefined);
  // El diálogo se cerró mientras arrancaba el video: no se crea el lector
  if (!video.value) {
    detener();
    return;
  }
  const detector = new Detector({ formats: ['qr_code'] });
  temporizador = setInterval(() => {
    const v = video.value;
    if (!v || v.readyState < 2) return;
    void detector
      .detect(v)
      .then((r) => {
        const valor = r[0]?.rawValue;
        // Varias lecturas pueden estar en vuelo: solo cuenta la primera
        if (valor && !leido) {
          leido = true;
          detener();
          onDialogOK(valor.trim());
        }
      })
      .catch(() => undefined);
  }, 300);
}

function usarCodigo(): void {
  const limpio = codigo.value.trim();
  if (limpio.length < 5) {
    errorCodigo.value = 'Escribe el código completo del QR.';
    return;
  }
  detener();
  onDialogOK(limpio);
}

onMounted(() => void iniciar());
// La cámara nunca queda encendida al cerrar
onBeforeUnmount(detener);
</script>

<style scoped>
.escaner__marco {
  border-radius: 12px;
  overflow: hidden;
  background: #000000;
  aspect-ratio: 1 / 1;
}

.escaner__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
