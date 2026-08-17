import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Content from './pages/Content'
import Carousels from './pages/Carousels'
import Users from './pages/Users'
import Stock from './pages/Stock'
import NotificationSettingsPage from './pages/NotificationSettings'
import MobileNavSettings from './pages/MobileNavSettings'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/estoque" element={<Stock />} />
            <Route path="/categorias" element={<Categories />} />
            <Route path="/conteudo" element={<Content />} />
            <Route path="/carrossel" element={<Carousels />} />
            <Route path="/notificacoes" element={<NotificationSettingsPage />} />
            <Route path="/menu-inferior" element={<MobileNavSettings />} />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requires="canManageUsers">
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
