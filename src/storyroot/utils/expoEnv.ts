import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * true quando o app está rodando dentro do Expo Go. A partir da SDK 53, o Expo Go
 * não suporta mais `expo-notifications` no Android — até mesmo importar o pacote
 * estaticamente derruba o app. Use para pular esse recurso nesse ambiente.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
