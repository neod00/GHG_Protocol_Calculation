export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
        <p className="text-center text-sm leading-loose text-slate-500 dark:text-slate-400 md:text-left">
          © {new Date().getFullYear()} GHG Protocol Hub. Built for sustainability.
        </p>
        <div className="flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}