import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

function parseValue<T>(value: string | null): T | null {
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/** Preferências e cache não sensíveis. Nunca use para tokens ou dados secretos. */
export const localStorage: StorageAdapter = {
  async get<T>(key: string) {
    return parseValue<T>(await AsyncStorage.getItem(key));
  },
  async set<T>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

/** Tokens e pequenos segredos protegidos pelo Keychain/Keystore. */
export const secureStorage: StorageAdapter = {
  async get<T>(key: string) {
    return parseValue<T>(await SecureStore.getItemAsync(key));
  },
  async set<T>(key: string, value: T) {
    await SecureStore.setItemAsync(key, JSON.stringify(value), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async remove(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

