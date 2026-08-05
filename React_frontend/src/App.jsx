import { useEffect, useState } from 'react'
import Home from './pages/Home/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Properties from './pages/Properties/Properties'
import PropertyDetails from './pages/Properties/PropertyDetails'
import Vehicles from './pages/Vehicles/Vehicles'
import VehicleDetails from './pages/Vehicles/VehicleDetails'

function getCurrentPage() {
  if (typeof window === 'undefined') {
    return 'home'
  }

  const hash = window.location.hash.slice(1) // Remove the #
  const page = hash.split('?')[0] // Get page name before query params
  
  console.log('getCurrentPage - Full hash:', window.location.hash);
  console.log('getCurrentPage - Extracted page:', page);
  
  if (page === 'login') return 'login'
  if (page === 'register') return 'register'
  if (page === 'properties') return 'properties'
  if (page === 'property-details') return 'property-details'
  if (page === 'vehicles') return 'vehicles'
  if (page === 'vehicle-details') {
    console.log('getCurrentPage - MATCHED vehicle-details!');
    return 'vehicle-details';
  }
  if (page === 'home' || page === '') return 'home'
  
  console.log('getCurrentPage - Defaulting to home for unknown page:', page);
  return 'home' // Default to home for any other hash
}

function App() {
  const [currentPage, setCurrentPage] = useState(getCurrentPage)

  useEffect(() => {
    // Update page based on hash changes
    const handleHashChange = () => {
      // #region debug-point B:app-hash-change
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'vehicle-navbar-nav',
          runId: 'pre-fix',
          hypothesisId: 'B',
          location: 'src/App.jsx:26',
          msg: '[DEBUG] App observed hash change',
          data: { hash: window.location.hash, nextPage: getCurrentPage() },
          ts: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      setCurrentPage(getCurrentPage())
    }

    // #region debug-point B:app-initial-page
    fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'vehicle-navbar-nav',
        runId: 'pre-fix',
        hypothesisId: 'B',
        location: 'src/App.jsx:40',
        msg: '[DEBUG] App initial page resolved',
        data: { hash: window.location.hash, currentPage },
        ts: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  if (currentPage === 'login') return <Login />
  if (currentPage === 'register') return <Register />
  if (currentPage === 'properties') return <Properties />
  if (currentPage === 'property-details') return <PropertyDetails />
  if (currentPage === 'vehicles') return <Vehicles />
  if (currentPage === 'vehicle-details') {
    console.log('App - Rendering VehicleDetails page!');
    return <VehicleDetails />
  }
  
  console.log('App - Rendering Home page, currentPage:', currentPage);
  return <Home />
}

export default App
