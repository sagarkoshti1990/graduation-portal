// Custom web component type declarations
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sunbird-video-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'player-config'?: string;
        },
        HTMLElement
      >;
    }
  }
}
