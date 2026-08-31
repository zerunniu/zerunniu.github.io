/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_VOICE_WORKER_URL?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
