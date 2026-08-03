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
  const isAboutLanding = location.pathname === '/about'
  const isAreasLanding = location.pathname === '/areas'
  const isKosovoLanding = location.pathname === '/areas/kosovo'
  const isAlbaniaLanding = location.pathname === '/areas/albania'
  const isHungaryLanding = location.pathname === '/areas/hungary'
  const isCroatiaLanding = location.pathname === '/areas/croatia'
  const isSlovakiaLanding = location.pathname === '/areas/slovakia'
  const isGermanyLanding = location.pathname === '/areas/germany'

  return (
    <div className={`app${isProductsLanding ? ' products-landing-app' : ''}${isAboutLanding ? ' about-landing-app' : ''}${isAreasLanding ? ' areas-landing-app' : ''}${isKosovoLanding ? ' kosovo-landing-app' : ''}${isAlbaniaLanding ? ' albania-landing-app' : ''}${isHungaryLanding ? ' hungary-landing-app' : ''}${isCroatiaLanding ? ' croatia-landing-app' : ''}${isSlovakiaLanding ? ' slovakia-landing-app' : ''}${isGermanyLanding ? ' germany-landing-app' : ''}`}>
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
