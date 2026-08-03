import { useEffect, useState } from 'react'
import Home from './pages/Home/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Properties from './pages/Properties/Properties'
import PropertyDetails from './pages/Properties/PropertyDetails'

function getCurrentPage() {
  if (typeof window === 'undefined') {
    return 'home'
  }

  const hash = window.location.hash.slice(1) // Remove the #
  const page = hash.split('?')[0] // Get page name before query params
  
  if (page === 'login') return 'login'
  if (page === 'register') return 'register'
  if (page === 'properties') return 'properties'
  if (page === 'property-details') return 'property-details'
  if (page === 'home' || page === '') return 'home'
  return 'home' // Default to home for any other hash
}

function App() {
  const [currentPage, setCurrentPage] = useState(getCurrentPage)

  useEffect(() => {
    // Update page based on hash changes
    const handleHashChange = () => {
      setCurrentPage(getCurrentPage())
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  if (currentPage === 'login') return <Login />
  if (currentPage === 'register') return <Register />
  if (currentPage === 'properties') return <Properties />
  if (currentPage === 'property-details') return <PropertyDetails />
  return <Home />
}

export default App
