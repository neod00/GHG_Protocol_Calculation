import { Header } from '@/components/Header';
import { MainCalculator } from '@/components/MainCalculator';
import { Footer } from '@/components/Footer';
import { createClient } from '@/utils/supabase/server';
import { LandingHero, LandingPageFeatures } from '@/components/LandingPageContent';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      <Header user={user} />

      {/* Hero Section */}
      <LandingHero user={user} />

      {/* Main Calculator Section */}
      <section id="calculator" className="relative z-20 -mt-12 pb-20">
        <div className="container mx-auto px-4">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
            {/* Gradient Line Top */}
            <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500"></div>

            <div className="p-4 md:p-8">
              <MainCalculator isAuthenticated={!!user} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <LandingPageFeatures />

      <Footer />
    </div>
  );
}
