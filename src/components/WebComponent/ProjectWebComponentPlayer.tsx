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
  playerConfig: any;
}

const WebComponentPlayer = ({ playerConfig }: PlayerConfigProps) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<any>(null);

  // Native platform: Inject into WebView
  useEffect(() => {
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

    const projectData = escapeForJS(
      JSON.stringify(playerConfig.projectdata || {}),
    );
    const previewMode = escapeForJS(
      JSON.stringify(playerConfig.previewmode || false),
    );
    logger.log('projectData', projectData);

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
            
            // Helper function to create and append player
            const createPlayer = function() {
              const player = document.createElement('project-player');
              player.setAttribute('projectdata', '${projectData}');
              player.setAttribute('previewmode', '${previewMode}');
              container.innerHTML = '';
              container.appendChild(player);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'success',
                data: 'Player initialized'
              }));
            };
            
            // Check if custom element is available
            if (typeof customElements === 'undefined' || !customElements.get('project-player')) {
              if (customElements && customElements.whenDefined) {
                customElements.whenDefined('project-player')
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

      webViewRef.current.injectJavaScript(injectedJS);
    };

    // Try multiple times with increasing delays
    const timers: ReturnType<typeof setTimeout>[] = [];
    [1000, 2000, 3000, 5000].forEach(delay => {
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
      logger.info('Message from WebView:', message);

      if (message.type === 'domReady') {
        logger.info('DOM is ready:', message.data);
        // DOM is ready, we can use this info for debugging
      } else if (message.type === 'success') {
        logger.info('Player initialized successfully:', message.data);
        setLoading(false);
      } else if (message.type === 'playerEvent') {
        logger.info('Player event received:', message.data);
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
  // The path format points to the bundle root where project-player-dist/index.html should be located
  const webViewSource = Platform.select({
    android: {
      uri: 'file:///android_asset/project-player-dist/index.html',
    },
    ios: {
      uri: 'file:///project-player-dist/index.html',
    },
  }) || { uri: 'file:///android_asset/project-player-dist/index.html' }; // Fallback to Android path

  return (
    <View style={styles.container}>
      <LoadingIndicator loading={loading} />
      <WebView
        ref={webViewRef}
        source={webViewSource}
        style={styles.webView}
        onLoadEnd={() => {
          logger.info('WebView loaded');
          // Don't set loading to false here - wait for player initialization
        }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
