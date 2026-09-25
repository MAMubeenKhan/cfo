import {Suspense} from 'react'
import {SanityApp, type SanityConfig} from '@sanity/sdk-react'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import './styles.css'
import {Board} from './Board'
import {DATASET, PROJECT_ID} from './data'

const theme = buildTheme()
const config: SanityConfig[] = [{projectId: PROJECT_ID, dataset: DATASET}]

const Loading = () => (
  <div style={{display: 'grid', placeItems: 'center', height: '100dvh', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-muted)'}} role="status">
    Opening the case board…
  </div>
)

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <SanityApp config={config} fallback={<Loading />}>
        <Suspense fallback={<Loading />}>
          <Board />
        </Suspense>
      </SanityApp>
    </ThemeProvider>
  )
}
