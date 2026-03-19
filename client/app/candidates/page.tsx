import { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Candidates - Kerala 2026',
};

export default async function CandidatesPage() {
  let candidates = [];
  try {
    const res = await fetchApi('/candidates');
    candidates = res.data || [];
  } catch (err) {
    console.error("Failed to fetch candidates:", err);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <div className="eyebrow">Database Live</div>
          <h1 className="text-4xl font-display font-black text-text-main mb-2">Search <span className="text-saffron">Candidates</span></h1>
          <p className="text-text-muted max-w-lg">Browse comprehensive candidate profiles including educational background, documented criminal records, and asset declarations.</p>
        </div>
        <div className="w-full md:w-auto">
          <input 
            type="search" 
            placeholder="Search by name, district, or constituency..." 
            className="border border-border-dark px-4 py-2.5 rounded-lg w-full md:w-80 focus:border-saffron focus:ring-1 focus:ring-saffron bg-surface outline-none" 
          />
        </div>
      </div>
      
      {candidates.length === 0 ? (
        <div className="bg-surface border border-border-dark p-12 rounded-xl text-center">
          <h3 className="font-display text-2xl font-bold mb-2">No Candidates Found</h3>
          <p className="text-text-muted">The database is currently awaiting Phase 1 data synchronization from the Admin Panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {candidates.map((c: any) => (
            <Link key={c.id} href={`/candidates/${c.slug}`} className="bg-surface border border-border-dark rounded-xl overflow-hidden hover:border-saffron hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group flex flex-col">
              <div className="h-40 bg-bg2 flex items-center justify-center border-b border-border-light relative overflow-hidden">
                {c.partyId && <div className="text-[10px] text-text-light font-mono font-bold tracking-widest absolute top-3 right-3 px-2 py-1 bg-surface border border-border-dark rounded shadow-sm z-10">PARTY SEAT</div>}
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt={c.nameEn} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-text-light font-mono opacity-50 block mt-8">No Photo Uploaded</span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-display font-bold text-xl mb-1 group-hover:text-saffron transition-colors text-text-main line-clamp-1">{c.nameEn}</h3>
                <p className="text-sm font-semibold text-text-muted mb-4 pb-4 border-b border-border">ID: {c.constituencyId}</p>
                
                <div className="flex gap-2 mt-auto">
                  {c.criminalCases > 0 ? (
                    <span className="text-[10px] bg-red-dim border border-red/20 text-red px-2.5 py-1 rounded font-mono font-bold tracking-widest whitespace-nowrap">{c.criminalCases} OR MORE CASES</span>
                  ) : (
                    <span className="text-[10px] bg-green-dim border border-green/20 text-green px-2.5 py-1 rounded font-mono font-bold tracking-widest whitespace-nowrap">CLEAN RECORD</span>
                  )}
                  {c.education && <span className="text-[10px] bg-blue-dim border border-blue/20 text-blue px-2.5 py-1 rounded font-mono font-bold tracking-widest ml-auto">{c.education.toUpperCase()}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
