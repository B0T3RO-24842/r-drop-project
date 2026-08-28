import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Home from './pages/home/Home'
import Products from './pages/products/Products'
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import ForgotPassword from './pages/login/ForgotPassword'
import UpdatePassword from './pages/login/UpdatePassword'
import Dashboard from './pages/dashboard/Dashboard'
import Perfil from './pages/dashboard/Perfil'
import MisProductos from './pages/dashboard/MisProductos'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/dashboard/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
            <Route path="/dashboard/productos" element={<PrivateRoute><MisProductos /></PrivateRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
