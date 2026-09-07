const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    unstable_enableSymlinks: true,
    // The workspace root has its own devDependency copies of react/react-native
    // (installed for its own Jest suite). Metro's normal hierarchical lookup
    // walks up from the symlinked library's real path (under workspaceRoot)
    // and finds those FIRST, before extraNodeModules is ever consulted —
    // extraNodeModules is only a fallback for modules normal lookup can't
    // find at all. disableHierarchicalLookup forces Metro to use only the
    // explicit nodeModulesPaths list below (example's own node_modules
    // first), so both the app and the linked library share one React copy.
    disableHierarchicalLookup: true,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
