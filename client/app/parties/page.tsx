import { Metadata } from 'next';
import { fetchApi } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Political Parties - Kerala 2026',
};

export default async function PartiesPage() {
  let parties = [];
  try {
    const res = await fetchApi('/parties');
    parties = res.data || [];
  } catch (err) {
    console.error("Failed to fetch parties:", err);
  }

  // Pre-filter parties by coalition strictly
  const ldfParties = parties.filter((p: any) => p.coalition === 'LDF');
  const udfParties = parties.filter((p: any) => p.coalition === 'UDF');
  const ndaParties = parties.filter((p: any) => p.coalition === 'NDA');

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <div className="eyebrow justify-center">Coalitions Tracker</div>
        <h1 className="text-4xl font-display font-black text-text-main mb-4">Political Alliances</h1>
        <p className="text-text-muted">A deep dive into the major fronts actively participating in the 2026 Legislative Assembly Election.</p>
      </div>

      {parties.length === 0 ? (
        <div className="bg-surface border border-border-dark p-12 rounded-xl text-center shadow-sm">
          <h3 className="font-display text-2xl font-bold mb-2">No Parties Registered</h3>
          <p className="text-text-muted">The internal tracker is awaiting data from the Party APIs.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* LDF */}
          <div className="bg-surface border border-border-dark rounded-xl p-6 shadow-sm border-t-8 border-t-red relative">
             <div className="absolute top-4 right-4 bg-red-dim text-red border border-red/30 px-3 py-1 rounded font-bold font-mono text-[10px]">INCUMBENT</div>
             <h2 className="font-display text-2xl font-black mb-2 pt-2">LDF</h2>
             <p className="text-xs font-mono text-text-light tracking-wide uppercase mb-6">Left Democratic Front</p>
             <div className="space-y-3">
               {ldfParties.map((p: any) => (
                 <div key={p.id} className="flex justify-between items-center pb-2 border-b border-border-light">
                   <span className="text-sm font-semibold">{p.nameEn}</span>
                   <span className="text-xs text-text-light font-mono" style={{color: p.colorHex}}>{p.abbreviation}</span>
                 </div>
               ))}
               {ldfParties.length === 0 && <span className="text-sm text-text-muted italic">No LDF parties tracked yet.</span>}
             </div>
          </div>

          {/* UDF */}
          <div className="bg-surface border border-border-dark rounded-xl p-6 shadow-sm border-t-8 border-t-blue">
             <h2 className="font-display text-2xl font-black mb-2 pt-2">UDF</h2>
             <p className="text-xs font-mono text-text-light tracking-wide uppercase mb-6">United Democratic Front</p>
             <div className="space-y-3">
               {udfParties.map((p: any) => (
                 <div key={p.id} className="flex justify-between items-center pb-2 border-b border-border-light">
                   <span className="text-sm font-semibold">{p.nameEn}</span>
                   <span className="text-xs text-text-light font-mono" style={{color: p.colorHex}}>{p.abbreviation}</span>
                 </div>
               ))}
               {udfParties.length === 0 && <span className="text-sm text-text-muted italic">No UDF parties tracked yet.</span>}
             </div>
          </div>
          
          {/* NDA */}
          <div className="bg-surface border border-border-dark rounded-xl p-6 shadow-sm border-t-8 border-t-saffron">
             <h2 className="font-display text-2xl font-black mb-2 pt-2">NDA</h2>
             <p className="text-xs font-mono text-text-light tracking-wide uppercase mb-6">National Democratic Alliance</p>
             <div className="space-y-3">
               {ndaParties.map((p: any) => (
                 <div key={p.id} className="flex justify-between items-center pb-2 border-b border-border-light">
                   <span className="text-sm font-semibold">{p.nameEn}</span>
                   <span className="text-xs text-text-light font-mono" style={{color: p.colorHex}}>{p.abbreviation}</span>
                 </div>
               ))}
               {ndaParties.length === 0 && <span className="text-sm text-text-muted italic">No NDA parties tracked yet.</span>}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
