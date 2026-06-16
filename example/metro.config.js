const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '..');
const config = getDefaultConfig(__dirname);

// Resolve the library from ../src so edits hot-reload without a build step.
config.watchFolders = [root];
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
// Never resolve into the library's own node_modules (duplicate React etc.).
config.resolver.blockList = new RegExp(
  `${path.join(root, 'node_modules').replace(/[/\\]/g, '[/\\\\]')}[/\\\\].*`,
);

const LIBRARY_ENTRIES = {
  '@scanner/react-native-collapsible-tabs': path.join(root, 'src', 'index.ts'),
  '@scanner/react-native-collapsible-tabs/flash-list': path.join(
    root,
    'src',
    'flash-list.ts',
  ),
  '@scanner/react-native-collapsible-tabs/legend-list': path.join(
    root,
    'src',
    'legend-list.ts',
  ),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const entry = LIBRARY_ENTRIES[moduleName];
  if (entry) return { filePath: entry, type: 'sourceFile' };
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
