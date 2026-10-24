import { Platform } from 'react-native';
import reanimatedPackage from 'react-native-reanimated/package.json';

// Reanimated < 3.19 rebuilds event handlers every render without explicit
// dependencies. Reanimated 4+ warns when dependencies are passed on native.
// Once the peer minimum is >=3.19.0, keep dependencies only on web.
export const USE_REANIMATED_DEPENDENCIES =
  Platform.OS === 'web' || reanimatedPackage.version.startsWith('3.');
