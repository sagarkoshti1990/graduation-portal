import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

const POLL_MS = 5 * 60 * 1000;
const VERSION_URL = '/web-app-version.json';

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
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) return;

    // Inlined by webpack DefinePlugin (webpack.config.js); not Node at runtime on web
    // @ts-ignore process.env is injected by webpack DefinePlugin on web builds
    const localBuildId = process.env.WEB_APP_BUILD_ID ?? '';
    if (!localBuildId) return;

    const check = async () => {
      if (dismissedRef.current) return;
      const remote = await fetchRemoteBuildId();
      if (!remote || remote === localBuildId) return;

      dismissedRef.current = true;
      Alert.alert(
        'Update available',
        'A new version is live. Refresh the page to load the latest code (this clears cached scripts).',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              dismissedRef.current = false;
            },
          },
          {
            text: 'Refresh',
            onPress: () => {
              window.location.reload();
            },
          },
        ],
        { cancelable: true }
      );
    };

    const interval = setInterval(check, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', check);

    const initial = window.setTimeout(check, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(initial);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', check);
    };
  }, []);
}
