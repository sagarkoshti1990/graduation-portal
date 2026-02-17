/// <reference path="../../types/custom-elements.d.ts" />
import React, { useEffect, useRef, useState } from 'react';
import logger from '@utils/logger';
import { ActivityIndicator } from 'react-native';

interface PlayerConfigProps {
  /**
   * Configuration object passed to questionnaire-player-main as `apiConfig`.
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
  getProgress: (progress: number | { data: { percentage: number }; type: string }) => void;
  getToast: (toast: { message: string; toastType: string }) => void;
  afterSubmitCallback: (event?: any) => void | undefined;
}

const WebComponentPlayer: React.FC<PlayerConfigProps> = ({ playerConfig, getProgress: _getProgress, afterSubmitCallback,getToast: _getToast }) => {
  const playerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading to true when initialization begins
    setLoading(true);

    const apiConfig = playerConfig?.apiConfig || playerConfig;
    if (!apiConfig) {
      logger.warn('No apiConfig provided to questionnaire-player-main');
      setLoading(false);
      return;
    }

    // Dynamically load the questionnaire-player-webcomponent JS and both CSS files

    let playerScript: HTMLScriptElement | null = null;
    let mainCss: HTMLLinkElement | null = null;
    let themeCss: HTMLLinkElement | null = null;
    let materialIconsCss: HTMLLinkElement | null = null;
    let isCancelled = false;

    // Track loading state for all resources
    let scriptLoaded = false;
    let mainCssLoaded = false;
    let themeCssLoaded = false;
    let materialIconsCssLoaded = false;

    const checkAllLoaded = () => {
      if (isCancelled) return;
      
      if (scriptLoaded && mainCssLoaded && themeCssLoaded && materialIconsCssLoaded) {
        setLoading(false);
      }
    };

    const handleScriptLoad = () => {
      if (isCancelled) return;
      scriptLoaded = true;
      checkAllLoaded();
    };

    const handleScriptError = () => {
      if (isCancelled) return;
      logger.error('Failed to load questionnaire-player-webcomponent.js');
      setLoading(false);
    };

    const handleMainCssLoad = () => {
      if (isCancelled) return;
      mainCssLoaded = true;
      checkAllLoaded();
    };

    const handleMainCssError = () => {
      if (isCancelled) return;
      logger.error('Failed to load styles.css');
      setLoading(false);
    };

    const handleThemeCssLoad = () => {
      if (isCancelled) return;
      themeCssLoaded = true;
      checkAllLoaded();
    };

    const handleThemeCssError = () => {
      if (isCancelled) return;
      logger.error('Failed to load theme.css');
      setLoading(false);
    };

    const handleMaterialIconsCssLoad = () => {
      if (isCancelled) return;
      materialIconsCssLoaded = true;
      checkAllLoaded();
    };

    const handleMaterialIconsCssError = () => {
      if (isCancelled) return;
      logger.error('Failed to load Material Icons CSS');
      setLoading(false);
    };

    // Ensure we import the web component and its CSS once
    playerScript = document.createElement('script');
    playerScript.src = '/web-component/questionnaire-player-webcomponent.js';
    playerScript.async = true;
    playerScript.onload = handleScriptLoad;
    playerScript.onerror = handleScriptError;
    document.body.appendChild(playerScript);

    // Main CSS for web component styles
    mainCss = document.createElement('link');
    mainCss.rel = 'stylesheet';
    mainCss.href = '/web-component/styles.css';
    mainCss.onload = handleMainCssLoad;
    mainCss.onerror = handleMainCssError;
    document.head.appendChild(mainCss);

    // Theme CSS (for variable overrides)
    themeCss = document.createElement('link');
    themeCss.rel = 'stylesheet';
    themeCss.href = '/web-component/theme.css';
    themeCss.onload = handleThemeCssLoad;
    themeCss.onerror = handleThemeCssError;
    document.head.appendChild(themeCss);

    // Material Icons CSS
    materialIconsCss = document.createElement('link');
    materialIconsCss.rel = 'stylesheet';
    materialIconsCss.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    materialIconsCss.onload = handleMaterialIconsCssLoad;
    materialIconsCss.onerror = handleMaterialIconsCssError;
    document.head.appendChild(materialIconsCss);

    const handleMessage = (event: any) => {
      logger.info('Message from WebComponentPlayer:', event.detail);
    };
    window.addEventListener('message', handleMessage);

    // Cleanup on unmount
    return () => {
      isCancelled = true;
      
      // Remove event listeners
      if (playerScript) {
        playerScript.onload = null;
        playerScript.onerror = null;
      }
      if (mainCss) {
        mainCss.onload = null;
        mainCss.onerror = null;
      }
      if (themeCss) {
        themeCss.onload = null;
        themeCss.onerror = null;
      }
      if (materialIconsCss) {
        materialIconsCss.onload = null;
        materialIconsCss.onerror = null;
      }

      // Remove elements from DOM
      if (playerScript && document.body.contains(playerScript)) {
        document.body.removeChild(playerScript);
      }
      if (mainCss && document.head.contains(mainCss)) {
        document.head.removeChild(mainCss);
      }
      if (themeCss && document.head.contains(themeCss)) {
        document.head.removeChild(themeCss);
      }
      if (materialIconsCss && document.head.contains(materialIconsCss)) {
        document.head.removeChild(materialIconsCss);
      }

      window.removeEventListener('message', handleMessage);
    };

    // Assign config as property so the web component can read it
    // if (playerRef.current) {
    //   playerRef.current.apiConfig = apiConfig;
    // }
    // console.log('apiConfig', apiConfig);
  }, [playerConfig]);

  // Add event listener for custom events from questionnaire-player-main
  useEffect(() => {
    // Wait for loading to complete and element to be available
    if (loading) {
      return;
    }

    const playerElement = playerRef.current;
    if (!playerElement) {
      return;
    }

    // Handler for custom events dispatched from questionnaire-player-main
    const handleCustomEvent = (event: CustomEvent) => {
      logger.info('Custom event received from questionnaire-player-main:', {
        type: event.type,
        detail: event.detail,
      });

      // Handle progress event
      if (event.detail.type === 'submissionSuccess') {
        if(afterSubmitCallback) {
          afterSubmitCallback(event.detail);
        }
      } else if (event.detail.type === 'PROGRESS') {
        const progressValue = event.detail;
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
      } else if (event.detail.type === 'TOAST') {
        _getToast(event.detail.data);
      }
    };

    // Add event listener to the web component element
    playerElement.addEventListener('postMessage', handleCustomEvent as EventListener);

    // Cleanup: remove event listeners on unmount
    return () => {
      if (playerElement) {
        playerElement.removeEventListener('postMessage', handleCustomEvent as EventListener);
      }
    };
  }, [loading, _getProgress, afterSubmitCallback, _getToast]);

  if(loading) {
    return <ActivityIndicator size="large" color="#007AFF" />;
  }

  return (
    <div className="questionnaire-player-container" style={{ height: 'auto' }}>
      {/* @ts-ignore - Custom web component from questionnaire-webcomponent package */}
      <questionnaire-player-main
        ref={playerRef}
        apiconfig={JSON.stringify(playerConfig)}
      />
    </div>
  );
};

export default React.memo(WebComponentPlayer);
