import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '118725174739-6rtdafur9sqiihkeao6md7cgfrikd5j3.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
