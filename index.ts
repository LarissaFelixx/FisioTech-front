import { registerRootComponent } from 'expo';

import App from './src/App';

// registerRootComponent registra o componente como `main` no AppRegistry e
// prepara o ambiente tanto para o Expo Go quanto para builds nativas.
registerRootComponent(App);
