import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kerala 2026 - Central Dashboard',
};

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-surface border-b border-border-light py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--saffron-dim),transparent_50%)] opacity-40"></div>
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center rounded-full border border-saffron/20 bg-saffron-dim px-4 py-1.5 text-[11px] font-semibold text-saffron tracking-widest uppercase font-mono shadow-sm">
            Phase 1 Data Tracking Active
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-[72px] font-black text-text-main leading-[1.1] tracking-tight">
            Kerala Legislative Assembly <br />
            <span className="text-saffron">Elections 2026</span>
          </h1>
          <p className="text-[17px] text-text-muted max-w-2xl mx-auto leading-relaxed pt-2">
            The definitive public election tracking portal for Kerala. Deep dive into all 140 constituencies, completely vet candidate affidavits, monitor party alliances, and follow real-time voting results transparently.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/constituencies" className="w-full sm:w-auto bg-text-main text-surface px-8 py-3.5 rounded-lg text-sm font-bold tracking-wide hover:bg-text-muted transition-all shadow-md">
              Explore Constituencies
            </Link>
            <Link href="/candidates" className="w-full sm:w-auto bg-surface text-text-main border-2 border-border-dark px-8 py-3.5 rounded-lg text-sm font-bold tracking-wide hover:border-saffron hover:text-saffron transition-all">
              View Candidates
            </Link>
          </div>
        </div>
      </section>

      {/* Unified Stats Grid */}
      <section className="py-16 px-6 bg-bg relative z-10 -mt-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-border-dark rounded-xl p-6 shadow-sm border-t-4 border-t-saffron">
              <div className="text-[10px] font-mono text-text-light uppercase tracking-widest mb-2 font-semibold">Total Seats</div>
              <div className="font-display text-4xl font-black text-text-main">140</div>
            </div>
            <div className="bg-surface border border-border-dark rounded-xl p-6 shadow-sm border-t-4 border-t-green">
              <div className="text-[10px] font-mono text-text-light uppercase tracking-widest mb-2 font-semibold">Declared</div>
              <div className="font-display text-4xl font-black text-text-main">342</div>
            </div>
            <div className="bg-surface border border-border-dark rounded-xl p-6 shadow-sm border-t-4 border-t-blue">
              <div className="text-[10px] font-mono text-text-light uppercase tracking-widest mb-2 font-semibold">Districts</div>
              <div className="font-display text-4xl font-black text-text-main">14</div>
            </div>
            <div className="bg-surface border border-border-dark rounded-xl p-6 shadow-sm border-t-4 border-t-red">
              <div className="text-[10px] font-mono text-text-light uppercase tracking-widest mb-2 font-semibold">Status</div>
              <div className="font-display text-3xl font-black text-text-main mt-1 leading-none">PRE-POLL</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Categories Section */}
      <section className="py-16 px-6 bg-surface border-t border-border-light">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-10 text-center">
             <h2 className="font-display text-3xl font-black mb-3">Public Data Modules</h2>
             <p className="text-text-muted">A citizen-first approach to analyzing the Kerala electoral landscape.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Component Cards leveraging theme CSS via Tailwind translations */}
            <Link href="/constituencies" className="group border border-border-dark bg-surface p-6 rounded-2xl hover:border-saffron hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-[10px] font-mono tracking-widest uppercase font-bold text-saffron mb-3">Geographic Map</div>
              <h3 className="font-display text-xl font-bold mb-2">Constituencies</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                Browse all 140 constituencies from Kasaragod to Thiruvananthapuram. View historical vote turnouts, demographic splits, and detailed boundaries.
              </p>
              <div className="text-xs font-bold text-saffron uppercase tracking-wider group-hover:translate-x-1 transition-transform">Access Directory →</div>
            </Link>

            <Link href="/candidates" className="group border border-border-dark bg-surface p-6 rounded-2xl hover:border-saffron hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-[10px] font-mono tracking-widest uppercase font-bold text-saffron mb-3">Profiles & Affidavits</div>
              <h3 className="font-display text-xl font-bold mb-2">Candidates</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                Review extensive profiles, educational background, criminal records, asset declarations, and social footprints for every registered candidate.
              </p>
              <div className="text-xs font-bold text-saffron uppercase tracking-wider group-hover:translate-x-1 transition-transform">Search Candidates →</div>
            </Link>

            <Link href="/parties" className="group border border-border-dark bg-surface p-6 rounded-2xl hover:border-saffron hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-[10px] font-mono tracking-widest uppercase font-bold text-saffron mb-3">Political Alliances</div>
              <h3 className="font-display text-xl font-bold mb-2">Parties & Coalitions</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                Understand the LDF, UDF, and NDA structures. View party ideologies, historic win performance, and allied candidate tickets.
              </p>
              <div className="text-xs font-bold text-saffron uppercase tracking-wider group-hover:translate-x-1 transition-transform">View Alliances →</div>
            </Link>

          </div>
        </div>
      </section>
    </div>
  );
}
