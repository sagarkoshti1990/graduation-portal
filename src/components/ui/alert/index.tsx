import { Alert, Platform } from 'react-native';
import AlertWeb from './index web';
export default Platform.OS === 'web' ? AlertWeb : Alert;
