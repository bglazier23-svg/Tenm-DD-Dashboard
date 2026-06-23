import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const BRAND = { dark:"#1A1A1A", dark2:"#2D2D2D", gold:"#C9A84C", goldLight:"#FBF3DC", goldBorder:"#E5C96A" };

const sections = [
  { key:"thisWeek",  label:"Bids In This Week",   short:"This Week",  color:"#7C5A0A", light:"#FFF8E7", border:"#E5C96A", badge:"#C9A84C", emoji:"📋" },
  { key:"pending",   label:"Pending Decision",     short:"Pending",    color:"#92400E", light:"#FFF7ED", border:"#FED7AA", badge:"#D97706", emoji:"⏳" },
  { key:"declined",  label:"Bids Declined",         short:"Declined",   color:"#B91C1C", light:"#FEE2E2", border:"#FCA5A5", badge:"#DC2626", emoji:"❌" },
  { key:"working",   label:"Accepted - Working",   short:"Working",    color:"#065F46", light:"#D1FAE5", border:"#6EE7B7", badge:"#059669", emoji:"🔨" },
  { key:"submitted", label:"Accepted - Submitted", short:"Submitted",  color:"#1A1A1A", light:"#F3F4F6", border:"#D1D5DB", badge:"#374151", emoji:"✅" },
];

const DEFAULT_ESTIMATORS = ["Brett","Jaime","Joe","Joe H","Zach","Josh","Jeremy","Gary"];

const RESULTS = [
  { key:"Won",        label:"✅ Won",        color:"#065F46", bg:"#D1FAE5", border:"#6EE7B7" },
  { key:"Lost",       label:"❌ Lost",        color:"#B91C1C", bg:"#FEE2E2", border:"#FCA5A5" },
  { key:"No Decision",label:"⏳ No Decision", color:"#92400E", bg:"#FEF3C7", border:"#FCD34D" },
];

const fmt  = v => { const n = parseFloat(v); return "$" + (isNaN(n) ? 0 : n).toLocaleString(); };
const fmtN = v => { const n = parseFloat(v); return (isNaN(n) ? 0 : n).toLocaleString(); };
const safeStr = v => (v && typeof v === "string") ? v : "";

const getDaysLeft = dueDate => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (isNaN(due)) return null;
  const now = new Date();
  now.setHours(0,0,0,0); due.setHours(0,0,0,0);
  return Math.round((due - now) / 86400000);
};

