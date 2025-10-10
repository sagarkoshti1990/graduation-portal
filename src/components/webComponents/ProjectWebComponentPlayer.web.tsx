/// <reference path="../../types/custom-elements.d.ts" />
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

    // Load the player script directly (no jQuery)
    playerScript = document.createElement('script');
    playerScript.src = '/projectWebJs/project-player-component.js';
    playerScript.async = true;
    document.body.appendChild(playerScript);

    cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/projectWebJs/styles.css';
    document.head.appendChild(cssLink);

    playerElement = WebComponentPlayerRef.current;

    // Ensure the script has loaded before adding event listeners
    playerScript.onload = () => {
      playerElement?.addEventListener('playerEvent', handlePlayerEvent);
      playerElement?.addEventListener('telemetryEvent', handleTelemetryEvent);
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
    };
  }, []);

  return (
    <div className="player" style={{ height: 'auto' }}>
      {/* @ts-ignore - Custom web component */}
      <project-player
        config={JSON.stringify(playerConfig.config)}
        projectData={JSON.stringify(playerConfig.projectData)}
        ref={WebComponentPlayerRef}
      />
    </div>
  );
};

export default WebComponentPlayer;
