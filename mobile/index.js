/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

LogBox.ignoreLogs(['AuthApiError: Invalid Refresh Token: Refresh Token Not Found']);

AppRegistry.registerComponent(appName, () => App);
