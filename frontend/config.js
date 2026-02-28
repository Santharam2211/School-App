import { Platform } from 'react-native';

// Automatically pick the right backend URL based on platform:
// - Web (laptop browser): use localhost
// - Mobile (Expo Go): use the local network IP
export const BASE_URL =
    Platform.OS === 'web'
        ? 'http://localhost:5000'
        : 'http://10.35.217.192:5000';

export const API_BASE = `${BASE_URL}/api`;