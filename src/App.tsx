import { AnimatePresence, MotionConfig } from 'motion/react';
import { media } from './assets';
import { useAssetPreload } from './hooks/useAssetPreload';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { Manifesto } from './components/Manifesto/Manifesto';
import { Catalog } from './components/Catalog/Catalog';
import { OrderCTA } from './components/OrderCTA/OrderCTA';
import { DiscordSection } from './components/DiscordSection/DiscordSection';
import { Footer } from './components/Footer/Footer';
import { OrderExperience } from './components/OrderExperience/OrderExperience';
import { FloatingCartButton } from './components/Cart/FloatingCartButton';
import { ToastViewport } from './components/Toast/ToastViewport';
import { DiscordLoginModal } from './components/auth/DiscordLoginModal';

export default function App() {
  const { ready, progress } = useAssetPreload(
    [media.logos.principal, media.logos.simbolo, media.images.heroPoster],
    [media.videos.heroLoop],
  );

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{!ready && <LoadingScreen progress={progress} />}</AnimatePresence>
      <a href="#catalogo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-graphite">
        Pular para o catálogo
      </a>
      {ready && <Header />}
      <main>
        <Hero start={ready} />
        <Manifesto />
        <Catalog />
        <OrderCTA />
        <DiscordSection />
      </main>
      <Footer />
      <FloatingCartButton />
      <OrderExperience />
      <DiscordLoginModal />
      <ToastViewport />
    </MotionConfig>
  );
}
