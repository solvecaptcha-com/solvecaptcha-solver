import { defineManifest } from '@crxjs/vite-plugin';
import { version } from '../package.json';

// NOTE: do not include src/ in paths,
// vite root folder: src, public folder: public (based on the project root)
// @see ../vite.config.ts

const manifest = defineManifest(async () => ({
  manifest_version: 3,
  name: ``,
  description: '',
  version,
  background: {
    service_worker: 'public/service_worker.js',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', 'file:///*'],
      js: ['public/content/script.js'],
    },
  ],
  host_permissions: ['<all_urls>'],
  options_ui: {
    page: 'public/options/options.html',
    open_in_tab: true,
  },
  web_accessible_resources: [
    {
      resources: [
        'scr/index.html',
      ],
      matches: ['<all_urls>'],
    },
  ],
  action: {
    default_popup: 'public/popup/popup.html',
    default_icon: {
      '32': 'public/assets/images/extension_32.png',
      '128': 'public/assets/images/extension_128.png',
    },
  },
  icons: {
    '32': 'public/assets/images/extension_32.png',
    '128': 'public/assets/images/extension_128.png',
  },
  permissions: [
    "storage",
    "scripting",
    "contextMenus"
  ],
}));

export default manifest;
