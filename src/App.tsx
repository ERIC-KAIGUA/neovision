import { Landingpage } from './pages/landingpage'
import { ProductPage } from './pages/productpage'
import { ShopPage } from './pages/shoppage'
import { CartPage } from './pages/cartpage'
import { OrdersPage } from './pages/orderpage'
import { OrderTrackingPage } from './pages/Ordertrackingpage'
import { CheckoutPage } from './components/checkoutpage'
import { ProtectedAdminRoute } from './helper/protectedRoute'
import { BrowserRouter as Router, Routes, Route, Navigate  } from 'react-router-dom'
import ScrollToTop from './components/scrollToTop'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import FullPageLoader from './components/fullPageLoader'
import { AdminDashboard } from './admin/adminDashboard'
import { AdminOrdersPage } from './admin/adminOrderpage'
import { Toaster } from 'react-hot-toast'


const AuthRedirect = () => {
  const { user , role, loading } = useAuth();

  if(loading) return <FullPageLoader />

  if(user && role == "admin"){
    return <Navigate to= "/admin" replace ></Navigate>;
  }
  return <Landingpage />
} 

function App() {
 

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
             <Toaster
            position="top-right"
            gutter={10}
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: "'Outfit', sans-serif",
                fontSize: "13px",
                borderRadius: "14px",
                padding: "12px 16px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: "1px solid rgba(0,0,0,0.06)",
                color: "#111",
                background: "#fff",
              },
              success: {
                iconTheme: {
                  primary: "rgb(128,255,0)",
                  secondary: "#000",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          <Routes>
            <Route path = "/" element ={<AuthRedirect />} />
            <Route path= "/shoppage" element={<ShopPage/>}/>
            <Route path='/cart' element={<CartPage/>} />
            <Route path="/product/:category/:id" element={<ProductPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path='/admin' element = {
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } />
            <Route path='/admin/orders' element = {
              <ProtectedAdminRoute>
                <AdminOrdersPage />
              </ProtectedAdminRoute>
            } />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
