import React from 'react';
import { Header } from './components/Header';
import { MainCalculator } from './components/MainCalculator';
import { Footer } from './components/Footer';
import { LanguageProvider } from './LanguageContext';
import { ThemeProvider } from './ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-ghg-bg text-ghg-dark flex flex-col dark:bg-gray-800 dark:text-gray-200">
          <Header />
          <main className="flex-grow container mx-auto p-4 md:p-8">
            <MainCalculator />
          </main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;