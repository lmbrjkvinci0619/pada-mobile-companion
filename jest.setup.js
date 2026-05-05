// Polyfill browser globals before any imports
if (typeof structuredClone === 'undefined') {
  global.structuredClone = function(data) {
    return JSON.parse(JSON.stringify(data));
  };
}

// Mock Expo and its internal logic before it crashes in Node
jest.mock('expo', () => ({}));
jest.mock('expo/src/winter', () => ({}));
jest.mock('expo/src/winter/runtime', () => ({}));
jest.mock('expo/src/winter/runtime.native', () => ({}));
jest.mock('expo/src/async-require/setup', () => ({}));

if (typeof window === 'undefined') {
  global.window = global;
}
global.__DEV__ = true;
process.env.EXPO_OS = 'ios';
global.window.location = { 
  protocol: 'https:',
  host: 'localhost',
  hostname: 'localhost',
  href: 'https://localhost',
  reload: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo Secure Store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

// Mock MMKV v4
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    getAllKeys: jest.fn(() => []),
    set: jest.fn(),
    remove: jest.fn(),
    clearAll: jest.fn(),
    contains: jest.fn(),
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
  })),
}));

// Mock NativeWind / Tailwind
jest.mock('nativewind', () => ({
  styled: (Component) => Component,
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: ({ children }) => children,
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  State: {},
  PanGestureHandler: 'PanGestureHandler',
  BaseButton: 'BaseButton',
  RectButton: 'RectButton',
}));

// Mock Supabase - fixed object without arrow functions to preserve this
jest.mock('./services/supabase', () => {
  const createBuilder = function() {
    const chain = {
      select: function() { return createBuilder(); },
      eq: function() { return createBuilder(); },
      in: function() { return createBuilder(); },
      or: function() { return createBuilder(); },
      order: function() { return createBuilder(); },
      single: function() { return Promise.resolve({ data: null, error: null }); },
      range: function() { return Promise.resolve({ data: [], error: null }); },
      limit: function() { return Promise.resolve({ data: [], error: null }); },
      upsert: function() { return Promise.resolve({ error: null }); },
      then: function(resolve) { return resolve({ data: [], error: null }); },
      catch: function() { return { data: [], error: null }; },
    };
    return chain;
  };
  return {
    supabase: {
      from: function() { return createBuilder(); },
      functions: { invoke: function() { return Promise.resolve({ data: null }); } },
      auth: { getSession: function() { return Promise.resolve({ data: { session: null }, error: null }); } },
    },
  };
});

