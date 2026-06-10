import { useState, useMemo } from "react";

// ── TenM Brand ──
const BRAND = { charcoal: "#1A1A1A", charcoalLight: "#2D2D2D", gold: "#C9A84C", goldBorder: "#E5C96A", white: "#F5F5F5" };

// ── Scoring weights (9 categories, sum=100%) ──
const WEIGHT_MAP = {
  safety: { label: "Safety Record", weight: 0.20 },
  litigation: { label: "Litigation History", weight: 0.15 },
  financial: { label: "Financial Stability", weight: 0.15 },
  subPayments: { label: "Sub/Vendor Payments", weight: 0.10 },
  reviews: { label: "Reviews & Reputation", weight: 0.10 },
  licensingBBB: { label: "Licensing / BBB", weight: 0.10 },
  longevity: { label: "Longevity / Track Record", weight: 0.10 },
  environmental: { label: "Environmental Compliance", weight: 0.05 },
  recognition: { label: "Industry Recognition", weight: 0.05 },
};

const gradeBands = (score) => {
  if (score >= 8) return { grade: "A", label: "Low Risk", color: "#059669", bg: "#D1FAE5", border: "#34D399", barBg: "#059669" };
  if (score >= 6) return { grade: "B", label: "Moderate Risk", color: "#D97706", bg: "#FEF3C7", border: "#F59E0B", barBg: "#D97706" };
  if (score >= 4) return { grade: "C", label: "Elevated Risk", color: "#EA580C", bg: "#FFEDD5", border: "#FB923C", barBg: "#EA580C" };
  return { grade: "D", label: "High Risk", color: "#DC2626", bg: "#FEE2E2", border: "#F87171", barBg: "#DC2626" };
};

const daysSince = (dateStr) => {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
};

const reviewStatus = (dateStr) => {
  const days = daysSince(dateStr);
  if (days <= 15) return { label: "Current", color: "#059669", bg: "#D1FAE5" };
  if (days <= 30) return { label: `${30 - days}d left`, color: "#D97706", bg: "#FEF3C7" };
  return { label: "Overdue", color: "#DC2626", bg: "#FEE2E2" };
};

