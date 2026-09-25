import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: 'oe22r9q65',
    entry: './src/App.tsx',
    title: 'Case Board',
  },
  deployment: {
    appId: 'v6xuv6jzd4yofy0qrrasddn7',
  },
})
