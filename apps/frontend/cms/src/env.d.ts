/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_CRS_PREVIEW_ORIGIN: string
  readonly VITE_POSTMESSAGE_PARENT_ORIGIN: string
  readonly VITE_TRACKING_ENABLED: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