// ── ALL 18 CONTRACTORS ──
const CONTRACTORS = [
  {
    id: 1, name: "IMC Construction, Inc.", location: "Malvern, PA", composite: 9.50, lastReview: "2026-06-05",
    categories: { safety: 10, litigation: 10, financial: 9, subPayments: 9, reviews: 10, licensingBBB: 10, longevity: 9, environmental: 9, recognition: 9 },
    summary: "National commercial GC with exceptional safety record, clean litigation history, and strong financial position. Consistently top-rated on all platforms."
  },
  {
    id: 2, name: "BBL Construction Services", location: "Albany, NY", composite: 8.90, lastReview: "2026-06-10",
    categories: { safety: 9, litigation: 9, financial: 9, subPayments: 9, reviews: 9, licensingBBB: 9, longevity: 9, environmental: 8, recognition: 8 },
    summary: "Well-established Albany-based GC. Strong financial health, clean record. Long history of public and private sector work across upstate NY."
  },
  {
    id: 3, name: "Hueber-Breuer Construction", location: "Syracuse, NY", composite: 8.65, lastReview: "2026-06-10",
    categories: { safety: 9, litigation: 9, financial: 8, subPayments: 9, reviews: 8, licensingBBB: 9, longevity: 9, environmental: 8, recognition: 8 },
    summary: "Syracuse institution with deep commercial and institutional roots. Solid safety and payment track record. Well-regarded by subs."
  },
  {
    id: 4, name: "Pike Construction Services", location: "Rochester, NY", composite: 8.60, lastReview: "2026-06-10",
    categories: { safety: 9, litigation: 8, financial: 9, subPayments: 8, reviews: 9, licensingBBB: 9, longevity: 9, environmental: 8, recognition: 8 },
    summary: "Major Rochester-based GC (Pike Company). Large-scale commercial, healthcare, and institutional. Labor relations flag in Albany noted but otherwise strong."
  },
  {
    id: 5, name: "Rich & Gardner Construction", location: "Syracuse, NY", composite: 8.10, lastReview: "2026-06-10",
    categories: { safety: 8, litigation: 8, financial: 8, subPayments: 8, reviews: 8, licensingBBB: 8, longevity: 9, environmental: 8, recognition: 8 },
    summary: "Syracuse-area commercial GC with long track record. Consistent performer across categories. No significant red flags found."
  },
  {
    id: 6, name: "Hayner Hoyt Corporation", location: "Syracuse, NY", composite: 8.05, lastReview: "2026-06-10",
    categories: { safety: 8, litigation: 8, financial: 8, subPayments: 8, reviews: 8, licensingBBB: 8, longevity: 9, environmental: 8, recognition: 8 },
    summary: "Syracuse-based commercial GC with generational stability. Healthcare and education focus. Well-established sub relationships."
  },
  {
    id: 7, name: "Unique Development Companies", location: "Syracuse, NY", composite: 7.95, lastReview: "2026-06-10",
    categories: { safety: 8, litigation: 8, financial: 8, subPayments: 8, reviews: 8, licensingBBB: 8, longevity: 8, environmental: 7, recognition: 7 },
    summary: "Syracuse developer/GC focused on multifamily and mixed-use. Growing portfolio. Solid fundamentals with no major concerns."
  },
  {
    id: 8, name: "Pioneer Development / Companies", location: "Syracuse, NY", composite: 7.85, lastReview: "2026-06-10",
    categories: { safety: 7, litigation: 8, financial: 8, subPayments: 7, reviews: 8, licensingBBB: 8, longevity: 9, environmental: 7, recognition: 8 },
    summary: "60+ year Syracuse development firm. $2B+ in projects completed. Director of Construction has $1.8B personal track record. Labor harmony flag in Albany with Pike."
  },
  {
    id: 9, name: "Parsons-McKenna Construction", location: "Liverpool, NY", composite: 7.80, lastReview: "2026-06-10",
    categories: { safety: 8, litigation: 8, financial: 7, subPayments: 8, reviews: 8, licensingBBB: 8, longevity: 8, environmental: 7, recognition: 7 },
    summary: "Liverpool, NY general contractor. Established presence in CNY commercial construction. Reliable performer, no significant issues found."
  },
  {
    id: 10, name: "FAHS Construction Group", location: "Binghamton, NY", composite: 7.55, lastReview: "2026-06-10",
    categories: { safety: 8, litigation: 7, financial: 7, subPayments: 8, reviews: 8, licensingBBB: 8, longevity: 8, environmental: 7, recognition: 7 },
    summary: "Binghamton-based GC. Regional presence in Southern Tier and upstate NY. Consistent but limited public data footprint."
  },
  {
    id: 11, name: "Christa Construction", location: "Rochester, NY", composite: 7.25, lastReview: "2026-06-10",
    categories: { safety: 7, litigation: 7, financial: 7, subPayments: 7, reviews: 7, licensingBBB: 8, longevity: 8, environmental: 7, recognition: 7 },
    summary: "Rochester commercial GC. Solid licensing and longevity. Some moderate concerns across financial and review categories."
  },
  {
    id: 12, name: "Redev CNY / Redev Construction", location: "Syracuse, NY", composite: 7.20, lastReview: "2026-06-10",
    categories: { safety: 7, litigation: 8, financial: 7, subPayments: 7, reviews: 7, licensingBBB: 8, longevity: 5, environmental: 7, recognition: 8 },
    summary: "WBE-certified Syracuse GC. Founded 2019, $100M+ completed. Strong adaptive reuse portfolio (Moyer Carriage Lofts $63M, Whitney Lofts). Main risk: limited operating history."
  },
  {
    id: 13, name: "DiMarco Constructors LLC", location: "Rochester, NY", composite: 7.00, lastReview: "2026-06-10",
    categories: { safety: 7, litigation: 7, financial: 7, subPayments: 7, reviews: 7, licensingBBB: 7, longevity: 7, environmental: 7, recognition: 7 },
    summary: "Rochester-area GC. Moderate risk profile. Adequate across all categories with no standout concerns but limited differentiation."
  },
  {
    id: 14, name: "Griffon Construction (WBP Dev)", location: "Chappaqua, NY", composite: 7.00, lastReview: "2026-06-10",
    categories: { safety: 7, litigation: 7, financial: 8, subPayments: 7, reviews: 5, licensingBBB: 8, longevity: 9, environmental: 7, recognition: 7 },
    summary: "30+ year GC arm of Wilder Balter Partners. Hudson Valley multifamily/affordable housing. Substantial bonding. WARNING: Employee reviews cite chaotic culture, high turnover, mental health impacts."
  },
  {
    id: 15, name: "Celia Construction / Sam Celia", location: "Whitesboro, NY", composite: 6.90, lastReview: "2026-06-10",
    categories: { safety: 7, litigation: 7, financial: 6, subPayments: 7, reviews: 6, licensingBBB: 7, longevity: 8, environmental: 7, recognition: 6 },
    summary: "Utica-area family GC est. 1993. ~$3.7M revenue, ~15 employees. Clarkson-educated second generation. Clean but very thin public footprint — limited data for full validation."
  },
  {
    id: 16, name: "TenM Construction LLC", location: "Staunton, VA", composite: 5.50, lastReview: "2026-06-10",
    categories: { safety: 6, litigation: 6, financial: 5, subPayments: 5, reviews: 5, licensingBBB: 6, longevity: 4, environmental: 6, recognition: 5 },
    summary: "Internal self-assessment baseline. Growing firm repositioning from CNY to VA. Limited public track record as an independent entity. Score reflects honest self-evaluation."
  },
  {
    id: 17, name: "First Onsite Property Restoration", location: "Greenwood Village, CO", composite: 5.10, lastReview: "2026-06-10",
    categories: { safety: 5, litigation: 5, financial: 8, subPayments: 3, reviews: 4, licensingBBB: 4, longevity: 7, environmental: 5, recognition: 4 },
    summary: "National restoration co. backed by FirstService Corp ($5.5B parent). BBB complaints: inflated billing, abandoned jobs, poor communication. Not BBB accredited. Glassdoor 3.0-3.5/5. Tight contractual controls required."
  },
  {
    id: 18, name: "Haynes Construction Co.", location: "Seymour, CT", composite: 4.75, lastReview: "2026-06-10",
    categories: { safety: 5, litigation: 4, financial: 5, subPayments: 4, reviews: 5, licensingBBB: 5, longevity: 6, environmental: 5, recognition: 4 },
    summary: "Connecticut-based GC. Multiple risk flags across litigation, sub payments, and licensing. Requires enhanced oversight and contractual protections on any engagement."
  },
];