const DaysChip = ({ dueDate, section, small=false }) => {
  if (section === "declined" || section === "submitted") return null;
  const d = getDaysLeft(dueDate);
  if (d === null) return null;
  const color = d < 0 ? "#DC2626" : "#16A34A";
  const bg    = d < 0 ? "#FEE2E2" : "#DCFCE7";
  const label = d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `${d}d left`;
  return <span style={{ background:bg, color, borderRadius:20, padding:small?"2px 6px":"3px 8px", fontSize:small?9:10, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>;
};

const ResultBadge = ({ result }) => {
  if (!result) return <span style={{ background:"#F1F5F9", color:"#94A3B8", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700 }}>Pending Result</span>;
  const r = RESULTS.find(x => x.key === result);
  if (!r) return null;
  return <span style={{ background:r.bg, color:r.color, border:`1px solid ${r.border}`, borderRadius:20, padding:"2px 9px", fontSize:10, fontWeight:700 }}>{r.label}</span>;
};

const DD_CATEGORIES = [
  { key:"safety",        label:"Safety Record (OSHA)",      weight:0.20 },
  { key:"litigation",    label:"Litigation History",         weight:0.15 },
  { key:"financial",     label:"Financial Stability",        weight:0.15 },
  { key:"subPayments",   label:"Subcontractor Payments",     weight:0.10 },
  { key:"reviews",       label:"Customer/Employee Reviews",  weight:0.10 },
  { key:"licensing",     label:"Licensing & BBB",            weight:0.10 },
  { key:"longevity",     label:"Company Longevity",          weight:0.10 },
  { key:"environmental", label:"Environmental/Regulatory",   weight:0.05 },
  { key:"recognition",   label:"Industry Recognition",       weight:0.05 },
];

const computeDD = (scores) => {
  if (!scores || typeof scores !== "object") return null;
  let weighted = 0, totalWeight = 0;
  DD_CATEGORIES.forEach(c => {
    const v = parseFloat(scores[c.key]);
    if (!isNaN(v)) { weighted += v * c.weight; totalWeight += c.weight; }
  });
  if (totalWeight === 0) return null;
  return Math.round((weighted / totalWeight) * 100) / 100;
};

const ddGrade = score => {
  const s = parseFloat(score);
  if (isNaN(s) || score === "" || score === null) return null;
  if (s >= 8) return { grade:"A", label:"Low Risk",      color:"#059669", bg:"#D1FAE5", border:"#6EE7B7" };
  if (s >= 6) return { grade:"B", label:"Moderate Risk",  color:"#2563EB", bg:"#DBEAFE", border:"#93C5FD" };
  if (s >= 4) return { grade:"C", label:"Elevated Risk",  color:"#EA580C", bg:"#FFEDD5", border:"#FED7AA" };
  return         { grade:"D", label:"High Risk",      color:"#DC2626", bg:"#FEE2E2", border:"#FCA5A5" };
};

// Contractors with completed due diligence reports (from Scoring Catalog)
// Contractors with completed due diligence reports
const DD_REPORTS = [
  { match:["imc"],                              name:"IMC Construction, Inc.",        score:9.50, location:"Malvern, PA",   date:"2026-06-05" },
  { match:["pike"],                             name:"Pike Construction Services",    score:8.60, location:"Rochester, NY", date:"2026-06-10" },
  { match:["hueber","heuber","huber","breuer","bruer","breur","hb1872"], name:"Hueber-Breuer Construction Co., Inc.", score:8.65, location:"Syracuse, NY", date:"2026-06-10" },
  { match:["christa"],                          name:"Christa Construction LLC",      score:7.25, location:"Victor, NY",    date:"2026-06-10" },
  { match:["unique development","unique dev"],  name:"Unique Development Companies",  score:7.95, location:"Syracuse, NY",  date:"2026-06" },
  { match:["parsons-mckenna","parsons mckenna","parsons"], name:"Parsons-McKenna Construction", score:7.80, location:"Liverpool, NY", date:"2026-06" },
  { match:["dimarco"],                          name:"DiMarco Constructors LLC",      score:7.00, location:"Rochester, NY", date:"2026-06" },
  { match:["tenm","ten m"],                     name:"TenM Construction LLC",         score:5.50, location:"Cicero, NY",    date:"2026-06" },
  { match:["haynes"],                           name:"Haynes Construction Co.",       score:4.75, location:"Seymour, CT",   date:"2026-06" },
  { match:["middleburg"],                       name:"Middleburg Construction",       score:8.65, location:"Vienna, VA / FL", date:"2026-06-22" },
  { match:["weavercooke","weaver cooke","weaver-cooke"], name:"WeaverCooke Construction", score:8.60, location:"Greensboro, NC", date:"2026-06-16" },
  { match:["acropolis"],                         name:"Acropolis Realty Group",        score:7.80, location:"Syracuse, NY",  date:"2026-06-15" },
  { match:["dalton builders","dalton build"],    name:"Dalton Builders Inc.",          score:4.30, location:"Dalton, NY",    date:"2026-06-22" },

  // ── Grade A (8.0–10.0) — Low Risk ──
  { match:["imc"], name:"IMC Construction, Inc.", score:9.50, grade:"A", risk:"Low", location:"Malvern, PA", date:"2026-06-05" },
  { match:["bbl"], name:"BBL Construction Services", score:8.90, grade:"A", risk:"Low", location:"Albany, NY", date:"2026-06-10" },
  { match:["hueber-breuer","hueber breuer","hb construct"], name:"Hueber-Breuer Construction", score:8.65, grade:"A", risk:"Low", location:"Syracuse, NY", date:"2026-06-10" },
  { match:["pike"], name:"Pike Construction Services", score:8.60, grade:"A", risk:"Low", location:"Rochester, NY", date:"2026-06-10" },
  { match:["rich & gardner","rich and gardner","rich gardner"], name:"Rich & Gardner Construction", score:8.10, grade:"A", risk:"Low", location:"Syracuse, NY", date:"2026-06-10" },
  { match:["hayner hoyt","hayner-hoyt"], name:"Hayner Hoyt Corporation", score:8.05, grade:"A", risk:"Low", location:"Syracuse, NY", date:"2026-06-10" },
  { match:["middleburg"], name:"Middleburg Construction", score:8.65, grade:"A", risk:"Low", location:"Vienna, VA / FL", date:"2026-06-22" },
  { match:["weavercooke","weaver cooke","weaver-cooke"], name:"WeaverCooke Construction", score:8.60, grade:"A", risk:"Low", location:"Greensboro, NC", date:"2026-06-16" },
// replaced-hayner, risk:"Low", location:"Syracuse, NY", date:"2026-06-10" },
  // ── Grade B (6.0–7.99) — Moderate Risk ──
  { match:["unique development","unique dev"], name:"Unique Development Companies", score:7.95, grade:"B", risk:"Moderate", location:"Syracuse, NY", date:"2026-06-10" },
  { match:["pioneer"], name:"Pioneer Development / Companies", score:7.85, grade:"B", risk:"Moderate", location:"Syracuse, NY", date:"2026-06-10" },
  { match:["parsons-mckenna","parsons mckenna","parsons"], name:"Parsons-McKenna Construction", score:7.80, grade:"B", risk:"Moderate", location:"Liverpool, NY", date:"2026-06-10" },
  { match:["acropolis"], name:"Acropolis Realty Group", score:7.80, grade:"B", risk:"Moderate", location:"Syracuse, NY", date:"2026-06-15" },
// replaced-parsons, date:"2026-06-10" },
  { match:["fahs"], name:"FAHS Construction Group", score:7.55, grade:"B", risk:"Moderate", location:"Binghamton, NY", date:"2026-06-10" },
  { match:["christa"], name:"Christa Construction", score:7.25, grade:"B", risk:"Moderate", location:"Rochester, NY", date:"2026-06-10" },
  { match:["redev"], name:"Redev CNY / Redev Construction", score:7.70, grade:"B", risk:"Moderate", location:"Syracuse, NY", date:"2026-06-11" },
  { match:["dimarco"], name:"DiMarco Constructors LLC", score:7.00, grade:"B", risk:"Moderate", location:"Rochester, NY", date:"2026-06-10" },
  { match:["griffon","wilder balter","wbp"], name:"Griffon Construction (WBP Dev)", score:7.00, grade:"B", risk:"Moderate", location:"Chappaqua, NY", date:"2026-06-10" },
  { match:["celia","sam celia"], name:"Celia Construction / Sam Celia", score:6.90, grade:"B", risk:"Moderate", location:"Whitesboro, NY", date:"2026-06-10" },
  // ── Grade C (4.0–5.99) — Elevated Risk ──
  { match:["tenm","ten m"], name:"TenM Construction LLC", score:5.50, grade:"C", risk:"Elevated", location:"Staunton, VA", date:"2026-06-10" },
  { match:["first onsite"], name:"First Onsite Property Restoration", score:5.10, grade:"C", risk:"Elevated", location:"Greenwood Village, CO", date:"2026-06-10" },
  // ── Grade D (1.0–3.99) — High Risk ──
  { match:["haynes"], name:"Haynes Construction Co.", score:4.75, grade:"D", risk:"High", location:"Seymour, CT", date:"2026-06-10" },
  { match:["dalton builders","dalton build"], name:"Dalton Builders Inc.", score:4.30, grade:"D", risk:"High", location:"Dalton, NY", date:"2026-06-22" },

];

const lookupDD = (client) => {
  if (!client || typeof client !== "string") return null;
  const c = client.toLowerCase();
  return DD_REPORTS.find(r => r.match.some(m => c.includes(m))) || null;
};

// Effective score: manually entered score wins, else matched report score
const effectiveDD = (bid) => {
  const own = parseFloat(bid.ddScore);
  if (!isNaN(own) && bid.ddScore !== "" && bid.ddScore !== null) return { score: own, source: "manual" };
  const m = lookupDD(bid.client);
  if (m) return { score: m.score, source: "report", report: m };
  return null;
};
const DDScoring = ({ bid, setSaveStatus, flash }) => {
  const [summary, setSummary] = useState(bid.ddScore ?? "");
  const [notes, setNotes]     = useState(safeStr(bid.ddNotes));
  useEffect(() => { setSummary(bid.ddScore ?? ""); setNotes(safeStr(bid.ddNotes)); }, [bid.id]);

  const manual = (summary !== "" && summary !== null && !isNaN(parseFloat(summary))) ? parseFloat(summary) : null;
  const g = ddGrade(manual);
  const matched = lookupDD(bid.client);
  const hasManual = manual !== null;

  const setVal = (val) => setSummary(val === "" ? "" : Math.max(1, Math.min(10, parseFloat(val)||0)));

  const save = async () => {
    setSaveStatus("saving");
    const { error } = await supabase.from("bids").update({ ddScore: manual, ddNotes: notes }).eq("id", bid.id);
    flash(!error);
  };

  return (
    <div style={{ background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>🛡 Contractor Due Diligence Score</div>
        {g && (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:g.bg, border:`1.5px solid ${g.border}`, borderRadius:10, padding:"4px 12px" }}>
            <span style={{ fontSize:18, fontWeight:900, color:g.color }}>{manual.toFixed(2)}</span>
            <span style={{ fontSize:11, fontWeight:700, color:g.color }}>{g.grade} · {g.label}</span>
          </div>
        )}
      </div>
      {!matched && !hasManual && (
        <div style={{ background:"#F1F5F9", border:"1.5px dashed #CBD5E1", borderRadius:10, padding:"16px", textAlign:"center", marginBottom:12 }}>
          <div style={{ fontSize:24, fontWeight:900, color:bid.ddRequested?"#92650A":"#94A3B8", letterSpacing:"1px" }}>{bid.ddRequested ? "REQUESTED" : "TBD"}</div>
          <div style={{ fontSize:11, color:"#64748B", marginTop:6, lineHeight:1.5 }}>
            {bid.ddRequested
              ? <>Report requested for <b>{bid.client||"this contractor"}</b>. To generate it: ask Claude to <i>"run a due diligence report for {bid.client||"[contractor]"}"</i>, then enter the score below and attach the .docx in Documents.</>
              : <>No due diligence report run yet.</>}
          </div>
          {!bid.ddRequested && (
            <button onClick={async () => { setSaveStatus("saving"); const { error } = await supabase.from("bids").update({ ddRequested:true }).eq("id", bid.id); flash(!error); }}
              style={{ marginTop:10, background:BRAND.gold, color:BRAND.dark, border:"none", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:12, fontWeight:800 }}>
              🛡 Request DD Report
            </button>
          )}
        </div>
      )}

      {matched && !hasManual && (() => {
        const mg = ddGrade(matched.score);
        return (
          <div style={{ background:mg.bg, border:`1.5px solid ${mg.border}`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10, color:mg.color, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>✓ DD Report on File</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{matched.name}</div>
                <div style={{ fontSize:11, color:"#64748B" }}>{matched.location} · Report dated {matched.date}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:24, fontWeight:900, color:mg.color }}>{matched.score.toFixed(2)}</div>
                <div style={{ fontSize:10, fontWeight:700, color:mg.color }}>{mg.grade} · {mg.label}</div>
              </div>
            </div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:8, fontStyle:"italic" }}>Score auto-matched from completed report. Enter category scores below only to override.</div>
          </div>
        );
      })()}

      {matched && (
        <div style={{ marginBottom:12 }}>
          <a href={matched.reportUrl || "#"} onClick={e => !matched.reportUrl && e.preventDefault()}
            style={{ fontSize:12, color:"#2563EB", fontWeight:700, textDecoration:"none" }}>📎 Upload the {matched.name} report file in Documents below to attach it</a>
        </div>
      )}
      <div style={{ marginBottom:12 }}>
        <label style={labelStyle}>Overall DD Score (1–10){matched ? " — override matched report" : ""}</label>
        <input type="number" min="1" max="10" step="0.01" value={summary} onChange={e => setVal(e.target.value)}
          placeholder="Enter when report is generated & attached"
          style={{ ...inputStyle, border:`1.5px solid ${g?g.border:"#E2E8F0"}`, background:g?g.bg:"white", color:g?g.color:"#1E293B", fontWeight:700 }} />
      </div>
      <label style={labelStyle}>DD Risk Notes</label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key concerns, verification items, mitigation needed…"
        style={{ ...inputStyle, height:60, resize:"vertical", lineHeight:1.5, marginBottom:12 }} />
      <button onClick={save} style={{ background:BRAND.gold, color:BRAND.dark, border:"none", borderRadius:8, padding:"9px 20px", cursor:"pointer", fontSize:13, fontWeight:800 }}>Save DD Score</button>
    </div>
  );
};

const TurnkeyBox = ({ checked, approxSF, onChange }) => (
  <div style={{ marginBottom:12, display:"flex", alignItems:"center", gap:10, background:BRAND.goldLight, border:`1.5px solid ${BRAND.goldBorder}`, borderRadius:8, padding:"10px 14px", cursor:"pointer" }} onClick={onChange}>
    <input type="checkbox" checked={!!checked} onChange={onChange} onClick={e=>e.stopPropagation()} style={{ width:18, height:18, cursor:"pointer", accentColor:BRAND.gold }} />
    <div>
      <div style={{ fontSize:13, fontWeight:700, color:"#92650A" }}>🔧 Turnkey Job</div>
      <div style={{ fontSize:11, color:"#B8860B" }}>$30/SF estimate · Non-turnkey = $10/SF</div>
    </div>
    {approxSF > 0 && <div style={{ marginLeft:"auto", fontSize:13, fontWeight:800, color:"#92650A" }}>≈ {fmt(approxSF * (checked ? 30 : 10))}</div>}
  </div>
);

