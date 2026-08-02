import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import WhatsAppButton from './components/WhatsAppButton'
import CookieConsent from './components/CookieConsent'
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

// Neither of these paints anything above the fold: the exit-intent popup only
// arms itself 5s in (desktop only) and the WebMCP tools register for agentic
// browsers plus render an off-screen search form. Splitting them keeps their
// code out of the initial bundle. The cookie banner and the WhatsApp button
// stay eager — both are visible straight away.
const ExitIntentPopup = lazy(() => import('./components/ExitIntentPopup'))
const WebMCPTools = lazy(() => import('./components/WebMCPTools'))

function App() {
  const location = useLocation()
  const isProductsLanding = location.pathname === '/products'

  return (
    <div className={`app${isProductsLanding ? ' products-landing-app' : ''}`}>
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
      {!isProductsLanding && <Footer />}
      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>
      <WhatsAppButton />
      <CookieConsent />
      <Suspense fallback={null}>
        <WebMCPTools />
      </Suspense>
    </div>
  )
}

export default App
