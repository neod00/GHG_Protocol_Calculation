import { Header } from '@/components/Header';
import { MainCalculator } from '@/components/MainCalculator';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <MainCalculator />
      </main>
      <Footer />
    </div>
  );
}