const EstimatorSelect = ({ value, onChange, estimators }) => (
  <div style={{ marginBottom:12 }}>
    <label style={labelStyle}>Estimator</label>
    <select value={value||""} onChange={onChange} style={inputStyle}>
      <option value="">— Select Estimator —</option>
      {estimators.map(e => <option key={e} value={e}>{e}</option>)}
    </select>
  </div>
);

const ResultSection = ({ bid, setSaveStatus, flash }) => {
  const [localResult, setLocalResult] = useState(safeStr(bid.bidResult));
  const [localActual, setLocalActual] = useState(bid.actualValue || "");
  useEffect(() => {
    setLocalResult(safeStr(bid.bidResult));
    setLocalActual(bid.actualValue || "");
  }, [bid.id]);

  const saveResult = async () => {
    if (localResult === "Won" && !localActual) return;
    const patch = { bidResult: localResult, actualValue: localResult === "Won" ? parseFloat(localActual)||0 : 0 };
    setSaveStatus("saving");
    const { error } = await supabase.from("bids").update(patch).eq("id", bid.id);
    flash(!error);
  };

  return (
    <div style={{ background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
      <div style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Bid Result</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        {RESULTS.map(r => (
          <button key={r.key} onClick={() => setLocalResult(r.key)}
            style={{ background:localResult===r.key?r.bg:"white", color:localResult===r.key?r.color:"#64748B", border:`2px solid ${localResult===r.key?r.border:"#E2E8F0"}`, borderRadius:10, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:700, transition:"all 0.15s" }}>
            {r.label}
          </button>
        ))}
      </div>
      {localResult === "Won" && (
        <div style={{ marginBottom:12 }}>
          <label style={labelStyle}>Actual Win Value ($) <span style={{ color:"#DC2626" }}>*</span></label>
          <input type="number" placeholder="Enter actual contract value" value={localActual}
            onChange={e => setLocalActual(e.target.value)}
            style={{ ...inputStyle, border:!localActual?"2px solid #FCA5A5":"1.5px solid #6EE7B7", background:!localActual?"#FEF2F2":"#F0FDF4" }} />
          {!localActual && <div style={{ fontSize:11, color:"#DC2626", marginTop:4 }}>Required for Won bids</div>}
        </div>
      )}
      {localResult && (
        <button onClick={saveResult} disabled={localResult==="Won"&&!localActual}
          style={{ background:localResult==="Won"&&!localActual?"#E2E8F0":BRAND.gold, color:localResult==="Won"&&!localActual?"#94A3B8":BRAND.dark, border:"none", borderRadius:8, padding:"9px 20px", cursor:localResult==="Won"&&!localActual?"not-allowed":"pointer", fontSize:13, fontWeight:800 }}>
          Save Result
        </button>
      )}
    </div>
  );
};

// ── Modal as proper component so error boundaries work ──
const BidModal = ({ bid, onClose, setSaveStatus, flash, moveBid, deleteBid, estimators }) => {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({...bid});
  useEffect(() => { setEditMode(false); setEditData({...bid}); }, [bid.id]);

  const sec           = sections.find(s => s.key === bid.section) || sections[0];
  const sf            = parseFloat(bid.approxSF) || 0;
  const est           = sf > 0 ? sf * (bid.turnkey ? 30 : 10) : 0;
  const value         = parseFloat(bid.value) || 0;
  const project       = safeStr(bid.project)       || "Untitled";
  const client        = safeStr(bid.client);
  const contactName   = safeStr(bid.contactName);
  const phone         = safeStr(bid.phone);
  const bidNumber     = safeStr(bid.bidNumber);
  const address       = safeStr(bid.address);
  const region        = safeStr(bid.region);
  const scope         = safeStr(bid.scope);
  const estimator     = safeStr(bid.estimator);
  const bondRequired  = safeStr(bid.bondRequired);
  const notes         = safeStr(bid.notes);
  const dueDate       = safeStr(bid.dueDate);
  const preBidDate    = safeStr(bid.preBidDate);
  const startDate     = safeStr(bid.startDate);
  const submittedDate = safeStr(bid.submittedDate);
  const rawLink       = safeStr(bid.plansLink);
  const plansLink     = rawLink.startsWith("http") ? rawLink : "";

  const openPlans = e => { e.stopPropagation(); e.preventDefault(); if (plansLink) window.open(plansLink, "_blank", "noopener"); };

  const saveEdit = async () => {
    const updated = sanitizeBid({ ...editData });
    setSaveStatus("saving");
    const { error } = await supabase.from("bids").update(updated).eq("id", updated.id);
    flash(!error);
    if (!error) setEditMode(false);
  };

  if (editMode) return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>Edit Bid</h2>
        <button onClick={() => setEditMode(false)} style={{ background:"#F1F5F9", border:"none", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:18, color:"#64748B" }}>✕</button>
      </div>
      {bidFields.map(([l,k,t]) => (
        <div key={k} style={{ marginBottom:12 }}>
          <label style={labelStyle}>{l}</label>
          <input type={t} value={editData[k]||""} onChange={e => setEditData(p => ({...p,[k]:e.target.value}))} style={inputStyle} placeholder={l} />
        </div>
      ))}
      <TurnkeyBox checked={editData.turnkey} approxSF={parseFloat(editData.approxSF)||0} onChange={() => setEditData(p => ({...p,turnkey:!p.turnkey}))} />
      <EstimatorSelect value={editData.estimator} onChange={e => setEditData(p => ({...p,estimator:e.target.value}))} estimators={estimators} />
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Section</label>
        <select value={editData.section} onChange={e => setEditData(p => ({...p,section:e.target.value}))} style={inputStyle}>
          {sections.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => setEditMode(false)} style={{ flex:1, padding:"11px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", cursor:"pointer", fontWeight:600, color:"#64748B" }}>Cancel</button>
        <button onClick={saveEdit} style={{ flex:2, padding:"11px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${BRAND.dark},${BRAND.dark2})`, color:BRAND.gold, cursor:"pointer", fontWeight:700, fontSize:15 }}>Save Changes</button>
      </div>
    </>
  );

  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <span style={{ background:sec.light, color:sec.color, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, display:"inline-block", marginBottom:8 }}>{sec.label}</span>
          {bid.turnkey && <span style={{ background:BRAND.goldLight, color:"#92650A", borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, display:"inline-block", marginBottom:8, marginLeft:6 }}>🔧 Turnkey</span>}
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1E293B" }}>{project}</h2>
          {bidNumber && <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Bid # {bidNumber}</div>}
        </div>
        <button onClick={onClose} style={{ background:"#F1F5F9", border:"none", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:18, color:"#64748B" }}>✕</button>
      </div>

      <div style={{ background:`linear-gradient(135deg,${sec.light},white)`, border:"1.5px solid "+sec.border, borderRadius:14, padding:"14px 18px", marginBottom:sf>0?10:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:28, fontWeight:900, color:sec.badge }}>{fmt(value)}</div>
          <div style={{ fontSize:12, color:"#64748B", fontWeight:600, display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
            Bid Value <DaysChip dueDate={dueDate} section={bid.section} />
          </div>
        </div>
        {plansLink && <button onClick={openPlans} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#EFF6FF", color:"#2563EB", border:"1.5px solid #BFDBFE", borderRadius:6, padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>📄 View Plans</button>}
      </div>

      {sf > 0 && (
        <div style={{ background:BRAND.goldLight, border:`1.5px solid ${BRAND.goldBorder}`, borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, color:"#92400E", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Approx Square Footage</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#92400E" }}>📐 {fmtN(sf)} SF</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:"#B8860B", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Est. Job Value ({bid.turnkey?"$30":"$10"}/SF)</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#B8860B" }}>{fmt(est)}</div>
          </div>
        </div>
      )}

      {bid.section === "submitted" && <ResultSection bid={bid} setSaveStatus={setSaveStatus} flash={flash} />}

      {!plansLink && (
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#92400E" }}>
          No plans link on file. <button onClick={() => { setEditData({...bid}); setEditMode(true); }} style={{ background:"none", border:"none", color:"#D97706", cursor:"pointer", fontWeight:700, fontSize:12, padding:0 }}>Add one →</button>
        </div>
      )}

      <div style={{ background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:10, color:"#0284C7", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Contact Info</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[["Client / Company",client],["Contact Name",contactName],["Estimator",estimator],["Region",region]].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{v||"—"}</div>
            </div>
          ))}
          <div>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Phone</div>
            {phone ? <a href={"tel:"+phone} style={{ fontSize:14, fontWeight:700, color:"#2563EB", textDecoration:"none" }}>📞 {phone}</a> : <div style={{ fontSize:13, color:"#94A3B8" }}>—</div>}
          </div>
        </div>
      </div>

      {/* Intake + BT + Plans status */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, background:bid.intakeDone?"#D1FAE5":"#F8FAFC", border:`1.5px solid ${bid.intakeDone?"#6EE7B7":"#E2E8F0"}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:bid.intakeDone?"#065F46":"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Intake</div>
          <div style={{ fontSize:16, fontWeight:900, color:bid.intakeDone?"#059669":"#CBD5E1" }}>{bid.intakeDone ? "✓" : "○"}</div>
        </div>
        <div style={{ flex:1, background:bid.btCreated?"#DBEAFE":"#F8FAFC", border:`1.5px solid ${bid.btCreated?"#93C5FD":"#E2E8F0"}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:bid.btCreated?"#1D4ED8":"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>BT Created</div>
          <div style={{ fontSize:16, fontWeight:900, color:bid.btCreated?"#2563EB":"#CBD5E1" }}>{bid.btCreated ? "✓" : "○"}</div>
        </div>
        <div style={{ flex:1, background:bid.btPlansUploaded?"#FFEDD5":"#F8FAFC", border:`1.5px solid ${bid.btPlansUploaded?"#FED7AA":"#E2E8F0"}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:bid.btPlansUploaded?"#C2410C":"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>BT Plans</div>
          <div style={{ fontSize:16, fontWeight:900, color:bid.btPlansUploaded?"#EA580C":"#CBD5E1" }}>{bid.btPlansUploaded ? "✓" : "○"}</div>
        </div>
      </div>

      <DDScoring bid={bid} setSaveStatus={setSaveStatus} flash={flash} />

      {address && (
        <div style={{ background:"#F8FAFC", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"flex-start", gap:8 }}>
          <span>📍</span>
          <div>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Project Address</div>
            <div style={{ fontSize:13, color:"#334155" }}>{address}</div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[["Due Date",dueDate],["Pre-Bid Meeting",preBidDate],["Start Date",startDate],["Submitted",submittedDate]].map(([l,v]) => (
          <div key={l} style={{ background:"#F8FAFC", borderRadius:10, padding:"10px 14px" }}>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{v||"—"}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"#F8FAFC", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
        <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:5 }}>Scope</div>
        <div style={{ fontSize:13, color:"#334155", lineHeight:1.55 }}>{scope||"—"}</div>
      </div>

      {bondRequired && (
        <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ fontSize:10, color:"#C2410C", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>Bond Required</div>
          <div style={{ fontSize:13, color:"#7C2D12", fontWeight:600 }}>{bondRequired}</div>
        </div>
      )}

      {notes && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ fontSize:10, color:"#DC2626", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Notes</div>
          <div style={{ fontSize:13, color:"#7F1D1D" }}>{notes}</div>
        </div>
      )}

      {safeStr(bid.declineReason) && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ fontSize:10, color:"#B91C1C", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Decline Reason</div>
          <div style={{ fontSize:13, color:"#7F1D1D" }}>{bid.declineReason}</div>
        </div>
      )}

      <BidDocuments bidId={bid.id} />

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Move to Section</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
          {sections.filter(s => s.key !== bid.section).map(s => (
            <button key={s.key} onClick={() => moveBid(bid.id, s.key)} style={{ background:s.light, color:s.color, border:"1.5px solid "+s.border, borderRadius:7, padding:"6px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>{s.emoji} {s.short}</button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => { setEditData({...bid}); setEditMode(true); }} style={{ flex:2, padding:"11px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${BRAND.dark},${BRAND.dark2})`, color:BRAND.gold, cursor:"pointer", fontWeight:700, fontSize:14 }}>Edit</button>
        <button onClick={() => deleteBid(bid.id)} style={{ flex:1, padding:"11px", borderRadius:10, border:"1.5px solid #FECACA", background:"#FEF2F2", color:"#DC2626", cursor:"pointer", fontWeight:700 }}>Delete</button>
      </div>
    </>
  );
};

const BidDocuments = ({ bidId }) => {
  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const inputRef                = React.useRef();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("bid-documents").list(bidId, { sortBy:{ column:"created_at", order:"desc" } });
    if (!error) setFiles(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [bidId]);

  const upload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxMB = 200;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File too large — max ${maxMB}MB. This file is ${(file.size/(1024*1024)).toFixed(1)}MB.`);
      e.target.value = "";
      return;
    }
    setUploading(true); setError("");
    const path = `${bidId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("bid-documents").upload(path, file);
    if (error) setError("Upload failed: " + error.message);
    await load();
    setUploading(false);
    e.target.value = "";
  };

  const remove = async (name) => {
    await supabase.storage.from("bid-documents").remove([`${bidId}/${name}`]);
    await load();
  };

  const getUrl = name => supabase.storage.from("bid-documents").getPublicUrl(`${bidId}/${name}`).data.publicUrl;

  const fileIcon = name => {
    const ext = name.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return "📄";
    if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼️";
    if (["doc","docx"].includes(ext)) return "📝";
    if (["xls","xlsx","csv"].includes(ext)) return "📊";
    if (["zip","rar"].includes(ext)) return "🗜️";
    return "📎";
  };

  const fmtSize = bytes => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KB";
    return (bytes/(1024*1024)).toFixed(1) + " MB";
  };

  return (
    <div style={{ background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>📁 Documents</div>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ background:BRAND.gold, color:BRAND.dark, border:"none", borderRadius:7, padding:"5px 12px", cursor:uploading?"wait":"pointer", fontSize:12, fontWeight:800, opacity:uploading?0.6:1 }}>
          {uploading ? "Uploading…" : "+ Upload"}
        </button>
        <input ref={inputRef} type="file" style={{ display:"none" }} onChange={upload} />
      </div>

      {error && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:12, color:"#DC2626", fontWeight:600 }}>{error}</div>}

      {loading ? (
        <div style={{ fontSize:12, color:"#94A3B8", textAlign:"center", padding:"8px 0" }}>Loading…</div>
      ) : files.length === 0 ? (
        <div style={{ fontSize:12, color:"#94A3B8", textAlign:"center", padding:"8px 0", border:"2px dashed #E2E8F0", borderRadius:8 }}>
          No documents yet — click Upload to add files
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {files.map(f => (
            <div key={f.name} style={{ display:"flex", alignItems:"center", gap:10, background:"white", borderRadius:8, padding:"8px 12px", border:"1px solid #E2E8F0" }}>
              <span style={{ fontSize:20 }}>{fileIcon(f.name)}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1E293B", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {f.name.replace(/^\d+_/, "")}
                </div>
                {f.metadata?.size && <div style={{ fontSize:10, color:"#94A3B8" }}>{fmtSize(f.metadata.size)}</div>}
              </div>
              <a href={getUrl(f.name)} target="_blank" rel="noopener noreferrer"
                style={{ background:"#EFF6FF", color:"#2563EB", border:"1.5px solid #BFDBFE", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>
                View
              </a>
              <button onClick={() => remove(f.name)}
                style={{ background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:700 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

class ModalErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e.message }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding:24, textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
        <div style={{ fontWeight:700, color:"#DC2626", marginBottom:6 }}>Could not load bid</div>
        <div style={{ fontSize:12, color:"#64748B", background:"#F8FAFC", borderRadius:8, padding:"8px 12px", textAlign:"left" }}>{this.state.error}</div>
        <button onClick={() => this.setState({error:null})} style={{ marginTop:16, background:"#F1F5F9", border:"none", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontWeight:600 }}>Close</button>
      </div>
    );
    return this.props.children;
  }
}

const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #E2E8F0", fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:"inherit" };
const labelStyle = { display:"block", fontSize:11, fontWeight:700, color:"#64748B", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.6px" };
const selStyle   = { padding:"6px 10px", borderRadius:8, border:"1.5px solid #E2E8F0", fontSize:13, cursor:"pointer", fontFamily:"inherit", background:"white" };

const emptyBid = {
  project:"", client:"", contactName:"", phone:"", bidNumber:"",
  address:"", region:"", approxSF:"", turnkey:false, value:"",
  dueDate:"", preBidDate:"", scope:"", estimator:"", bondRequired:"",
  plansLink:"", startDate:"", submittedDate:"", notes:"",
  bidResult:"", actualValue:0, intakeDone:false, btCreated:false, btPlansUploaded:false, ddScores:{}, ddScore:"", ddNotes:"", section:"thisWeek"
};

// ── Sanitizes a bid object before any insert/update so empty strings never reach
//    numeric or JSONB columns. Runs on BOTH save paths (addBid + saveEdit). ──
const sanitizeBid = (obj) => {
  const clean = { ...obj };
  // Numeric columns that should be 0 when blank
  ["value","approxSF","actualValue"].forEach(f => {
    const n = parseFloat(clean[f]);
    clean[f] = isNaN(n) ? 0 : n;
  });
  // ddScore is numeric but blank means "no score yet" → must be null, never 0
  {
    const n = parseFloat(clean.ddScore);
    clean.ddScore = (clean.ddScore === "" || clean.ddScore === null || clean.ddScore === undefined || isNaN(n)) ? null : n;
  }
  // JSONB column: never send ""
  if (clean.ddScores === "" || clean.ddScores === undefined) clean.ddScores = null;
  // Safety net: any remaining empty string anywhere → null (protects every column)
  Object.keys(clean).forEach(k => { if (clean[k] === "") clean[k] = null; });
  return clean;
};

const bidFields = [
  ["Project Name","project","text"],["Client / Company","client","text"],
  ["Contact Name","contactName","text"],["Phone Number","phone","tel"],
  ["Bid / RFQ #","bidNumber","text"],["Project Address","address","text"],
  ["Region","region","text"],["Approx SF","approxSF","number"],
  ["Bid Value ($)","value","number"],["Due Date","dueDate","text"],
  ["Pre-Bid Meeting Date","preBidDate","text"],["Project Scope","scope","text"],
  ["Bond Required","bondRequired","text"],["Plans Link (URL)","plansLink","url"],
  ["Start Date","startDate","text"],["Submitted Date","submittedDate","text"],
  ["Notes","notes","text"],
];

class AppErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"system-ui", color:"#64748B", gap:12 }}>
        <div style={{ fontSize:36 }}>🏗️</div>
        <div style={{ fontWeight:700, fontSize:16 }}>Something went wrong</div>
        <button onClick={() => window.location.reload()} style={{ background:"#C9A84C", color:"#1A1A1A", border:"none", borderRadius:8, padding:"10px 24px", cursor:"pointer", fontWeight:700, fontSize:14 }}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}

function AppInner() {
  const [bids, setBids]             = useState([]);
  const [estimators, setEstimators] = useState(DEFAULT_ESTIMATORS);
  const [newEstimator, setNewEstimator] = useState("");
  const [loaded, setLoaded]         = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [selected, setSelected]     = useState(null);
  const [hovered, setHovered]       = useState(null);
  const [addOpen, setAddOpen]       = useState(false);
  const [addError, setAddError]     = useState("");
  const [form, setForm]             = useState(emptyBid);
  const [dragId, setDragId]         = useState(null);
  const [dragOver, setDragOver]     = useState(null);
  const [showReset, setShowReset]   = useState(false);
  const [online, setOnline]         = useState(true);
  const [declinePrompt, setDeclinePrompt] = useState(null); // { id } | null
  const [declineReason, setDeclineReason] = useState("");
  const [filterEstimator, setFilterEstimator] = useState("All");
  const [filterRegion, setFilterRegion]       = useState("All");
  const [searchQuery, setSearchQuery]         = useState("");

  useEffect(() => {
    (async () => {
      const { data: bidsData, error: bidsError } = await supabase.from("bids").select("*").order("createdAt");
      if (!bidsError) setBids(bidsData || []);
      const { data: settingsData } = await supabase.from("settings").select("value").eq("key","estimators").single();
      if (settingsData?.value) setEstimators(settingsData.value);
      setLoaded(true);
    })();
  }, []);

  const saveEstimators = async (list) => {
    setEstimators(list);
    await supabase.from("settings").upsert({ key:"estimators", value: list });
  };

  const addEstimator = async () => {
    const name = newEstimator.trim();
    if (!name || estimators.includes(name)) return;
    await saveEstimators([...estimators, name]);
    setNewEstimator("");
  };

  const removeEstimator = async (name) => {
    await saveEstimators(estimators.filter(e => e !== name));
  };

  useEffect(() => {
    const ch = supabase.channel("bids-live")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"bids" },
        ({ new: row }) => setBids(p => [...p.filter(b => b.id !== row.id), row]))
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"bids" },
        ({ new: row }) => { setBids(p => p.map(b => b.id === row.id ? row : b)); setSelected(s => s?.id === row.id ? row : s); })
      .on("postgres_changes", { event:"DELETE", schema:"public", table:"bids" },
        ({ old: row }) => setBids(p => p.filter(b => b.id !== row.id)))
      .subscribe(s => setOnline(s === "SUBSCRIBED"));
    return () => supabase.removeChannel(ch);
  }, []);

  const flash = ok => { setSaveStatus(ok ? "saved" : "error"); setTimeout(() => setSaveStatus("idle"), 2000); };

  const addBid = async () => {
    setAddError("");
    if (!form.project) { setAddError("⚠️ Project Name is required."); return; }
    if (!form.client)  { setAddError("⚠️ Client is required."); return; }
    try {
      const id = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
      const bid = sanitizeBid({
        ...form, id,
        createdAt: new Date().toISOString()
      });
      setSaveStatus("saving");
      const { error } = await supabase.from("bids").insert([bid]);
      if (error) {
        setAddError("❌ Supabase error: " + error.message);
        flash(false);
        return;
      }
      flash(true);
      setForm(emptyBid);
      setAddOpen(false);
    } catch (e) {
      setAddError("❌ Exception: " + (e.message || String(e)));
      flash(false);
    }
  };

  const deleteBid = async id => {
    setSaveStatus("saving");
    const { error } = await supabase.from("bids").delete().eq("id", id);
    flash(!error);
    if (!error) setSelected(null);
  };

  const moveBid = async (id, toSection, reason = "") => {
    setSaveStatus("saving");
    const patch = toSection === "declined"
      ? { section: toSection, declineReason: reason }
      : { section: toSection };
    const { error } = await supabase.from("bids").update(patch).eq("id", id);
    flash(!error);
  };

  const requestMove = (id, toSection) => {
    if (toSection === "declined") {
      setDeclinePrompt({ id, toSection });
      setDeclineReason("");
    } else {
      moveBid(id, toSection);
    }
  };

  const toggleField = async (e, id, field, current) => {
    e.stopPropagation();
    await supabase.from("bids").update({ [field]: !current }).eq("id", id);
  };

  const confirmDecline = async () => {
    if (!declineReason.trim()) return;
    await moveBid(declinePrompt.id, "declined", declineReason.trim());
    setDeclinePrompt(null);
    setDeclineReason("");
    if (selected?.id === declinePrompt.id) setSelected(null);
  };

  const onDragStart = (e, bid) => { setDragId(bid.id); e.dataTransfer.effectAllowed = "move"; };
  const onDragEnd   = () => { setDragId(null); setDragOver(null); };
  const onDragOver  = (e, k) => { e.preventDefault(); setDragOver(k); };
  const onDragLeave = e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null); };
  const onDrop = async (e, k) => { e.preventDefault(); if (dragId) requestMove(dragId, k); setDragId(null); setDragOver(null); };

  const syncDDScores = async () => {
    const toUpdate = bids.filter(b => {
      const m = lookupDD(b.client);
      const empty = b.ddScore === null || b.ddScore === undefined || b.ddScore === "" || isNaN(parseFloat(b.ddScore));
      return m && empty;
    });
    if (toUpdate.length === 0) { flash(true); return; }
    setSaveStatus("saving");
    let ok = true;
    for (const b of toUpdate) {
      const m = lookupDD(b.client);
      const { error } = await supabase.from("bids").update({ ddScore: m.score }).eq("id", b.id);
      if (error) ok = false;
    }
    flash(ok);
  };

  const exportCSV = (sectionKey=null) => {
    const rows = sectionKey ? bids.filter(b => b.section === sectionKey) : bids;
    const headers = ["Project","Client","Contact","Phone","Bid #","Address","Region","Approx SF","Turnkey","Est. Value","Bid Value","Due Date","Pre-Bid","Start","Submitted","Scope","Estimator","Bond","Notes","Result","Actual Value","Section","Plans Link"];
    const data = rows.map(b => {
      const sf = parseFloat(b.approxSF)||0;
      return [b.project,b.client,b.contactName||"",b.phone||"",b.bidNumber||"",b.address||"",b.region||"",sf,b.turnkey?"Yes":"No",sf*(b.turnkey?30:10),b.value,b.dueDate,b.preBidDate||"",b.startDate,b.submittedDate,b.scope,b.estimator,b.bondRequired||"",b.notes,b.bidResult||"",b.actualValue||"",b.section,b.plansLink];
    });
    const csv = [headers,...data].map(r => r.map(v => '"'+(v||"").toString().replace(/"/g,'""')+'"').join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download = (sectionKey||"all-bids")+".csv"; a.click();
  };

  const SaveBadge = () => {
    const map = { saving:["#F59E0B","Saving"], saved:["#10B981","Saved"], error:["#EF4444","Error"], idle:[null,null] };
    const [color, text] = map[saveStatus];
    if (!text) return null;
    return <span style={{ fontSize:11, fontWeight:700, color, background:color+"22", padding:"3px 9px", borderRadius:20 }}>{text}</span>;
  };

  if (!loaded) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"system-ui", flexDirection:"column", gap:12, color:"#64748B" }}>
      <div style={{ fontSize:40 }}>🏗️</div>
      <div style={{ fontWeight:700, fontSize:16 }}>Loading bid data…</div>
    </div>
  );

  const totalPipeline = bids.reduce((s,b) => s + (parseFloat(b.value)||0), 0);
  const acceptedValue = bids.filter(b => b.section==="working"||b.section==="submitted").reduce((s,b) => s + (parseFloat(b.value)||0), 0);
  const winRate       = bids.length ? Math.round(bids.filter(b => b.section==="working"||b.section==="submitted").length / bids.length * 100) : 0;
  const estimatorOpts = ["All", ...estimators.filter(e => bids.some(b => b.estimator === e))];
  const regionOpts    = ["All", ...Array.from(new Set(bids.map(b => b.region).filter(Boolean))).sort()];

  const filteredBids = bids.filter(b => {
    const matchEst    = filterEstimator === "All" || b.estimator === filterEstimator;
    const matchRegion = filterRegion    === "All" || b.region    === filterRegion;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || [b.project, b.client, b.estimator, b.contactName, b.region, b.address, b.bidNumber]
      .some(v => v && typeof v === "string" && v.toLowerCase().includes(q));
    return matchEst && matchRegion && matchSearch;
  });

  const estSummary = estimators.filter(name => bids.some(b => b.estimator === name)).map(name => {
    const eb        = bids.filter(b => b.estimator === name);
    const won       = eb.filter(b => b.bidResult === "Won");
    const submitted = eb.filter(b => b.section === "submitted");
    return {
      name,
      total:          eb.length,
      value:          eb.reduce((s,b) => s + (parseFloat(b.value)||0), 0),
      wonValue:       won.reduce((s,b) => s + (parseFloat(b.actualValue)||parseFloat(b.value)||0), 0),
      winRate:        submitted.length ? Math.round(won.length / submitted.length * 100) : 0,
      wonCount:       won.length,
      submittedCount: submitted.length,
    };
  });

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#F1F5F9", minHeight:"100vh", padding:"20px 24px" }}>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,${BRAND.dark},${BRAND.dark2})`, borderRadius:18, padding:"22px 28px", marginBottom:20, color:"white", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, boxShadow:`0 8px 32px rgba(0,0,0,0.35), 0 3px 0 ${BRAND.gold}` }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <span style={{ fontSize:28 }}>🏗️</span>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800 }}>
              <span style={{ color:"white" }}>TenM </span>
              <span style={{ color:BRAND.gold }}>Construction</span>
            </h1>
            <SaveBadge />
            <span style={{ fontSize:10, background:online?"#10B981":"#F59E0B", color:"white", borderRadius:20, padding:"2px 8px", fontWeight:700 }}>{online?"LIVE":"..."}</span>
          </div>
          <p style={{ margin:0, color:BRAND.gold, fontSize:12, fontStyle:"italic" }}>More than structures, we build futures.</p>
        </div>
        <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
          {[["Total Bids",bids.length],["Pipeline",fmt(totalPipeline)],["Accepted",fmt(acceptedValue)],["Win Rate",winRate+"%"]].map(([l,v]) => (
            <div key={l} style={{ textAlign:"center", background:"rgba(255,255,255,0.10)", borderRadius:10, padding:"10px 16px" }}>
              <div style={{ fontSize:20, fontWeight:800, lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:11, opacity:0.7, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={() => setAddOpen(true)} style={{ background:BRAND.gold, border:"none", color:BRAND.dark, borderRadius:10, padding:"10px 20px", cursor:"pointer", fontSize:14, fontWeight:800, boxShadow:`0 4px 14px ${BRAND.gold}55` }}>+ Add Bid</button>
          <button onClick={() => exportCSV()} style={{ background:"rgba(255,255,255,0.10)", border:`1.5px solid ${BRAND.gold}66`, color:BRAND.gold, borderRadius:10, padding:"10px 14px", cursor:"pointer", fontSize:13, fontWeight:600 }}>Export CSV</button>
          <button onClick={syncDDScores} title="Apply matched due diligence scores to all bids with a report on file" style={{ background:"rgba(255,255,255,0.10)", border:`1.5px solid ${BRAND.gold}66`, color:BRAND.gold, borderRadius:10, padding:"10px 14px", cursor:"pointer", fontSize:13, fontWeight:600 }}>🛡 Sync DD</button>
          <button onClick={() => setShowReset(true)} style={{ background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.55)", borderRadius:10, padding:"10px 14px", cursor:"pointer", fontSize:13 }}>Reset</button>
        </div>
      </div>

      {/* ── Filter + Search Bar ── */}
      <div style={{ background:"white", borderRadius:12, padding:"12px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:"1 1 220px", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"6px 12px" }}>
          <span style={{ fontSize:14, color:"#94A3B8" }}>🔍</span>
          <input type="text" placeholder="Search job, builder, estimator, contact, location…" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"#1E293B", width:"100%", fontFamily:"inherit" }} />
          {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:16, padding:0 }}>✕</button>}
        </div>
        <div style={{ width:1, height:28, background:"#E2E8F0" }} />
        <span style={{ fontSize:13, fontWeight:700, color:"#64748B" }}>Filter:</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#64748B" }}>Estimator</label>
          <select value={filterEstimator} onChange={e => setFilterEstimator(e.target.value)} style={selStyle}>
            {estimatorOpts.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#64748B" }}>Region</label>
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={selStyle}>
            {regionOpts.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        {(filterEstimator !== "All" || filterRegion !== "All" || searchQuery) && (
          <button onClick={() => { setFilterEstimator("All"); setFilterRegion("All"); setSearchQuery(""); }}
            style={{ background:"#FEE2E2", color:"#DC2626", border:"none", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>✕ Clear</button>
        )}
        <span style={{ marginLeft:"auto", fontSize:12, color:"#94A3B8", fontWeight:600 }}>{filteredBids.length} of {bids.length} bids</span>
      </div>

      {dragId && <div style={{ textAlign:"center", marginBottom:16, fontSize:13, color:"#64748B", fontWeight:600 }}>Drop the tile into any section to move the bid</div>}

      {/* ── Sections ── */}
      {sections.map(sec => {
        const sb = filteredBids.filter(b => b.section === sec.key).slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        const sv = sb.reduce((s,b) => s + (parseFloat(b.value)||0), 0);
        const isDropTarget = dragOver === sec.key;
        const sameSection  = bids.find(b => b.id === dragId)?.section === sec.key;
        const isDeclined   = sec.key === "declined";
        return (
          <div key={sec.key} onDragOver={e => onDragOver(e, sec.key)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, sec.key)}
            style={{ marginBottom:24, borderRadius:16, border:isDropTarget&&!sameSection?`2.5px dashed ${sec.badge}`:"2.5px solid transparent", background:isDropTarget&&!sameSection?sec.light:"transparent", padding:isDropTarget&&!sameSection?"12px 12px 16px":"0", transition:"all 0.15s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ width:5, height:28, borderRadius:3, background:sec.badge }} />
              <span style={{ fontSize:18 }}>{sec.emoji}</span>
              <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:sec.color }}>{sec.label}</h2>
              <span style={{ background:sec.badge, color:"white", borderRadius:20, padding:"2px 9px", fontSize:12, fontWeight:700 }}>{sb.length}</span>
              {sv > 0 && <span style={{ marginLeft:"auto", fontSize:13, fontWeight:700, color:"#475569" }}>{fmt(sv)} total</span>}
              {sv > 0 && <button onClick={() => exportCSV(sec.key)} style={{ background:sec.light, color:sec.color, border:`1px solid ${sec.border}`, borderRadius:7, padding:"3px 10px", cursor:"pointer", fontSize:11, fontWeight:700 }}>Export</button>}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:isDeclined?8:12, overflow:"visible", position:"relative" }}>
              {sb.length === 0 ? (
                <div style={{ background:"white", border:`2px dashed ${sec.border}`, borderRadius:12, padding:"16px 24px", color:"#94A3B8", fontSize:13, width:"100%", textAlign:"center" }}>
                  {isDropTarget ? "Release to move here" : "No bids in this section"}
                </div>
              ) : sb.map(bid => {
                const isHov      = hovered === bid.id && !dragId;
                const isDragging = dragId === bid.id;
                const sf         = parseFloat(bid.approxSF)||0;
                const estVal     = sf > 0 ? sf * (bid.turnkey ? 30 : 10) : 0;
                return (
                  <div key={bid.id} draggable onDragStart={e => onDragStart(e, bid)} onDragEnd={onDragEnd}
                    onMouseEnter={() => !dragId && setHovered(bid.id)} onMouseLeave={() => setHovered(null)}
                    onClick={() => !dragId && bid.id && setSelected(bid)}
                    style={{ background:isDragging?"#F1F5F9":isHov?sec.light:"white", border:`2px solid ${isDragging?"#CBD5E1":isHov?sec.badge:sec.border}`, borderRadius:isDeclined?8:14, padding:isDeclined?"6px 10px":"14px 15px", width:isDeclined?150:228, cursor:isDragging?"grabbing":"grab", transition:"all 0.15s", transform:isDragging?"rotate(2deg) scale(0.97)":isHov?"translateY(-4px)":"none", boxShadow:isDragging?"none":isHov?`0 10px 28px ${sec.badge}2E`:"0 1px 5px rgba(0,0,0,0.07)", opacity:isDragging?0.5:1, position:"relative", userSelect:"none", zIndex:isDeclined&&isHov?9999:1, overflow:"visible" }}>

                    {!isDeclined && <div style={{ position:"absolute", top:8, right:8, fontSize:11, color:"#CBD5E1" }}>drag</div>}
                    {!isDeclined && (
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:3 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:sec.badge, textTransform:"uppercase", letterSpacing:"0.6px" }}>{sec.short}</div>
                        {bid.turnkey && <span style={{ background:BRAND.goldLight, color:"#92650A", borderRadius:20, padding:"1px 6px", fontSize:9, fontWeight:700 }}>✓ Turnkey</span>}
                      </div>
                    )}

                    <div style={{ fontSize:isDeclined?11:14, fontWeight:700, color:"#1E293B", lineHeight:1.35, marginBottom:isDeclined?2:4, paddingRight:isDeclined?0:16, whiteSpace:isDeclined?"nowrap":"normal", overflow:isDeclined?"hidden":"visible", textOverflow:isDeclined?"ellipsis":"clip" }}>{safeStr(bid.project)||"Untitled"}</div>
                    {isDeclined && bid.dueDate && <div style={{ fontSize:10, color:"#94A3B8" }}>📅 {bid.dueDate}</div>}

                    {!isDeclined && <>
                      {bid.client && <div style={{ fontSize:12, color:"#64748B", marginBottom:2 }}>👤 {bid.client}</div>}
                      {bid.contactName && <div style={{ fontSize:11, color:"#64748B", marginBottom:2 }}>🙎 {bid.contactName}</div>}
                      {bid.phone && <div style={{ marginBottom:2 }}><a href={"tel:"+safeStr(bid.phone).replace(/[^0-9+]/g,"")} onClick={e=>{e.stopPropagation();}} style={{ fontSize:11, color:"#2563EB", fontWeight:700, textDecoration:"none" }}>📞 {bid.phone}</a></div>}
                      {bid.address && <div style={{ fontSize:11, color:"#64748B", marginBottom:2 }}>📍 {bid.address}</div>}
                      {bid.region && <div style={{ fontSize:10, color:"#94A3B8", marginBottom:2 }}>🗺 {bid.region}</div>}
                      {bid.bidNumber && <div style={{ fontSize:10, color:"#94A3B8", marginBottom:3 }}>Bid# {bid.bidNumber}</div>}
                      {bid.estimator && <div style={{ fontSize:10, color:BRAND.gold, fontWeight:700, marginBottom:3 }}>🧢 {bid.estimator}</div>}
                      {!effectiveDD(bid) && (
                        <button onClick={e => { e.stopPropagation(); supabase.from("bids").update({ ddRequested:true }).eq("id", bid.id); setSelected(bid); }}
                          style={{ display:"inline-flex", alignItems:"center", gap:4, background:bid.ddRequested?"#FEF3C7":"#FFF8E7", color:"#92650A", border:`1.5px solid ${BRAND.goldBorder}`, borderRadius:6, padding:"3px 8px", cursor:"pointer", fontSize:10, fontWeight:800, marginBottom:4 }}>
                          🛡 {bid.ddRequested ? "DD Requested" : "Request DD"}
                        </button>
                      )}
                      {sf > 0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:5, background:BRAND.goldLight, border:`1px solid ${BRAND.goldBorder}`, borderRadius:6, padding:"3px 7px", marginBottom:4 }}>
                          <span style={{ fontSize:10, color:"#92400E", fontWeight:600 }}>📐 {fmtN(sf)} SF</span>
                          <span style={{ fontSize:10, color:"#B8860B", fontWeight:800 }}>≈ {fmt(estVal)}</span>
                        </div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4, flexWrap:"wrap" }}>
                        <div style={{ fontSize:17, fontWeight:800, color:sec.badge }}>{fmt(bid.value)}</div>
                        <DaysChip dueDate={bid.dueDate} section={bid.section} small={true} />
                      </div>
                      {bid.section === "submitted" && (
                        <div style={{ marginBottom:4 }}>
                          <ResultBadge result={bid.bidResult} />
                          {bid.bidResult === "Won" && parseFloat(bid.actualValue) > 0 && (
                            <div style={{ fontSize:12, fontWeight:800, color:"#059669", marginTop:3 }}>🏆 {fmt(bid.actualValue)}</div>
                          )}
                        </div>
                      )}
                      {bid.plansLink && safeStr(bid.plansLink).startsWith("http") && (
                        <button onClick={e => { e.stopPropagation(); window.open(bid.plansLink,"_blank","noopener"); }}
                          style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(37,99,235,0.1)", color:"#2563EB", border:"1.5px solid #BFDBFE", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:700 }}>Plans</button>
                      )}

                      {/* Intake + BT + Plans toggle badges */}
                      <div style={{ display:"flex", gap:4, marginTop:6 }}>
                        <button onClick={e => toggleField(e, bid.id, "intakeDone", bid.intakeDone)}
                          style={{ flex:1, background:bid.intakeDone?"#D1FAE5":"#F8FAFC", color:bid.intakeDone?"#065F46":"#94A3B8", border:`1.5px solid ${bid.intakeDone?"#6EE7B7":"#E2E8F0"}`, borderRadius:6, padding:"3px 0", fontSize:9, fontWeight:800, cursor:"pointer", transition:"all 0.15s" }}>
                          {bid.intakeDone ? "✓ Intake" : "○ Intake"}
                        </button>
                        <button onClick={e => toggleField(e, bid.id, "btCreated", bid.btCreated)}
                          style={{ flex:1, background:bid.btCreated?"#DBEAFE":"#F8FAFC", color:bid.btCreated?"#1D4ED8":"#94A3B8", border:`1.5px solid ${bid.btCreated?"#93C5FD":"#E2E8F0"}`, borderRadius:6, padding:"3px 0", fontSize:9, fontWeight:800, cursor:"pointer", transition:"all 0.15s" }}>
                          {bid.btCreated ? "✓ BT" : "○ BT"}
                        </button>
                        <button onClick={e => toggleField(e, bid.id, "btPlansUploaded", bid.btPlansUploaded)}
                          style={{ flex:1, background:bid.btPlansUploaded?"#FFEDD5":"#F8FAFC", color:bid.btPlansUploaded?"#C2410C":"#94A3B8", border:`1.5px solid ${bid.btPlansUploaded?"#FED7AA":"#E2E8F0"}`, borderRadius:6, padding:"3px 0", fontSize:9, fontWeight:800, cursor:"pointer", transition:"all 0.15s" }}>
                          {bid.btPlansUploaded ? "✓ Plans" : "○ Plans"}
                        </button>
                      </div>
                    </>}

                    {/* Corner tabs */}
                    {bid.intakeDone && (
                      <div style={{ position:"absolute", bottom:0, left:0, width:22, height:22, background:"#059669", borderRadius:"0 6px 0 12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"white", fontWeight:900 }}>✓</div>
                    )}
                    {bid.btCreated && (
                      <div style={{ position:"absolute", bottom:0, right:0, width:22, height:22, background:"#2563EB", borderRadius:"6px 0 12px 0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", fontWeight:900 }}>BT</div>
                    )}
                    {bid.btPlansUploaded && (
                      <div style={{ position:"absolute", top:0, left:0, width:22, height:22, background:"#EA580C", borderRadius:"12px 0 6px 0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", fontWeight:900 }}>📄</div>
                    )}
                    {(() => {
                      const eff = effectiveDD(bid);
                      if (!eff) return null;
                      const g = ddGrade(eff.score);
                      return (
                        <div title={`DD ${eff.score.toFixed(2)} · ${g.label}${eff.source==="report"?" (report on file)":""}`}
                          style={{ position:"absolute", top:0, right:0, minWidth:26, height:22, padding:"0 6px", background:g.color, borderRadius:"0 12px 0 6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"white", fontWeight:900 }}>
                          {eff.score.toFixed(1)}
                        </div>
                      );
                    })()}

                    {isHov && isDeclined && (
                      <div style={{ borderTop:`1px solid ${sec.border}`, marginTop:6, paddingTop:6, fontSize:12, color:"#475569", display:"flex", flexDirection:"column", gap:4, position:"absolute", background:"white", zIndex:9999, borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", padding:"10px 12px", width:240, left:0, top:"100%" }}>
                        <div style={{ fontWeight:700, color:"#1E293B", marginBottom:4 }}>{bid.project}</div>
                        {bid.client && <div>Client: <b>{bid.client}</b></div>}
                        {bid.phone && <div>📞 {bid.phone}</div>}
                        <div>Due: <b>{bid.dueDate||"TBD"}</b></div>
                        {bid.scope && <div>{bid.scope}</div>}
                        {bid.estimator && <div>Est: <b>{bid.estimator}</b></div>}
                        {bid.declineReason && <div style={{ color:"#B91C1C", fontWeight:600 }}>Reason: {bid.declineReason}</div>}
                        {bid.notes && <div style={{ color:"#DC2626", fontWeight:600 }}>{bid.notes}</div>}
                        <div style={{ marginTop:4, textAlign:"center", color:sec.badge, fontWeight:700, fontSize:11 }}>Click for full details</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Estimator Summary ── */}
      {estSummary.length > 0 && (
        <div style={{ background:`linear-gradient(135deg,${BRAND.dark},${BRAND.dark2})`, borderRadius:18, padding:"20px 28px", marginTop:8, marginBottom:24, color:"white", boxShadow:`0 8px 32px rgba(0,0,0,0.3), 0 3px 0 ${BRAND.gold}` }}>
          <div style={{ fontSize:14, fontWeight:800, color:BRAND.gold, marginBottom:16 }}>📊 Estimator Summary</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
            {estSummary.map(e => (
              <div key={e.name} style={{ background:"rgba(255,255,255,0.10)", borderRadius:12, padding:"12px 18px", minWidth:160, border:`1px solid ${BRAND.gold}33` }}>
                <div style={{ fontSize:15, fontWeight:800, marginBottom:8, color:BRAND.gold }}>🧢 {e.name}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <div style={{ fontSize:12, opacity:0.85 }}>Total Bids: <b>{e.total}</b></div>
                  <div style={{ fontSize:12, opacity:0.85 }}>Pipeline: <b>{fmt(e.value)}</b></div>
                  <div style={{ fontSize:12, opacity:0.85 }}>Won Value: <b>{fmt(e.wonValue)}</b></div>
                  <div style={{ fontSize:12, opacity:0.85 }}>Won/Submitted: <b>{e.wonCount}/{e.submittedCount}</b></div>
                  <div style={{ fontSize:12, opacity:0.85 }}>Win Rate: <b style={{ color:e.winRate>=50?"#4ADE80":"#FCA5A5" }}>{e.submittedCount>0?e.winRate+"%":"—"}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:20, padding:30, maxWidth:580, width:"100%", boxShadow:"0 30px 70px rgba(0,0,0,0.25)", maxHeight:"90vh", overflowY:"auto" }}>
            <ModalErrorBoundary>
              <BidModal
                bid={selected}
                onClose={() => setSelected(null)}
                setSaveStatus={setSaveStatus}
                flash={flash}
                moveBid={requestMove}
                deleteBid={deleteBid}
                estimators={estimators}
              />
            </ModalErrorBoundary>
          </div>
        </div>
      )}

      {/* ── Add Bid Modal ── */}
      {addOpen && (
        <div onClick={() => setAddOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:20, padding:30, maxWidth:480, width:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 30px 70px rgba(0,0,0,0.25)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>Add New Bid</h2>
              <button onClick={() => { setAddOpen(false); setAddError(""); }} style={{ background:"#F1F5F9", border:"none", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:18, color:"#64748B" }}>✕</button>
            </div>
            {addError && (
              <div style={{ background:"#DC2626", color:"white", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:14, fontWeight:700, lineHeight:1.5, cursor:"pointer" }}
                onClick={() => setAddError("")}>
                {addError}
                <div style={{ fontSize:11, fontWeight:400, marginTop:4, opacity:0.85 }}>Tap to dismiss</div>
              </div>
            )}
            {bidFields.map(([l,k,t]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <label style={labelStyle}>{l}</label>
                <input type={t} placeholder={l} value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))} style={inputStyle} />
              </div>
            ))}
            <TurnkeyBox checked={form.turnkey} approxSF={parseFloat(form.approxSF)||0} onChange={() => setForm(p => ({...p,turnkey:!p.turnkey}))} />
            <EstimatorSelect value={form.estimator} onChange={e => setForm(p => ({...p,estimator:e.target.value}))} estimators={estimators} />

            {/* Add New Estimator */}
            <div style={{ marginBottom:16, background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>🧢 Manage Estimators</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                {estimators.map(e => (
                  <span key={e} style={{ background:"white", border:"1.5px solid #E2E8F0", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600, display:"inline-flex", alignItems:"center", gap:6 }}>
                    {e}
                    <button onClick={() => removeEstimator(e)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:13, padding:0, lineHeight:1 }}>✕</button>
                  </span>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={newEstimator} onChange={e => setNewEstimator(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && addEstimator()}
                  placeholder="New estimator name…" style={{ ...inputStyle, flex:1 }} />
                <button onClick={addEstimator} disabled={!newEstimator.trim() || estimators.includes(newEstimator.trim())}
                  style={{ background:BRAND.gold, color:BRAND.dark, border:"none", borderRadius:8, padding:"9px 16px", cursor:"pointer", fontWeight:800, fontSize:13, whiteSpace:"nowrap", opacity:(!newEstimator.trim()||estimators.includes(newEstimator.trim()))?0.5:1 }}>
                  + Add
                </button>
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Section</label>
              <select value={form.section} onChange={e => setForm(p => ({...p,section:e.target.value}))} style={inputStyle}>
                {sections.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setAddOpen(false)} style={{ flex:1, padding:"12px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", cursor:"pointer", fontWeight:600, color:"#64748B" }}>Cancel</button>
              <button onClick={addBid} style={{ flex:2, padding:"12px", borderRadius:10, border:"none", background:BRAND.gold, color:BRAND.dark, cursor:"pointer", fontWeight:800, fontSize:15 }}>Add Bid</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Decline Reason Modal ── */}
      {declinePrompt && (
        <div onClick={() => setDeclinePrompt(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:20, padding:30, maxWidth:420, width:"100%", boxShadow:"0 30px 70px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:32, marginBottom:10, textAlign:"center" }}>❌</div>
            <h2 style={{ margin:"0 0 8px", fontSize:18, fontWeight:800, textAlign:"center" }}>Reason for Declining?</h2>
            <p style={{ color:"#64748B", fontSize:13, marginBottom:20, textAlign:"center" }}>Required before moving this bid to Declined.</p>
            <label style={labelStyle}>Decline Reason <span style={{ color:"#DC2626" }}>*</span></label>
            <textarea
              autoFocus
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              placeholder="e.g. Budget too low, out of scope, lost to competitor…"
              style={{ ...inputStyle, height:90, resize:"vertical", lineHeight:1.5 }}
            />
            {!declineReason.trim() && <div style={{ fontSize:11, color:"#DC2626", marginTop:4, marginBottom:8 }}>A reason is required</div>}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={() => setDeclinePrompt(null)} style={{ flex:1, padding:"11px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", cursor:"pointer", fontWeight:600, color:"#64748B" }}>Cancel</button>
              <button onClick={confirmDecline} disabled={!declineReason.trim()}
                style={{ flex:2, padding:"11px", borderRadius:10, border:"none", background:declineReason.trim()?"#DC2626":"#E2E8F0", color:declineReason.trim()?"white":"#94A3B8", cursor:declineReason.trim()?"pointer":"not-allowed", fontWeight:700, fontSize:14 }}>
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Modal ── */}
      {showReset && (
        <div onClick={() => setShowReset(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:20, padding:32, maxWidth:380, width:"100%", textAlign:"center", boxShadow:"0 30px 70px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <h2 style={{ margin:"0 0 10px", fontSize:18, fontWeight:800 }}>Clear All Bids?</h2>
            <p style={{ color:"#64748B", fontSize:14, marginBottom:24 }}>This will permanently delete ALL bids from the shared database.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowReset(false)} style={{ flex:1, padding:"12px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", cursor:"pointer", fontWeight:600, color:"#64748B" }}>Cancel</button>
              <button onClick={async () => { await supabase.from("bids").delete().neq("id","none"); setShowReset(false); }} style={{ flex:1, padding:"12px", borderRadius:10, border:"none", background:"#DC2626", color:"white", cursor:"pointer", fontWeight:700 }}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <AppErrorBoundary><AppInner /></AppErrorBoundary>;
}
