import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ExitIntentPopup from './components/ExitIntentPopup'
import WhatsAppButton from './components/WhatsAppButton'
import CookieConsent from './components/CookieConsent'
import WebMCPTools from './components/WebMCPTools'
import './App.css'

// Home is eager (the landing page Lighthouse measures for LCP). Every other
// route is code-split so it isn't downloaded until a visitor navigates there,
// which keeps the initial JS payload small.
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Orders = lazy(() => import('./pages/Orders'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const About = lazy(() => import('./pages/About'))
const Areas = lazy(() => import('./pages/Areas'))
const AreaDetail = lazy(() => import('./pages/AreaDetail'))
const Imprint = lazy(() => import('./pages/Imprint'))

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/areas/:slug" element={<AreaDetail />} />
            <Route path="/imprint" element={<Imprint />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <ExitIntentPopup />
      <WhatsAppButton />
      <CookieConsent />
      <WebMCPTools />
    </div>
  )
}

export default App
