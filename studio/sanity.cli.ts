import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'cyh4xyo1',
    dataset: 'production'
  },
  studioHost: 'cryptid-field-office',
  deployment: {
    appId: 'zoh8n6an3fea59w4zor8b9xt',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
