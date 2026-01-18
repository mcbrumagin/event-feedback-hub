/// <reference types="vite/client" />

// TODO VERIFY/ADD MORE ENV VARIABLES
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
