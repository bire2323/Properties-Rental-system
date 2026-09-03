import AppRoutes from './routes/AppRoutes'
import { BookingProvider } from './context/BookingContext'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <BookingProvider>
      <AppRoutes />
      <Toaster />
    </BookingProvider>
  )
}

export default App