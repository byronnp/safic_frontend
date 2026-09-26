import { defineStore } from '#q-app';
import { createPinia } from 'pinia';

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface PiniaCustomProperties {}
}

export default defineStore(() => createPinia());
