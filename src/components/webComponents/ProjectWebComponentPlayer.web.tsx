/// <reference path="../../types/custom-elements.d.ts" />
// import { getTelemetryEvents, handleExitEvent } from '@workspace/utils/Helper';
import React, { useEffect, useRef } from 'react';

interface PlayerConfigProps {
  playerConfig: any;
}

const WebComponentPlayer = ({ playerConfig }: PlayerConfigProps) => {
  const WebComponentPlayerRef = useRef<HTMLDivElement | null>(null);
  console.log(playerConfig, 'playerConfig');

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
    // Add global CSS variables for the color theme, matching the ones used in the project web component
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      :root {
        --primary-color: #8b0000;
        --primary-light-color: #a52a2a;
        --primary-dark-color: #5d0000;
        --secondary-color: #0066cc;
        --secondary-light-color: #4a9eff;
        --secondary-dark-color: #004499;
        --success-color: #28a745;
        --warning-color: #ffc107;
        --danger-color: #dc3545;
        --info-color: #17a2b8;
        --neutral-color: #6c757d;
        --light-gray-color: #f8f9fa;
        --gray-color: #6c757d;
        --dark-gray-color: #495057;
        --black-color: #2c3e50;
        --white-color: #ffffff;
        --progress-blue-color: #0066cc;
        --progress-purple-color: #6f42c1;
        --background-color: #ffffff;
        --card-background-color: #ffffff;
        --section-background-color: #f8f9fa;
        --border-color: #e9ecef;
        --border-light-color: #f1f3f4;
        --text-primary-color: #2c3e50;
        --text-secondary-color: #6c757d;
        --text-light-color: #adb5bd;
        --badge-not-enrolled: #8b0000;
        --badge-enrolled: #0066cc;
        --badge-in-progress: #ff6b35;
        --badge-completed: #28a745;
      }
    `;
    document.head.appendChild(styleTag);

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
  console.log(playerConfig, 'playerConfig 456');
  return (
    <div
      className="player"
      style={{ height: 'auto', backgroundColor: 'lightGray' }}
    >
      {/* @ts-ignore - Custom web component */}
      <project-player
        // projectData={JSON.stringify(playerConfig.projectData)}
        data={JSON.stringify(playerConfig.projectData)}
        config={JSON.stringify(playerConfig.config)}
        ref={WebComponentPlayerRef}
      />
    </div>
  );
};

export default WebComponentPlayer;
