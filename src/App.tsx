import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@app/router'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <main>
          <h1>Antifraud Demo</h1>
          <AppRouter />
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
