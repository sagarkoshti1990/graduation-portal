import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface PlayerConfigProps {
  playerConfig: any;
}

const WebComponentPlayer = ({ playerConfig }: PlayerConfigProps) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    // Wait a bit for WebView to be ready, then inject the player config
    const timer = setTimeout(() => {
      if (webViewRef.current && playerConfig) {
        const injectedJS = `
          (function() {
            try {
              const videoElement = document.createElement('sunbird-video-player');
              videoElement.setAttribute('player-config', '${JSON.stringify(
                playerConfig,
              ).replace(/'/g, "\\'")}');
              
              // Send events back to React Native
              videoElement.addEventListener('playerEvent', function(event) {
                if (event && event.detail) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'playerEvent',
                    data: event.detail
                  }));
                  
                  if (event.detail.edata && event.detail.edata.type === 'EXIT') {
                    event.preventDefault();
                  }
                }
              });
              
              videoElement.addEventListener('telemetryEvent', function(event) {
                if (event && event.detail) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'telemetryEvent',
                    data: event.detail
                  }));
                }
              });
              
              const myPlayer = document.getElementById('my-player');
              if (myPlayer) {
                myPlayer.innerHTML = '';
                myPlayer.appendChild(videoElement);
              } else {
                console.error('my-player element not found');
              }
            } catch (error) {
              console.error('Error initializing player:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                data: error.toString()
              }));
            }
          })();
          true;
        `;

        webViewRef.current.injectJavaScript(injectedJS);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [playerConfig]);

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', message);

      if (message.type === 'playerEvent') {
        console.log('Player event received:', message.data);
        if (message.data?.edata?.type === 'EXIT') {
          console.log('Player exit event received');
          // Handle exit event - you can add navigation logic here
        }
      } else if (message.type === 'telemetryEvent') {
        console.log('Telemetry event received:', message.data);
        // Handle telemetry events
      } else if (message.type === 'error') {
        console.error('WebView error:', message.data);
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading Player...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        // source={{ html: htmlContent }}
        source={{
          uri: 'file:///android_asset/webComponentJs/sunbird-video-player/index.html',
        }}
        style={styles.webView}
        onLoadEnd={() => setLoading(false)}
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

export default WebComponentPlayer;
