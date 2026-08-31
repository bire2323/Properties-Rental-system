import AppRoutes from './routes/AppRoutes'
import { BookingProvider } from './context/BookingContext'

function App() {
  return (
    <BookingProvider>
      <AppRoutes />
    </BookingProvider>
  )
}

export default App