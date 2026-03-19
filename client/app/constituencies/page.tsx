import { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Constituencies - Kerala 2026',
};

export default async function ConstituenciesPage() {
  let constituencies = [];
  try {
    const res = await fetchApi('/constituencies');
    constituencies = res.data || [];
  } catch (err) {
    console.error("Failed to fetch constituencies:", err);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <div className="eyebrow">Demographic Map</div>
          <h1 className="text-4xl font-display font-black text-text-main mb-2">State <span className="text-green">Constituencies</span></h1>
          <p className="text-text-muted max-w-lg">View historical voting trends, district maps, and exact geographical seat distributions across Kerala.</p>
        </div>
        <div className="w-full md:w-auto flex gap-2">
          <select className="border border-border-dark px-4 py-2.5 rounded-lg bg-surface text-sm outline-none w-full md:w-auto">
            <option>All Districts</option>
            <option>Thiruvananthapuram</option>
            <option>Kollam</option>
            <option>Ernakulam</option>
          </select>
          <button className="bg-saffron text-white px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide hover:bg-saffron/90">Filter</button>
        </div>
      </div>

      {constituencies.length === 0 ? (
        <div className="bg-surface border border-border-dark p-12 rounded-xl text-center">
          <h3 className="font-display text-2xl font-bold mb-2">Mapping Geography...</h3>
          <p className="text-text-muted">Constituencies are waiting for map alignment in the database schema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {constituencies.map((c: any) => (
            <Link key={c.id} href={`/constituencies/${c.slug}`} className="bg-surface border border-border-dark rounded-xl p-5 hover:border-saffron hover:shadow-md transition-all flex items-center justify-between group">
              <div>
                <div className="text-[10px] text-green font-mono tracking-widest uppercase font-bold mb-1">District ID: {c.districtId}</div>
                <h3 className="font-display font-bold text-lg text-text-main group-hover:text-green transition-colors">{c.number} - {c.nameEn}</h3>
                <p className="text-sm text-text-muted mt-2">Category: {c.category.toUpperCase()} | Voters: {c.totalVoters2026?.toLocaleString() || 'TBA'}</p>
              </div>
              <div className="w-12 h-12 rounded-full border border-border-light bg-bg2 flex items-center justify-center text-text-light group-hover:bg-green group-hover:text-white group-hover:border-green transition-all">
                →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
