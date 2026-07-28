# Left Shortcuts

Add two independent native-style buttons to SiYuan's lower-left dock by default:

- Marketplace: opens Marketplace → Downloaded → Plugins
- Settings: opens SiYuan Settings

The original SiYuan entries remain unchanged. Disabling or uninstalling this plugin removes only the added shortcuts.

## Design

- Move each shortcut independently through SiYuan's native context menu: left top, left bottom, right top, right bottom, bottom left, or bottom right
- Persists the selected positions across restarts
- Uses SiYuan's native dock registration and settings API
- Works independently of Plugin Drawer's selected side
- Supports desktop and desktop-browser frontends

## Manual installation

1. Fully quit SiYuan.
2. Extract the manual package into:

   ```text
   {workspace}/data/plugins/
   ```

3. Verify the final path:

   ```text
   {workspace}/data/plugins/siyuan-plugin-left-shortcuts/plugin.json
   ```

4. Restart SiYuan and enable Left Shortcuts under Marketplace → Downloaded → Plugins.

## Compatibility

Version 0.1.4 is verified against SiYuan 3.7.3 and supports SiYuan 3.7.0 or later.
