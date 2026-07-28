import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import Home from './pages/Home';
import Offers from './pages/Offers';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import { useAuthStore } from './store/authStore';
import ShippingPolicy from './pages/ShippingPolicy';
import Returns from './pages/Returns';
import OrderTracking from './pages/OrderTracking';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Sitemap from './pages/Sitemap';
import CustomPanel from './pages/CustomPanel';
import AdminGuard from './components/AdminGuard';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import './styles/animations.css';

function App() {
  const { checkUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const isAdminPage = location.pathname.startsWith('/admin-motosportneu');
    document.documentElement.classList.toggle('admin-page', isAdminPage);
    return () => document.documentElement.classList.remove('admin-page');
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      checkUser();
      return;
    }

    // Initialize auth state when the app loads
    const initAuth = async () => {
      await checkUser();
    };
    
    initAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUser();
      } else {
        checkUser();
      }
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser]);

  return (
    <div className="flex min-h-screen flex-col bg-[#080808]">
      <Navbar />
      <main className="flex-grow animate-fadeInUp">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/orders" element={<OrderTracking />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/categories" element={<Navigate to="/products" replace />} />
          <Route path="/profile" element={<Navigate to="/" replace />} />
          <Route path="/admin-motosportneu" element={<AdminGuard><CustomPanel /></AdminGuard>} />
        </Routes>
      </main>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

export default App;
