import { SiteDataProvider } from './context/SiteDataContext'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ChainThread } from './components/ChainThread'
import { Categories } from './components/Categories'
import { Benefits } from './components/Benefits'
import { BestSellers } from './components/BestSellers'
import { Catalog } from './components/Catalog'
import { About } from './components/About'
import { InstagramStrip } from './components/InstagramStrip'
import { Newsletter } from './components/Newsletter'
import { Footer } from './components/Footer'
import { WhatsAppFloat } from './components/WhatsAppFloat'

function App() {
  return (
    <SiteDataProvider>
      <div className="font-body">
        <ChainThread />
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
      </div>
    </SiteDataProvider>
  )
}

export default App