const CategoryBar = ({ catKey, value }) => {
  const w = WEIGHT_MAP[catKey];
  const band = gradeBands(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <div style={{ width: 160, fontSize: 11, color: "#6B7280", textAlign: "right", flexShrink: 0 }}>
        {w.label} <span style={{ color: "#9CA3AF", fontSize: 10 }}>({(w.weight * 100).toFixed(0)}%)</span>
      </div>
      <div style={{ flex: 1, height: 14, background: "#F3F4F6", borderRadius: 7, overflow: "hidden", position: "relative" }}>
        <div style={{
          width: `${(value / 10) * 100}%`, height: "100%", background: band.barBg,
          borderRadius: 7, transition: "width 0.4s ease"
        }} />
      </div>
      <div style={{ width: 28, fontSize: 12, fontWeight: 700, color: band.color, textAlign: "right" }}>{value}</div>
    </div>
  );
};

const DetailModal = ({ contractor, onClose }) => {
  const band = gradeBands(contractor.composite);
  const rev = reviewStatus(contractor.lastReview);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, maxWidth: 600, width: "100%",
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${BRAND.charcoal}, ${BRAND.charcoalLight})`,
          padding: "20px 24px", borderRadius: "12px 12px 0 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start"
        }}>
          <div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{contractor.name}</div>
            <div style={{ color: BRAND.gold, fontSize: 13, marginTop: 2 }}>{contractor.location}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 32, fontWeight: 900, color: band.color,
              background: band.bg, borderRadius: 10, padding: "4px 14px",
              border: `2px solid ${band.border}`, lineHeight: 1.1
            }}>
              {contractor.composite.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: band.color, fontWeight: 700, marginTop: 4 }}>
              Grade {band.grade} — {band.label}
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              Last reviewed: {contractor.lastReview || "Never"}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: rev.color, background: rev.bg,
              padding: "3px 10px", borderRadius: 20
            }}>
              {rev.label}
            </div>
          </div>

          <div style={{
            background: "#F9FAFB", borderRadius: 8, padding: 14, marginBottom: 20,
            fontSize: 13, color: "#374151", lineHeight: 1.5, borderLeft: `3px solid ${band.color}`
          }}>
            {contractor.summary}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.charcoal, marginBottom: 10 }}>
            Category Breakdown
          </div>
          {Object.keys(WEIGHT_MAP).map(k => (
            <CategoryBar key={k} catKey={k} value={contractor.categories[k]} />
          ))}

          <div style={{
            marginTop: 16, padding: "10px 14px", background: "#F3F4F6", borderRadius: 8,
            fontSize: 11, color: "#6B7280", textAlign: "center"
          }}>
            Composite = Σ (category × weight) · Max 10.0 · Reviewed on 30-day cycle
          </div>
        </div>

        <div style={{ padding: "0 24px 20px", textAlign: "right" }}>
          <button onClick={onClose} style={{
            background: BRAND.charcoal, color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 13
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ContractorTile = ({ contractor, onClick }) => {
  const band = gradeBands(contractor.composite);
  const rev = reviewStatus(contractor.lastReview);
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 10, padding: 16, cursor: "pointer",
      border: `1px solid ${band.border}`, borderLeft: `4px solid ${band.color}`,
      transition: "transform 0.15s, box-shadow 0.15s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.charcoal, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {contractor.name}
          </div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>{contractor.location}</div>
        </div>
        <div style={{ textAlign: "right", marginLeft: 12, flexShrink: 0 }}>
          <div style={{
            fontSize: 22, fontWeight: 900, color: band.color,
            background: band.bg, borderRadius: 8, padding: "2px 10px",
            border: `1.5px solid ${band.border}`, lineHeight: 1.2
          }}>
            {contractor.composite.toFixed(2)}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: band.color, marginTop: 2, textTransform: "uppercase" }}>
            {band.grade} · {band.label}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid #F3F4F6" }}>
        <div style={{ fontSize: 10, color: "#9CA3AF" }}>
          Reviewed {contractor.lastReview}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: rev.color, background: rev.bg,
          padding: "2px 8px", borderRadius: 12
        }}>
          {rev.label}
        </div>
      </div>
    </div>
  );
};

const SummaryStats = ({ contractors }) => {
  const total = contractors.length;
  const gradeA = contractors.filter(c => c.composite >= 8).length;
  const gradeB = contractors.filter(c => c.composite >= 6 && c.composite < 8).length;
  const gradeC = contractors.filter(c => c.composite >= 4 && c.composite < 6).length;
  const gradeD = contractors.filter(c => c.composite < 4).length;
  const avg = (contractors.reduce((s, c) => s + c.composite, 0) / total).toFixed(2);
  const overdue = contractors.filter(c => daysSince(c.lastReview) > 30).length;
  const stats = [
    { label: "Total", value: total, color: BRAND.gold },
    { label: "Avg Score", value: avg, color: BRAND.gold },
    { label: "Grade A", value: gradeA, color: "#059669" },
    { label: "Grade B", value: gradeB, color: "#D97706" },
    { label: "Grade C", value: gradeC, color: "#EA580C" },
    { label: "Grade D", value: gradeD, color: "#DC2626" },
    { label: "Reviews Overdue", value: overdue, color: overdue > 0 ? "#DC2626" : "#059669" },
  ];
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center",
      background: `linear-gradient(135deg, ${BRAND.charcoal}, ${BRAND.charcoalLight})`,
      padding: "14px 20px", borderRadius: 10, margin: "0 0 20px"
    }}>
      {stats.map(s => (
        <div key={s.label} style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
};

export default function DDDashboard() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score");

  const filtered = useMemo(() => {
    let list = [...CONTRACTORS];
    if (filter !== "all") list = list.filter(c => gradeBands(c.composite).grade === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
    }
    if (sortBy === "score") list.sort((a, b) => b.composite - a.composite);
    else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "review") list.sort((a, b) => daysSince(b.lastReview) - daysSince(a.lastReview));
    return list;
  }, [filter, search, sortBy]);

  const gradeButtons = [
    { key: "all", label: "All", color: BRAND.gold },
    { key: "A", label: "A — Low", color: "#059669" },
    { key: "B", label: "B — Mod", color: "#D97706" },
    { key: "C", label: "C — Elev", color: "#EA580C" },
    { key: "D", label: "D — High", color: "#DC2626" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.charcoal}, ${BRAND.charcoalLight})`,
        padding: "20px 24px", borderBottom: `3px solid ${BRAND.gold}`
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                TenM <span style={{ color: BRAND.gold }}>Due Diligence</span> Dashboard
              </div>
              <div style={{ fontSize: 11, color: BRAND.gold, fontStyle: "italic", marginTop: 2 }}>
                More than structures, we build futures.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>30-Day Review Cycle</div>
              <div style={{
                width: 10, height: 10, borderRadius: "50%", background: "#059669",
                boxShadow: "0 0 6px #059669", animation: "pulse 2s infinite"
              }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        <SummaryStats contractors={CONTRACTORS} />

        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
          marginBottom: 16, padding: "12px 16px", background: "#fff",
          borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        }}>
          <input
            type="text" placeholder="Search contractor or location..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              flex: "1 1 200px", padding: "8px 12px", borderRadius: 8,
              border: "1px solid #D1D5DB", fontSize: 13, outline: "none"
            }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {gradeButtons.map(g => (
              <button key={g.key} onClick={() => setFilter(g.key)} style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                border: filter === g.key ? `2px solid ${g.color}` : "1px solid #E5E7EB",
                background: filter === g.key ? g.color + "18" : "#fff",
                color: filter === g.key ? g.color : "#6B7280",
                cursor: "pointer", transition: "all 0.15s"
              }}>
                {g.label}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB",
            fontSize: 12, background: "#fff", cursor: "pointer"
          }}>
            <option value="score">Sort: Score ↓</option>
            <option value="name">Sort: Name A→Z</option>
            <option value="review">Sort: Oldest Review</option>
          </select>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 12
        }}>
          {filtered.map(c => (
            <ContractorTile key={c.id} contractor={c} onClick={() => setSelected(c)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF", fontSize: 14 }}>
            No contractors match the current filters.
          </div>
        )}

        <div style={{
          marginTop: 24, padding: "14px 20px", borderRadius: 10,
          background: `linear-gradient(135deg, ${BRAND.charcoal}, ${BRAND.charcoalLight})`,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 10, color: "#6B7280" }}>
            TenM Construction Due Diligence Program · 9-Category Weighted Scoring (Safety 20%, Litigation 15%, Financial 15%, Sub Payments 10%, Reviews 10%, Licensing 10%, Longevity 10%, Environmental 5%, Recognition 5%) · 30-Day Review Cycle
          </div>
          <div style={{ fontSize: 10, color: BRAND.gold, marginTop: 4 }}>
            Last updated: June 10, 2026 · {CONTRACTORS.length} contractors scored
          </div>
        </div>
      </div>

      {selected && <DetailModal contractor={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
