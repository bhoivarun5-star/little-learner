import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { ChildProvider } from './hooks/useChild.jsx'
import { startConnectivityWatcher } from './services/connectivity.service.js'
import syncEngine from './sync/syncEngine.js'
import ConnectivityBar from './components/ConnectivityBar.jsx'
import BottomNav from './components/BottomNav.jsx'

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'))
const SelectChildPage = lazy(() => import('./pages/SelectChildPage.jsx'))
const DashboardPage = lazy(() => import('./pages/child/DashboardPage.jsx'))
const LearnPage = lazy(() => import('./pages/child/LearnPage.jsx'))
const ModulePage = lazy(() => import('./pages/child/ModulePage.jsx'))
const GamesPage = lazy(() => import('./pages/child/GamesPage.jsx'))
const ProgressPage = lazy(() => import('./pages/child/ProgressPage.jsx'))
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard.jsx'))

const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
    <div className="spinner" />
  </div>
)

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageLoader />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function ChildLayout({ children }) {
  return (
    <div className="app-layout">
      <main className="page-content">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
      <BottomNav />
    </div>
  )
}

function AppRoot() {
  useEffect(() => {
    // Start connectivity watcher and auto-sync on reconnect
    const cleanup = startConnectivityWatcher(
      async () => {
        // Online - trigger sync
        try { await syncEngine.push() } catch {}
      },
      null
    )
    return cleanup
  }, [])

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
      <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />

      {/* Redirect select-child to home directly */}
      <Route path="/select-child" element={<Navigate to="/child/home" replace />} />

      {/* Child learning routes */}
      <Route path="/child/home" element={<PrivateRoute><ChildLayout><DashboardPage /></ChildLayout></PrivateRoute>} />
      <Route path="/child/learn" element={<PrivateRoute><ChildLayout><LearnPage /></ChildLayout></PrivateRoute>} />
      <Route path="/child/learn/:slug" element={<PrivateRoute><ChildLayout><ModulePage /></ChildLayout></PrivateRoute>} />
      <Route path="/child/games" element={<PrivateRoute><ChildLayout><GamesPage /></ChildLayout></PrivateRoute>} />
      <Route path="/child/progress" element={<PrivateRoute><ChildLayout><ProgressPage /></ChildLayout></PrivateRoute>} />

      {/* Parent dashboard */}
      <Route path="/parent/dashboard" element={<PrivateRoute><Suspense fallback={<PageLoader />}><ParentDashboard /></Suspense></PrivateRoute>} />

      {/* Default redirect to home */}
      <Route path="/" element={<Navigate to="/child/home" replace />} />
      <Route path="*" element={<Navigate to="/child/home" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChildProvider>
          <AppRoot />
        </ChildProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
