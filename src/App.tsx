import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@app/router'
import { useSettingsStore } from '@shared/settings/settingsStore'

const queryClient = new QueryClient()

function IdentityChip() {
  const userId = useSettingsStore((s) => s.userId)
  const organizationId = useSettingsStore((s) => s.organizationId)
  const valid = useSettingsStore((s) => s.isValid())

  if (!valid) {
    return <span className="af-chip af-chip--warn">Identity not set</span>
  }

  return (
    <span className="af-chip" title={`User ${userId} · Org ${organizationId}`}>
      org …{organizationId?.slice(-4)}
    </span>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="af-app">
          <header className="af-topbar">
            <div className="af-brand">
              <span className="af-brand__mark" aria-hidden="true" />
              <h1>Antifraud Demo</h1>
            </div>
            <div className="af-topbar__meta">
              <IdentityChip />
            </div>
          </header>
          <main className="af-main">
            <AppRouter />
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
