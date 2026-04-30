import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import logger from '@utils/logger';

interface PlayerConfigProps {
  /**
   * Configuration passed down to the questionnaire web component.
   * Expected shape (from questionnaire-webcomponent docs):
   * {
   *   baseURL: string;
   *   fileSizeLimit: number;
   *   userAuthToken: string;
   *   solutionId: string;
   *   solutionType: 'survey' | 'observation';
   * }
   */
  playerConfig: any;
  getProgress: (
    progress: number | { data: { percentage: number }; type: string },
  ) => void;
  getToast: (toast: { message: string; toastType: string }) => void;
  afterSubmitCallback?: (event?: any) => void;
}

const WebComponentPlayer = React.memo(
  ({
    playerConfig,
    getProgress,
    getToast,
    afterSubmitCallback,
  }: PlayerConfigProps) => {
    const [loading, setLoading] = useState(true);
    const webViewRef = useRef<any>(null);

    // Native platform: Inject questionnaire-webcomponent into WebView
    useEffect(() => {
      setLoading(true);

      if (!playerConfig) {
        logger.warn('No playerConfig provided');
        setLoading(false);
        return;
      }

      // Escape JSON properly for injection into JavaScript string
      const escapeForJS = (str: string) => {
        return str
          .replace(/\\/g, '\\\\') // Escape backslashes first
          .replace(/'/g, "\\'") // Escape single quotes
          .replace(/"/g, '\\"') // Escape double quotes
          .replace(/\n/g, '\\n') // Escape newlines
          .replace(/\r/g, '\\r') // Escape carriage returns
          .replace(/\t/g, '\\t'); // Escape tabs
      };

      // Use playerConfig directly as apiConfig or from playerConfig.apiConfig
      const apiConfigObj = playerConfig.apiConfig || playerConfig;
      const apiConfigStr = escapeForJS(JSON.stringify(apiConfigObj || {}));

      const injectPlayer = () => {
        if (!webViewRef.current) {
          logger.warn('WebView ref not available');
          return;
        }

        const injectedJS = `
        (function() {
          try {
            // Check DOM readiness
            if (document.readyState === 'loading' || !document.body) {
              return false;
            }
            
            const container = document.getElementById('project-player');
            if (!container) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                data: 'project-player element not found'
              }));
              return false;
            }
            
            // Helper function to create and append questionnaire web component
            const createPlayer = function() {
              const player = document.createElement('questionnaire-player-main');
              try {
                player.setAttribute('apiconfig', "${apiConfigStr}");
              } catch (e) {
                console.error('Failed to parse apiConfig in WebView:', e);
              }
              container.innerHTML = '';
              container.appendChild(player);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'success',
                data: 'Questionnaire player initialized'
              }));
            };
            
            const ce = (typeof globalThis !== 'undefined' && globalThis.customElements) ? globalThis.customElements : null;

            // Check if custom element is available
            if (!ce || !ce.get('questionnaire-player-main')) {
              if (ce && ce.whenDefined) {
                ce.whenDefined('questionnaire-player-main')
                  .then(createPlayer)
                  .catch(function(err) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'error',
                      data: 'Custom element registration failed: ' + err.toString()
                    }));
                  });
                return false;
              }
              return false;
            }
            
            // Custom element is ready, create player immediately
            createPlayer();
            return true;
          } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              data: error.toString()
            }));
            return false;
          }
        })();
        true;
      `;
        // console.log('injectedJS', injectedJS);
        webViewRef.current.injectJavaScript(injectedJS);
      };

      // Try multiple times with increasing delays
      const timers: ReturnType<typeof setTimeout>[] = [];
      [1000, 2000].forEach(delay => {
        const timer = setTimeout(() => {
          injectPlayer();
        }, delay);
        timers.push(timer);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }, [playerConfig]);

    const handleMessage = (event: any) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);

        if (message.type === 'PROGRESS') {
          getProgress(message?.data?.percentage);
        } else if (message.type === 'TOAST') {
          getToast(message.data);
        } else if (message.type === 'domReady') {
          logger.info('DOM is ready:', message.data);
        } else if (message.type === 'success') {
          logger.info('Player initialized successfully:', message.data);
          setLoading(false);
        } else if (message.type === 'playerEvent') {
          logger.info('Player event received:', message.data);
          if (
            message.data?.type === 'submissionSuccess' &&
            afterSubmitCallback
          ) {
            afterSubmitCallback(message.data);
          }
          if (message.data?.edata?.type === 'EXIT') {
            logger.info('Player exit event received');
          }
        } else if (message.type === 'telemetryEvent') {
          logger.info('Telemetry event received:', message.data);
        } else if (message.type === 'error') {
          logger.error('WebView error:', message.data);
          setLoading(false);
        }
      } catch (error) {
        logger.error('Error parsing message from WebView:', error);
      }
    };

    // Native platform: Use WebView
    // For iOS, the HTML file should be copied to the iOS bundle during build
    // The path format points to the bundle root where web-component/index.html should be located
    const webViewSource = Platform.select({
      android: {
        uri: 'file:///android_asset/web-component/index.html',
      },
      ios: {
        uri: 'file:///web-component/index.html',
      },
    }) || { uri: 'file:///android_asset/web-component/index.html' }; // Fallback to Android path

    return (
      <View style={styles.container}>
        <LoadingIndicator loading={loading} />
        <WebView
          ref={webViewRef}
          source={webViewSource}
          style={styles.webView}
          onLoadEnd={() => {
            logger.info('WebView loaded');
            // Wait for player initialization message before hiding loader.
          }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    height: 450,
    width: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

const LoadingIndicator = ({ loading }: { loading: boolean }) =>
  loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading Player...</Text>
    </View>
  ) : null;

export default WebComponentPlayer;
