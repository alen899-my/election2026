"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface District {
  id: string;
  nameEn: string;
  nameMl?: string;
  constituencyCount: number;
  slug: string;
}

interface Party {
  id: string;
  nameEn: string;
  abbreviation: string;
  coalition: "LDF" | "UDF" | "NDA" | "IND";
  colorHex?: string;
  slug: string;
}

interface Constituency {
  id: string;
  nameEn: string;
  number: number;
  category: "general" | "sc" | "st";
  districtId: string;
  slug: string;
}

interface Candidate {
  id: string;
  nameEn: string;
  nameMl?: string;
  photoUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  profession?: string;
  education?: string;
  party?: Party;
  constituency?: Constituency;
  district?: District;
  electionYear: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const COALITION_COLORS: Record<string, string> = {
  LDF: "#cc0d0d",
  UDF: "#0078FF",
  NDA: "#F98C1F",
  IND: "#6b7280",
};

const COALITION_BG: Record<string, string> = {
  LDF: "#fff5f5",
  UDF: "#eff6ff",
  NDA: "#fff7ed",
  IND: "#f9fafb",
};

const SCHEDULE = [
  { event: "Notification", date: "16 Mar 2026" },
  { event: "Last date for nominations", date: "23 Mar 2026" },
  { event: "Scrutiny of nominations", date: "24 Mar 2026" },
  { event: "Last date for withdrawal", date: "26 Mar 2026" },
  { event: "Date of Polling", date: "9 Apr 2026", highlight: true },
  { event: "Counting of votes", date: "4 May 2026", highlight: true },
  { event: "Process completion", date: "6 May 2026" },
];

const POLL_DATA = [
  { agency: "Poll Mantra", date: "19 Mar 2026", ldf: 38.7, udf: 38.2, nda: 15.4, others: 7.7 },
];

const SEAT_PROJECTIONS = [
  { agency: "IANS–Matrize", date: "15 Mar 2026", ldf: "61–71", udf: "58–69", nda: "02–02" },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function CoalitionBadge({ coalition }: { coalition: string }) {
  return (
    <span
      style={{
        backgroundColor: COALITION_COLORS[coalition] + "22",
        color: COALITION_COLORS[coalition],
        border: `1px solid ${COALITION_COLORS[coalition]}44`,
      }}
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wider"
    >
      {coalition}
    </span>
  );
}

function PartyDot({ party }: { party?: Party }) {
  const color = party?.colorHex || COALITION_COLORS[party?.coalition || "IND"];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium"
      style={{ color }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {party?.abbreviation || "IND"}
    </span>
  );
}

function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0 ring-2 ring-white"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white text-white font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: "linear-gradient(135deg, #1e3a5f 0%, #0e4d92 100%)",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : {}}>
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ElectionPage() {
  const [districts, setDistricts]       = useState<District[]>([]);
  const [parties, setParties]           = useState<Party[]>([]);
  const [candidates, setCandidates]     = useState<Candidate[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Filters
  const [searchQ, setSearchQ]             = useState("");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterCoalition, setFilterCoalition] = useState("all");
  const [filterParty, setFilterParty]     = useState("all");
  const [activeTab, setActiveTab]         = useState<"candidates"|"parties"|"districts"|"polls"|"schedule">("candidates");

  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 24;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dRes, pRes, cRes, csRes] = await Promise.all([
        fetch(`${API}/districts`),
        fetch(`${API}/parties`),
        fetch(`${API}/candidates?limit=500`),
        fetch(`${API}/constituencies?limit=200`),
      ]);

      const [dData, pData, cData, csData] = await Promise.all([
        dRes.json(), pRes.json(), cRes.json(), csRes.json()
      ]);

      if (dData.success)  setDistricts(dData.data?.districts || dData.data || []);
      if (pData.success)  setParties(pData.data?.parties || pData.data || []);
      if (cData.success)  setCandidates(cData.data?.candidates || cData.data || []);
      if (csData.success) setConstituencies(csData.data?.constituencies || csData.data || []);
    } catch (e: any) {
      setError("Failed to load data. Is the backend running at " + API + "?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filtered candidates
  const filtered = candidates.filter((c) => {
    const q = searchQ.toLowerCase();
    if (q && !c.nameEn.toLowerCase().includes(q) &&
        !c.party?.abbreviation?.toLowerCase().includes(q) &&
        !c.constituency?.nameEn?.toLowerCase().includes(q)) return false;
    if (filterDistrict !== "all" && c.district?.id !== filterDistrict &&
        c.constituency?.districtId !== filterDistrict) return false;
    if (filterCoalition !== "all" && c.party?.coalition !== filterCoalition) return false;
    if (filterParty !== "all" && c.party?.id !== filterParty) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Stats
  const ldfCount = candidates.filter(c => c.party?.coalition === "LDF").length;
  const udfCount = candidates.filter(c => c.party?.coalition === "UDF").length;
  const ndaCount = candidates.filter(c => c.party?.coalition === "NDA").length;
  const femaleCount = candidates.filter(c => c.gender === "female").length;
  const withPhoto = candidates.filter(c => c.photoUrl).length;

  // Coalition party groups
  const partyByCoalition = (coalition: string) =>
    parties.filter(p => p.coalition === coalition);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader-ring" />
        <p className="loader-text">Loading Kerala 2026 Data...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@300;400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #0a0e1a;
          --ink-light: #3d4563;
          --ink-muted: #8891a8;
          --ldf: #cc0d0d;
          --udf: #0078FF;
          --nda: #F98C1F;
          --gold: #c8960c;
          --paper: #faf8f3;
          --paper-dark: #f0ede4;
          --white: #ffffff;
          --border: #e0dbd0;
          --shadow-sm: 0 1px 3px rgba(10,14,26,0.08);
          --shadow-md: 0 4px 16px rgba(10,14,26,0.10);
          --shadow-lg: 0 12px 40px rgba(10,14,26,0.14);
          --radius: 10px;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body: 'Source Sans 3', 'Trebuchet MS', sans-serif;
        }

        body {
          font-family: var(--font-body);
          background: var(--paper);
          color: var(--ink);
          font-size: 15px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Header ── */
        .site-header {
          background: var(--ink);
          color: white;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 3px solid var(--gold);
        }
        .header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          gap: 20px;
        }
        .site-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.5px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .site-title .flag-stripe {
          display: flex;
          gap: 3px;
          align-items: center;
        }
        .site-title .flag-stripe span {
          display: block;
          width: 6px;
          height: 28px;
          border-radius: 2px;
        }
        .header-meta {
          font-size: 12px;
          color: #94a3b8;
          text-align: right;
          line-height: 1.4;
        }
        .header-meta strong { color: var(--gold); }

        /* ── Hero Banner ── */
        .hero {
          background: linear-gradient(135deg, #0a0e1a 0%, #1a2744 40%, #0e3a1f 100%);
          color: white;
          padding: 48px 24px 40px;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .hero-inner {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
        }
        .hero-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 12px;
        }
        .hero-headline {
          font-family: var(--font-display);
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        .hero-sub {
          font-size: 16px;
          color: #94a3b8;
          max-width: 600px;
          margin-bottom: 32px;
        }
        .hero-stats {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
        }
        .hero-stat {
          text-align: center;
        }
        .hero-stat-val {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 900;
          line-height: 1;
          color: white;
        }
        .hero-stat-lbl {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .hero-stat.ldf .hero-stat-val { color: var(--ldf); }
        .hero-stat.udf .hero-stat-val { color: var(--udf); }
        .hero-stat.nda .hero-stat-val { color: var(--nda); }
        .hero-date-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(200,150,12,0.15);
          border: 1px solid rgba(200,150,12,0.3);
          border-radius: 100px;
          padding: 8px 20px;
          font-size: 13px;
          color: var(--gold);
          font-weight: 700;
          margin-bottom: 24px;
        }
        .pulse-dot {
          width: 8px; height: 8px;
          background: var(--gold);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        /* ── Main Layout ── */
        .page-body {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        /* ── Tabs ── */
        .tabs-bar {
          display: flex;
          gap: 4px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 28px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tabs-bar::-webkit-scrollbar { display: none; }
        .tab-btn {
          padding: 10px 20px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--ink-muted);
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .tab-btn:hover { color: var(--ink); }
        .tab-btn.active {
          color: var(--ink);
          border-bottom-color: var(--ink);
        }
        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--paper-dark);
          border-radius: 100px;
          padding: 1px 7px;
          font-size: 11px;
          margin-left: 6px;
        }

        /* ── Stats Row ── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-muted); margin-bottom: 4px; }
        .stat-value { font-family: var(--font-display); font-size: 28px; font-weight: 900; line-height: 1; }
        .stat-sub { font-size: 11px; color: var(--ink-muted); margin-top: 4px; }

        /* ── Filters ── */
        .filters-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
          align-items: center;
        }
        .search-box {
          flex: 1;
          min-width: 240px;
          position: relative;
        }
        .search-box input {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          font-family: var(--font-body);
          font-size: 14px;
          background: white;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s;
        }
        .search-box input:focus { border-color: var(--ink); }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--ink-muted);
          font-size: 16px;
          pointer-events: none;
        }
        .filter-select {
          padding: 10px 14px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          font-family: var(--font-body);
          font-size: 13px;
          background: white;
          color: var(--ink);
          cursor: pointer;
          outline: none;
          min-width: 140px;
        }
        .filter-select:focus { border-color: var(--ink); }
        .result-count {
          font-size: 13px;
          color: var(--ink-muted);
          margin-left: auto;
          white-space: nowrap;
        }

        /* ── Candidate Grid ── */
        .candidate-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .candidate-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
        }
        .candidate-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .card-coalition-bar {
          height: 4px;
        }
        .card-body {
          padding: 16px;
        }
        .card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .card-name {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          line-height: 1.3;
          color: var(--ink);
          flex: 1;
        }
        .card-name small {
          display: block;
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 400;
          color: var(--ink-muted);
          margin-top: 2px;
        }
        .card-meta {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .card-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--ink-light);
        }
        .card-meta-row .icon { font-size: 13px; flex-shrink: 0; }
        .card-constituency {
          font-weight: 600;
          color: var(--ink);
        }
        .card-footer {
          padding: 10px 16px;
          background: var(--paper);
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .category-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 4px;
          background: var(--paper-dark);
          color: var(--ink-muted);
        }
        .category-badge.sc { background: #eff6ff; color: #3b82f6; }
        .category-badge.st { background: #f0fdf4; color: #16a34a; }

        /* ── Pagination ── */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px 0;
        }
        .page-btn {
          padding: 8px 14px;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          transition: all 0.15s;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--ink); background: var(--paper-dark); }
        .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .page-btn.active { background: var(--ink); color: white; border-color: var(--ink); }
        .page-info { font-size: 13px; color: var(--ink-muted); padding: 0 8px; }

        /* ── Parties Tab ── */
        .coalition-section {
          margin-bottom: 36px;
        }
        .coalition-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--border);
        }
        .coalition-dot {
          width: 14px; height: 14px; border-radius: 50%;
        }
        .coalition-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
        }
        .coalition-count {
          font-size: 13px;
          color: var(--ink-muted);
          margin-left: auto;
        }
        .party-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .party-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: box-shadow 0.15s;
        }
        .party-card:hover { box-shadow: var(--shadow-md); }
        .party-abbr-badge {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: white;
          flex-shrink: 0;
          text-align: center;
          line-height: 1.2;
        }
        .party-info { flex: 1; min-width: 0; }
        .party-name { font-weight: 700; font-size: 13px; line-height: 1.3; }
        .party-full { font-size: 11px; color: var(--ink-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Districts Tab ── */
        .districts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .district-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          text-align: center;
          transition: box-shadow 0.15s;
        }
        .district-card:hover { box-shadow: var(--shadow-md); }
        .district-num {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 900;
          color: var(--ink);
          line-height: 1;
        }
        .district-seats { font-size: 12px; color: var(--ink-muted); margin-top: 4px; }
        .district-name { font-weight: 700; font-size: 15px; margin-top: 10px; }

        /* ── Polls Tab ── */
        .polls-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) { .polls-container { grid-template-columns: 1fr; } }
        .poll-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .poll-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        .poll-row {
          margin-bottom: 14px;
        }
        .poll-row-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .poll-bar-track {
          height: 10px;
          background: var(--paper-dark);
          border-radius: 100px;
          overflow: hidden;
        }
        .poll-bar-fill {
          height: 100%;
          border-radius: 100px;
          transition: width 1s ease;
        }
        .seat-projection-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .seat-projection-row:last-child { border-bottom: none; }
        .seat-alliance { font-weight: 700; font-size: 14px; }
        .seat-range {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
        }
        .majority-line {
          margin-top: 16px;
          padding: 12px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          font-size: 12px;
          color: #9a3412;
          font-weight: 600;
          text-align: center;
        }

        /* ── Schedule Tab ── */
        .schedule-container {
          max-width: 640px;
          margin: 0 auto;
        }
        .timeline {
          position: relative;
          padding-left: 32px;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 11px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: var(--border);
        }
        .timeline-item {
          position: relative;
          padding-bottom: 28px;
        }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-dot {
          position: absolute;
          left: -26px;
          top: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--border);
          border: 2px solid var(--paper);
          z-index: 1;
        }
        .timeline-item.highlight .timeline-dot {
          background: var(--gold);
          border-color: var(--gold);
          box-shadow: 0 0 0 4px rgba(200,150,12,0.2);
        }
        .timeline-date {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 4px;
        }
        .timeline-item.highlight .timeline-date { color: var(--gold); }
        .timeline-event {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
        }
        .timeline-item.highlight .timeline-event {
          font-family: var(--font-display);
          font-size: 18px;
        }

        /* ── Loading & Error ── */
        .loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--paper);
          gap: 20px;
        }
        .loader-ring {
          width: 48px; height: 48px;
          border: 4px solid var(--border);
          border-top-color: var(--ink);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader-text { font-size: 14px; color: var(--ink-muted); font-weight: 600; }
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: var(--radius);
          padding: 16px 20px;
          color: #991b1b;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .candidate-grid { grid-template-columns: 1fr 1fr; }
          .hero-stats { gap: 20px; }
          .hero-stat-val { font-size: 28px; }
          .filters-bar { flex-direction: column; }
          .search-box { min-width: 100%; }
          .filter-select { width: 100%; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header className="site-header">
        <div className="header-inner">
          <div className="site-title">
            <div className="flag-stripe">
              <span style={{ background: "#FF9933" }} />
              <span style={{ background: "#ffffff", border: "1px solid #ccc" }} />
              <span style={{ background: "#138808" }} />
            </div>
            Kerala 2026
          </div>
          <div className="header-meta">
            <strong>Legislative Assembly Election</strong><br />
            Live Candidate Tracker
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">📍 Kerala, India — 16th Assembly</div>
          <h1 className="hero-headline">
            140 Seats.<br />
            One State.
          </h1>
          <div className="hero-date-badge">
            <span className="pulse-dot" />
            Polling: 9 April 2026 &nbsp;·&nbsp; Results: 4 May 2026
          </div>
          <p className="hero-sub">
            Complete candidate data for all 140 constituencies across 14 districts.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-val">{candidates.length}</div>
              <div className="hero-stat-lbl">Candidates</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{constituencies.length}</div>
              <div className="hero-stat-lbl">Constituencies</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{parties.length}</div>
              <div className="hero-stat-lbl">Parties</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">26.9M</div>
              <div className="hero-stat-lbl">Voters</div>
            </div>
            <div className="hero-stat ldf">
              <div className="hero-stat-val">{ldfCount}</div>
              <div className="hero-stat-lbl">LDF</div>
            </div>
            <div className="hero-stat udf">
              <div className="hero-stat-val">{udfCount}</div>
              <div className="hero-stat-lbl">UDF</div>
            </div>
            <div className="hero-stat nda">
              <div className="hero-stat-val">{ndaCount}</div>
              <div className="hero-stat-lbl">NDA</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAGE BODY ── */}
      <main className="page-body">
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button
              onClick={fetchAll}
              style={{ marginLeft: "auto", padding: "6px 14px", background: "white", border: "1px solid #fca5a5", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="tabs-bar">
          {[
            { key: "candidates", label: "Candidates", count: candidates.length },
            { key: "parties",    label: "Parties",    count: parties.length },
            { key: "districts",  label: "Districts",  count: districts.length },
            { key: "polls",      label: "Opinion Polls" },
            { key: "schedule",   label: "Schedule" },
          ].map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key as any)}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="tab-count">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            TAB: CANDIDATES
        ══════════════════════════════════════════════════ */}
        {activeTab === "candidates" && (
          <>
            <div className="stats-row">
              <StatCard label="Total Candidates" value={candidates.length} />
              <StatCard label="LDF" value={ldfCount} accent={COALITION_COLORS.LDF} />
              <StatCard label="UDF" value={udfCount} accent={COALITION_COLORS.UDF} />
              <StatCard label="NDA" value={ndaCount} accent={COALITION_COLORS.NDA} />
              <StatCard label="Women" value={femaleCount} sub={`${((femaleCount / candidates.length) * 100).toFixed(1)}%`} />
              <StatCard label="With Photo" value={withPhoto} sub={`${((withPhoto / candidates.length) * 100).toFixed(1)}%`} />
            </div>

            <div className="filters-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search candidate, party, constituency..."
                  value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); setPage(1); }}
                />
              </div>
              <select
                className="filter-select"
                value={filterDistrict}
                onChange={(e) => { setFilterDistrict(e.target.value); setPage(1); }}
              >
                <option value="all">All Districts</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.nameEn}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={filterCoalition}
                onChange={(e) => { setFilterCoalition(e.target.value); setPage(1); }}
              >
                <option value="all">All Alliances</option>
                {["LDF","UDF","NDA","IND"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={filterParty}
                onChange={(e) => { setFilterParty(e.target.value); setPage(1); }}
              >
                <option value="all">All Parties</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.abbreviation} — {p.nameEn.substring(0, 30)}</option>
                ))}
              </select>
              <div className="result-count">{filtered.length} results</div>
            </div>

            <div className="candidate-grid">
              {paginated.map((c) => {
                const coalition = c.party?.coalition || "IND";
                const color     = COALITION_COLORS[coalition];
                const cat       = c.constituency?.category || "general";
                return (
                  <div key={c.id} className="candidate-card">
                    <div
                      className="card-coalition-bar"
                      style={{ background: color }}
                    />
                    <div className="card-body">
                      <div className="card-top">
                        <Avatar src={c.photoUrl} name={c.nameEn} size={44} />
                        <div className="card-name">
                          {c.nameEn}
                          {c.nameMl && <small>{c.nameMl}</small>}
                        </div>
                      </div>
                      <div className="card-meta">
                        {c.constituency && (
                          <div className="card-meta-row">
                            <span className="icon">📍</span>
                            <span>
                              <span style={{ color: "#64748b", marginRight: 4 }}>
                                #{c.constituency.number}
                              </span>
                              <span className="card-constituency">{c.constituency.nameEn}</span>
                            </span>
                          </div>
                        )}
                        {c.district && (
                          <div className="card-meta-row">
                            <span className="icon">🏛</span>
                            <span>{c.district.nameEn}</span>
                          </div>
                        )}
                        {c.profession && (
                          <div className="card-meta-row">
                            <span className="icon">💼</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.profession}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card-footer">
                      <PartyDot party={c.party} />
                      <CoalitionBadge coalition={coalition} />
                      {cat !== "general" && (
                        <span className={`category-badge ${cat}`}>{cat.toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "var(--ink-muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ fontWeight: 600 }}>No candidates found</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                >«</button>
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >‹</button>
                <span className="page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >›</button>
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(totalPages)}
                >»</button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: PARTIES
        ══════════════════════════════════════════════════ */}
        {activeTab === "parties" && (
          <>
            {["LDF","UDF","NDA","IND"].map((coalition) => {
              const cParties = partyByCoalition(coalition);
              if (cParties.length === 0) return null;
              const fullName: Record<string,string> = {
                LDF: "Left Democratic Front",
                UDF: "United Democratic Front",
                NDA: "National Democratic Alliance",
                IND: "Others / Independent",
              };
              return (
                <div key={coalition} className="coalition-section">
                  <div className="coalition-header">
                    <span
                      className="coalition-dot"
                      style={{ background: COALITION_COLORS[coalition] }}
                    />
                    <span className="coalition-title">{fullName[coalition]}</span>
                    <span className="coalition-count">{cParties.length} parties</span>
                  </div>
                  <div className="party-grid">
                    {cParties.map((p) => {
                      const color = p.colorHex || COALITION_COLORS[p.coalition] || "#666";
                      return (
                        <div key={p.id} className="party-card">
                          <div
                            className="party-abbr-badge"
                            style={{ background: color }}
                          >
                            {p.abbreviation.split("").slice(0, 6).join("")}
                          </div>
                          <div className="party-info">
                            <div className="party-name">{p.abbreviation}</div>
                            <div className="party-full">{p.nameEn}</div>
                          </div>
                          <CoalitionBadge coalition={p.coalition} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {parties.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "var(--ink-muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏛</div>
                <p style={{ fontWeight: 600 }}>No parties loaded yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Run the scraper with mode: "parties"</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: DISTRICTS
        ══════════════════════════════════════════════════ */}
        {activeTab === "districts" && (
          <>
            <div className="stats-row" style={{ marginBottom: 24 }}>
              <StatCard label="Districts" value={14} />
              <StatCard label="Total Seats" value={140} />
              <StatCard label="Registered Voters" value="26.9M" />
              <StatCard label="Male Voters" value="13.1M" />
              <StatCard label="Female Voters" value="13.8M" />
              <StatCard label="Third Gender" value="277" />
            </div>
            <div className="districts-grid">
              {districts.length > 0
                ? districts.map((d) => (
                    <div key={d.id} className="district-card">
                      <div className="district-num">{d.constituencyCount}</div>
                      <div className="district-seats">constituencies</div>
                      <div className="district-name">{d.nameEn}</div>
                      {d.nameMl && (
                        <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}>
                          {d.nameMl}
                        </div>
                      )}
                    </div>
                  ))
                : /* Static fallback if API is empty */
                  [
                    ["Kasaragod",5],["Kannur",11],["Wayanad",3],["Kozhikode",13],
                    ["Malappuram",16],["Palakkad",12],["Thrissur",13],["Ernakulam",14],
                    ["Idukki",5],["Kottayam",9],["Alappuzha",9],["Pathanamthitta",5],
                    ["Kollam",11],["Thiruvananthapuram",14],
                  ].map(([name, seats]) => (
                    <div key={name as string} className="district-card">
                      <div className="district-num">{seats}</div>
                      <div className="district-seats">constituencies</div>
                      <div className="district-name">{name}</div>
                    </div>
                  ))
              }
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: POLLS
        ══════════════════════════════════════════════════ */}
        {activeTab === "polls" && (
          <div className="polls-container">
            {/* Vote Share */}
            <div className="poll-card">
              <div className="poll-title">📊 Vote Share Projections</div>
              {POLL_DATA.map((poll) => (
                <div key={poll.agency}>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 16, fontWeight: 600 }}>
                    {poll.agency} · {poll.date} · Sample: 26,000
                  </div>
                  {[
                    { label: "LDF", value: poll.ldf, color: COALITION_COLORS.LDF },
                    { label: "UDF", value: poll.udf, color: COALITION_COLORS.UDF },
                    { label: "NDA", value: poll.nda, color: COALITION_COLORS.NDA },
                    { label: "Others", value: poll.others, color: "#94a3b8" },
                  ].map((bar) => (
                    <div key={bar.label} className="poll-row">
                      <div className="poll-row-header">
                        <span style={{ color: bar.color, fontWeight: 700 }}>{bar.label}</span>
                        <span>{bar.value}%</span>
                      </div>
                      <div className="poll-bar-track">
                        <div
                          className="poll-bar-fill"
                          style={{ width: `${bar.value}%`, background: bar.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="majority-line">
                LDF leads by 0.5pp — statistical dead heat
              </div>
            </div>

            {/* Seat Projections */}
            <div className="poll-card">
              <div className="poll-title">🏛 Seat Projections</div>
              {SEAT_PROJECTIONS.map((proj) => (
                <div key={proj.agency}>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 16, fontWeight: 600 }}>
                    {proj.agency} · {proj.date}
                  </div>
                  {[
                    { label: "LDF", range: proj.ldf, color: COALITION_COLORS.LDF, prev: "97 seats (alliance)" },
                    { label: "UDF", range: proj.udf, color: COALITION_COLORS.UDF, prev: "42 seats (alliance)" },
                    { label: "NDA", range: proj.nda, color: COALITION_COLORS.NDA, prev: "—" },
                  ].map((row) => (
                    <div key={row.label} className="seat-projection-row">
                      <div>
                        <div className="seat-alliance" style={{ color: row.color }}>{row.label}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>
                          Previous: {row.prev}
                        </div>
                      </div>
                      <div className="seat-range" style={{ color: row.color }}>{row.range}</div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ marginTop: 20, padding: "16px", background: "var(--paper)", borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Current Assembly (2021)</div>
                {[
                  { party: "LDF", seats: 97, color: COALITION_COLORS.LDF },
                  { party: "UDF", seats: 42, color: COALITION_COLORS.UDF },
                  { party: "NDA", seats: 1,  color: COALITION_COLORS.NDA },
                ].map((s) => (
                  <div key={s.party} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: s.color, fontWeight: 600 }}>
                    <span>{s.party}</span>
                    <span>{s.seats} seats</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--ink-muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                  Majority threshold: <strong>71 seats</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: SCHEDULE
        ══════════════════════════════════════════════════ */}
        {activeTab === "schedule" && (
          <div className="schedule-container">
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
                Election Schedule
              </h2>
              <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>
                Announced by the Election Commission of India on 15 March 2026
              </p>
            </div>

            <div className="timeline">
              {SCHEDULE.map((item) => (
                <div key={item.event} className={`timeline-item ${item.highlight ? "highlight" : ""}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-date">{item.date}</div>
                  <div className="timeline-event">{item.event}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40, background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Voter Statistics
              </div>
              {[
                { label: "Total Registered Voters", value: "26,953,644", icon: "🗳" },
                { label: "Male Voters",              value: "13,126,048", icon: "👨" },
                { label: "Female Voters",            value: "13,827,319", icon: "👩" },
                { label: "Third Gender Voters",      value: "277",        icon: "⚧" },
                { label: "Total Constituencies",     value: "140",        icon: "🏛" },
                { label: "Majority Required",        value: "71 seats",   icon: "✅" },
              ].map((row) => (
                <div key={row.label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 14,
                }}>
                  <span style={{ color: "var(--ink-muted)" }}>
                    {row.icon} {row.label}
                  </span>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        background: "white",
        padding: "24px",
        textAlign: "center",
        fontSize: 12,
        color: "var(--ink-muted)",
        marginTop: 48,
      }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>
          Kerala 2026 — Legislative Assembly Election Tracker
        </p>
        <p>
          Data sourced from Wikipedia · {candidates.length} candidates · {constituencies.length} constituencies · {parties.length} parties
        </p>
        <p style={{ marginTop: 4 }}>
          Open source project · Backend: Node.js + Neon PostgreSQL · Polling: April 9, 2026
        </p>
      </footer>
    </>
  );
}