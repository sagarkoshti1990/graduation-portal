/// <reference path="../types/custom-elements.d.ts" />
// import { getTelemetryEvents, handleExitEvent } from '@workspace/utils/Helper';
import React, { useEffect, useRef } from 'react';

interface PlayerConfigProps {
  playerConfig: any;
}

const WebComponentPlayer = ({ playerConfig }: PlayerConfigProps) => {
  const WebComponentPlayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let playerScript: HTMLScriptElement | null = null;
    let cssLink: HTMLLinkElement | null = null;
    let playerElement: HTMLDivElement | null = null;

    const handlePlayerEvent = (event: any) => {
      console.log('Player Event', event.detail);
      if (event?.detail?.type === 'EXIT') {
        // handleExitEvent();
      }
    };

    const handleTelemetryEvent = (event: any) => {
      console.log('Telemetry Event', event.detail);
      // getTelemetryEvents(event.detail, 'video');
    };

    // Load jQuery first
    const jqueryScript = document.createElement('script');
    jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    jqueryScript.async = true;
    document.body.appendChild(jqueryScript);

    // Wait for jQuery to load before loading the player script
    jqueryScript.onload = () => {
      playerScript = document.createElement('script');
      playerScript.src =
        '/webComponentJs/sunbird-video-player/sunbird-video-player.js';
      playerScript.async = true;
      document.body.appendChild(playerScript);

      cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = '/webComponentJs/sunbird-video-player/styles.css';
      document.head.appendChild(cssLink);

      playerElement = WebComponentPlayerRef.current;

      // Ensure the script has loaded before adding event listeners
      playerScript.onload = () => {
        playerElement?.addEventListener('playerEvent', handlePlayerEvent);
        playerElement?.addEventListener('telemetryEvent', handleTelemetryEvent);
      };
    };

    return () => {
      // Remove event listeners
      playerElement?.removeEventListener('playerEvent', handlePlayerEvent);
      playerElement?.removeEventListener(
        'telemetryEvent',
        handleTelemetryEvent,
      );

      // Remove the scripts and CSS link
      if (playerScript && document.body.contains(playerScript)) {
        document.body.removeChild(playerScript);
      }
      if (cssLink && document.head.contains(cssLink)) {
        document.head.removeChild(cssLink);
      }
      if (document.body.contains(jqueryScript)) {
        document.body.removeChild(jqueryScript);
      }
    };
  }, []);

  return (
    <div className="player" style={{ height: 'auto' }}>
      {/* @ts-ignore - Custom web component */}
      <sunbird-video-player
        player-config={JSON.stringify(playerConfig)}
        ref={WebComponentPlayerRef}
      />
    </div>
  );
};

export default WebComponentPlayer;
