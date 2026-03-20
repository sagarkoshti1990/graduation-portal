/** Injected by webpack DefinePlugin for web builds (see webpack.config.js) */
declare namespace NodeJS {
  interface ProcessEnv {
    WEB_APP_BUILD_ID?: string;
  }
}
