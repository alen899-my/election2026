import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-light bg-surface/95 backdrop-blur">
      {/* Subtle Government Stripe indicator */}
      <div className="h-[2px] bg-gradient-to-r from-saffron via-surface to-green w-full opacity-60" />
      
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-2xl font-black text-text-main tracking-tight">
            Kerala<span className="text-saffron font-bold text-xl">2026</span>-2031
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-[13px] font-semibold tracking-wide uppercase text-text-muted hover:text-saffron transition-colors">Home</Link>
          <Link href="/constituencies" className="text-[13px] font-semibold tracking-wide uppercase text-text-muted hover:text-saffron transition-colors">Constituencies</Link>
          <Link href="/candidates" className="text-[13px] font-semibold tracking-wide uppercase text-text-muted hover:text-saffron transition-colors">Candidates</Link>
          <Link href="/parties" className="text-[13px] font-semibold tracking-wide uppercase text-text-muted hover:text-saffron transition-colors">Parties</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/live" className="text-[11px] font-mono font-bold tracking-widest bg-red text-white px-4 py-2 rounded-md hover:bg-red/90 transition-colors shadow-sm">
            LIVE RESULTS
          </Link>
        </div>
      </div>
    </header>
  );
}
