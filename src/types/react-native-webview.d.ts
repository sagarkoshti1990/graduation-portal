declare module 'react-native-webview' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  export interface WebViewMessageEvent {
    nativeEvent: {
      data: string;
    };
  }

  export interface WebViewProps {
    source: { html: string } | { uri: string };
    style?: ViewStyle;
    onLoadEnd?: () => void;
    onMessage?: (event: WebViewMessageEvent) => void;
    javaScriptEnabled?: boolean;
    domStorageEnabled?: boolean;
    startInLoadingState?: boolean;
    scalesPageToFit?: boolean;
    mixedContentMode?: 'never' | 'always' | 'compatibility';
    allowsInlineMediaPlayback?: boolean;
    mediaPlaybackRequiresUserAction?: boolean;
    ref?: any;
    allowFileAccessFromFileURLs?: boolean;
    allowUniversalAccessFromFileURLs?: boolean;
  }

  export class WebView extends Component<WebViewProps> {}
}
