import { useEffect } from 'react';
import { navigationRef } from '@utils/navigationRef';

const VERSION_URL = '/web-app-version.json';
/** Avoid reload storms if the main bundle stays cached while version.json updates */
const RELOAD_COOLDOWN_MS = 45_000;
const LAST_AUTO_RELOAD_KEY = '__web_deploy_last_autoreload_ms';
/** Coalesce rapid navigation transitions into one check */
const NAV_DEBOUNCE_MS = 400;

async function fetchRemoteBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { buildId?: string };
    return typeof data.buildId === 'string' ? data.buildId : null;
  } catch {
    return null;
  }
}

export function useWebDeploymentUpdate(): void {
  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) return;

    // @ts-ignore injected on web builds
    const localBuildId = process.env.WEB_APP_BUILD_ID ?? '';
    if (!localBuildId) return;

    let checkInFlight = false;
    const check = async () => {
      if (checkInFlight) return;
      checkInFlight = true;
      try {
        const remoteBuildId = await fetchRemoteBuildId();
        if (!remoteBuildId || remoteBuildId === localBuildId) return;

        const lastReload = Number(
          sessionStorage.getItem(LAST_AUTO_RELOAD_KEY) || '0'
        );
        if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) return;

        sessionStorage.setItem(LAST_AUTO_RELOAD_KEY, String(Date.now()));
        window.location.reload();
      } finally {
        checkInFlight = false;
      }
    };

    /** One scheduler for mount + nav so the first `state` event does not double-fetch with mount. */
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleCheck = (delayMs: number) => {
      if (debounceTimer != null) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        check().catch(() => {});
      }, delayMs);
    };

    scheduleCheck(0);

    const onNavigationState = () => scheduleCheck(NAV_DEBOUNCE_MS);

    const unsubscribe = navigationRef.addListener('state', onNavigationState);

    return () => {
      unsubscribe();
      if (debounceTimer != null) clearTimeout(debounceTimer);
    };
  }, []);
}
