import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'

import './index.css'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const googleLoginEnabled = import.meta.env.VITE_GOOGLE_LOGIN_ENABLED === 'true' && Boolean(googleClientId)

const application = (
  <AuthProvider>
    <App />
  </AuthProvider>
)

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      {googleLoginEnabled ? (
        <GoogleOAuthProvider clientId={googleClientId}>{application}</GoogleOAuthProvider>
      ) : application}
    </ThemeProvider>
  </BrowserRouter>,
)