import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('MyApp', () => App);

// Run the app
AppRegistry.runApplication('MyApp', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
