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
import { buildCssFromObject } from './WebComponentPlayer.web';

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
  styleObject?:any
}

const WebComponentPlayer = React.memo(
  ({styleObject={}, playerConfig, getProgress: _getProgress, afterSubmitCallback,getToast: _getToast,_getOfflineData }: PlayerConfigProps) => {
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
            // Inject theme variables
            const createThemeVariables = () => {
              const style = document.createElement('style');
              style.innerHTML = \`
                :root {
                  --primary-color: #A53E54;
                  --btn-outline: #A53E54;
                  --error-color: rgb(150, 4, 4);
                  --question-tip: gray;
                  --general-btn-text-color: white;
                  --general-btn-hover-bg: white;
                  --secondary-btn-bg: white;
                  --secondary-btn-hover-bg: whitesmoke;
                  --card-bg: white;
                  --disabled-btn-bg: gainsboro;
                  --disabled-btn-text: gray;
                  --mdc-icon-button-state-layer-size: '32px';
                  --mdc-outlined-text-field-outline-color: #e2e8f0;
                  --text-color: #1e293b;
                  --mat-select-trigger-text-size: 14px;
                  --mdc-checkbox-size: 16px !important;
                  --mdc-checkbox-state-layer-size: 16px !important;
                  --mdc-radio-state-layer-size: 16px !important;
                  --mdc-radio-size: 16px !important;
                  --colors-primary100: #fef2f2;
                  --colors-primary700: #6B1E31;
                  --colors-textLight700: #525252;
                  --colors-borderColor: #e2e8f0;
                  --colors-backgroundColor: #fafbfc;
                  --colors-backgroundLightSuccess: #EDFCF2;
                  --colors-backgroundLightError: #FEF1F1;
                }
                ${buildCssFromObject(styleObject)}
              \`;
              document.head.appendChild(style);
            };

            // Create variables first
            createThemeVariables();


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

        // Handle progress event
      if (message.type === 'success') {
        logger.info('Player initialized successfully:', message.data);
        setLoading(false);
      }
        if (message.type === 'submissionSuccess') {
        if(afterSubmitCallback) {
          afterSubmitCallback(message);
        }
      } else if (message.type === 'PROGRESS') {
        const progressValue = message;
        // Extract progress value - could be a number or an object with progress data
        if (typeof progressValue === 'number') {
          // Direct number value
          if (_getProgress) {
            _getProgress(progressValue);
          }
        } else if (typeof progressValue === 'object' && progressValue !== null) {
          // Check if it has the expected structure with data.percentage
          if ((progressValue as any).data?.percentage !== undefined) {
            // Pass the object structure as expected by Observation component
            if (_getProgress) {
              _getProgress({
                data: { percentage: (progressValue as any).data.percentage },
                type: (progressValue as any).type || event.type,
              });
            }
          } else {
            // Check common property names for progress value
            const value = (progressValue as any).progress ?? 
                         (progressValue as any).value ?? 
                         (progressValue as any).percentage ?? 
                         (progressValue as any).message;
            
            if (value !== undefined && typeof value === 'number') {
              if (_getProgress) {
                _getProgress(value);
              }
            } else {
              // If no numeric value found, pass the entire detail object
              logger.info('Progress event detail:', progressValue);
              if (_getProgress) {
                _getProgress(progressValue as any);
              }
            }
          }
        }
      } else if (message.type === 'QUESTIONNAIRE_SAVE') {
        // _getOfflineData(message)
        console.log(message)
        // _getToast(message.data);
      } else if (message.type === 'TOAST') {
        _getToast(message.data);
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
