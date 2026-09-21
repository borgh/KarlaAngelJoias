import { useState } from 'react'
import { SiteDataProvider } from './context/SiteDataContext'
import { CartProvider, useCart } from './context/CartContext'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Categories } from './components/Categories'
import { Benefits } from './components/Benefits'
import { BestSellers } from './components/BestSellers'
import { Catalog } from './components/Catalog'
import { About } from './components/About'
import { InstagramStrip } from './components/InstagramStrip'
import { Newsletter } from './components/Newsletter'
import { Footer } from './components/Footer'
import { WhatsAppFloat } from './components/WhatsAppFloat'
import { CartDrawer } from './components/CartDrawer'
import { CheckoutModal } from './components/Checkout/CheckoutModal'

// Componente interno só pra poder usar useCart() (precisa estar
// DENTRO do CartProvider) e coordenar sacola + checkout como um fluxo
// só: abrir o checkout fecha a sacola por trás, pra não sobrar um
// painel "fantasma" aberto quando o checkout for fechado depois.
function CartAndCheckout() {
  const { close: closeCart } = useCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <>
      <CartDrawer
        onCheckout={() => {
          closeCart()
          setCheckoutOpen(true)
        }}
      />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}

function App() {
  return (
    <SiteDataProvider>
      <CartProvider>
        <div className="font-body">
          <Navbar />
          <main>
            <Hero />
            <Categories />
            <Benefits />
            <BestSellers />
            <Catalog />
            <About />
            <InstagramStrip />
            <Newsletter />
          </main>
          <Footer />
          <WhatsAppFloat />
          <CartAndCheckout />
        </div>
      </CartProvider>
    </SiteDataProvider>
  )
}

export default App
