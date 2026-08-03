import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scissors, Ruler, Layers, Gauge, Timer, Boxes, Calculator, Package,
  BarChart3, ShieldCheck, Factory, Check, ChevronDown, Menu, X,
} from "lucide-react";
import { PLANS } from "../components/customer-onboarding/steps/SubscriptionStep.jsx";
import { MODULE_KEYS, submitDemoRequest } from "../lib/db.js";
import Logo from "../components/common/Logo.jsx";

const MODULE_COPY = {
  styles: { icon: Ruler, title: "Style Master", desc: "Centralize every style, BOM, and cost sheet in one workspace." },
  fabric_master: { icon: Layers, title: "Fabric Master", desc: "Standardize fabric specs so engineering and sourcing agree." },
  thread_master: { icon: Boxes, title: "Thread Master", desc: "One source of truth for thread types, counts, and consumption." },
  stitch_master: { icon: Scissors, title: "Stitch Master", desc: "Reference stitch classes and SPI without re-typing them per style." },
  smv: { icon: Timer, title: "SMV Engineering", desc: "Build and defend standard minute values, operation by operation." },
  efficiency: { icon: Gauge, title: "Line Efficiency", desc: "Track operator and line efficiency against your own SMV data." },
  capacity: { icon: Factory, title: "Capacity Planning", desc: "Plan production against real line capacity, not guesswork." },
  costing: { icon: Calculator, title: "Garment Costing", desc: "CMT and FOB costing that ties directly back to your BOMs." },
  export_orders: { icon: Package, title: "Export Orders", desc: "Track purchase orders, colors, and sizes through to shipment." },
  reports: { icon: BarChart3, title: "Reports & Dashboards", desc: "See efficiency, cost, and order status without exporting to Excel." },
};
const FEATURED_MODULE_KEYS = ["styles","fabric_master","smv","efficiency","capacity","costing","export_orders","reports"]
  .filter((k) => MODULE_KEYS.includes(k));

const FACTORY_TYPES = [
  { name: "Garment", desc: "Cut-and-sew apparel manufacturers running multi-line production." },
  { name: "Textile", desc: "Woven and knit fabric mills managing engineering and QA." },
  { name: "Composite", desc: "Vertically integrated groups spanning fabric through finished garment." },
];

const FAQ = [
  { q: "Is TextileIE built for a specific factory type?", a: "TextileIE is built around garment and textile manufacturing workflows specifically — SMV, line balancing, fabric/thread consumption, and garment costing — rather than being a generic ERP with textile fields bolted on." },
  { q: "Do I need to talk to sales to start?", a: "No — register and you get an automatic 30-day trial workspace with a default factory and departments already set up, ready to use immediately." },
  { q: "What happens when my trial ends?", a: "Your workspace switches to read-only. Nothing is deleted. You can contact our sales team any time to activate a paid subscription and pick up exactly where you left off." },
  { q: "Can I manage more than one factory?", a: "Yes — Professional and Enterprise plans support multiple factories under one company workspace, each with their own departments and users." },
];

function NavBar({ onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { label: "Features", href: "#features" },
    { label: "Solutions", href: "#solutions" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(15,41,66,0.92)", backdropFilter: "blur(8px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={34} />
          <span style={{ color: "white", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>TextileIE</span>
        </div>

        <nav style={{ display: "flex", gap: 28 }} className="landing-nav-links">
          {links.map((l) => (
            <a key={l.href} href={l.href} style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 10 }} className="landing-nav-actions">
          <button onClick={() => onNavigate("/login")} style={{
            background: "none", border: "1px solid rgba(255,255,255,0.25)", color: "white",
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            Sign in
          </button>
          <button onClick={() => onNavigate("/login?mode=register")} style={{
            background: "var(--teal)", border: "none", color: "white",
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            Start free trial
          </button>
        </div>

        <button className="landing-nav-toggle" onClick={() => setMobileOpen((o) => !o)} style={{ display: "none", background: "none", border: "none", color: "white" }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, textDecoration: "none" }}>
              {l.label}
            </a>
          ))}
          <button onClick={() => onNavigate("/login")} className="btn btn-secondary">Sign in</button>
          <button onClick={() => onNavigate("/login?mode=register")} className="btn btn-primary">Start free trial</button>
        </div>
      )}

      <style>{`
        @media (max-width: 760px) {
          .landing-nav-links, .landing-nav-actions { display: none !important; }
          .landing-nav-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

function StitchDivider() {
  return (
    <div aria-hidden="true" style={{
      height: 1, margin: "0 auto", maxWidth: 1180,
      borderTop: "2px dashed rgba(15,41,66,0.14)",
    }} />
  );
}

function DemoRequestModal({ onClose }) {
  const [form, setForm] = useState({ full_name: "", email: "", company_name: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("working");
    setError("");
    try {
      await submitDemoRequest(form);
      setStatus("done");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Request a demo"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(15,41,66,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 440, width: "100%", padding: 28, position: "relative" }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
        >
          <X size={20} />
        </button>

        {status === "done" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Check size={32} color="var(--teal-dark)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 17 }}>Thanks — we've got it.</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 8 }}>
              Someone from TextileIE will reach out to schedule your demo shortly.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>Request a demo</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
              Tell us a bit about your factory and we'll walk you through TextileIE live.
            </p>
            <form onSubmit={submit}>
              <div className="field">
                <label>Full name *</label>
                <input value={form.full_name} onChange={set("full_name")} required />
              </div>
              <div className="field">
                <label>Work email *</label>
                <input type="email" value={form.email} onChange={set("email")} required />
              </div>
              <div className="field">
                <label>Company / factory name</label>
                <input value={form.company_name} onChange={set("company_name")} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={form.phone} onChange={set("phone")} />
              </div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>What would you like to see?</label>
                <textarea rows={3} value={form.message} onChange={set("message")} placeholder="Optional" />
              </div>

              {status === "error" && (
                <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "var(--red-light)", borderRadius: 8 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={status === "working"}>
                {status === "working" ? "Sending..." : "Request demo"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [billing, setBilling] = useState("monthly");
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <NavBar onNavigate={navigate} />

      <section style={{
        background: "linear-gradient(135deg, #0F2942 0%, #1A3A5C 55%, #0D3D35 100%)",
        padding: "76px 20px 90px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-block", padding: "5px 14px", borderRadius: 20,
            background: "rgba(255,255,255,0.08)", color: "var(--teal-mid)",
            fontSize: 12, fontWeight: 600, marginBottom: 20, letterSpacing: "0.02em",
          }}>
            Built for garment &amp; textile manufacturers
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            The industrial engineering workspace<br />your factory floor actually runs on.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, marginTop: 20, lineHeight: 1.6 }}>
            SMV, line efficiency, capacity, and garment costing — connected to the same
            styles, fabrics, and export orders your team already works with. No generic
            ERP fields standing in for textile terms.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/login?mode=register")} className="btn btn-primary" style={{ padding: "12px 24px", fontSize: 14 }}>
              Start free 30-day trial
            </button>
            <button onClick={() => setShowDemoModal(true)} className="btn btn-secondary" style={{ padding: "12px 24px", fontSize: 14, background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
              Request a demo
            </button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 16 }}>
            No credit card required · Full access during your trial
          </p>
        </div>
      </section>

      <section id="features" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div className="eyebrow" style={{ color: "var(--teal-dark)" }}>What's inside</div>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>Engineering tools built around textile work</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 8, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            Every module below is live in the product today — this isn't a roadmap.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
          {FEATURED_MODULE_KEYS.map((key) => {
            const mod = MODULE_COPY[key];
            const Icon = mod.icon;
            return (
              <div key={key} className="card" style={{ padding: 24 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, background: "var(--teal-light)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                }}>
                  <Icon size={20} color="var(--teal-dark)" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>{mod.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{mod.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <StitchDivider />

      <section id="solutions" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div className="eyebrow" style={{ color: "var(--teal-dark)" }}>Industry solutions</div>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>Wherever your factory sits in the chain</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
          {FACTORY_TYPES.map((f) => (
            <div key={f.name} className="card" style={{ padding: 24 }}>
              <Factory size={22} color="var(--teal-dark)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>{f.name}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <StitchDivider />

      <section id="pricing" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="eyebrow" style={{ color: "var(--teal-dark)" }}>Pricing</div>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>Start free. Scale when you're ready.</h2>
          <div style={{ display: "inline-flex", marginTop: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 4 }}>
            {["monthly", "annual"].map((cycle) => (
              <button key={cycle} onClick={() => setBilling(cycle)} style={{
                border: "none", padding: "7px 18px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: billing === cycle ? "var(--teal)" : "transparent",
                color: billing === cycle ? "white" : "var(--text-secondary)",
              }}>
                {cycle === "monthly" ? "Monthly" : "Annual"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 20 }}>
          {PLANS.map((plan) => {
            const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div key={plan.id} className="card" style={{
                padding: 28, position: "relative",
                border: plan.recommended ? "2px solid var(--teal)" : "1px solid var(--border)",
              }}>
                {plan.recommended && (
                  <div style={{
                    position: "absolute", top: -12, left: 24, background: "var(--teal)", color: "white",
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  }}>MOST POPULAR</div>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>{plan.name}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6, minHeight: 36 }}>{plan.description}</p>
                <div style={{ marginTop: 16, marginBottom: 20 }}>
                  {price == null ? (
                    <span style={{ fontSize: 26, fontWeight: 700 }}>Custom</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 30, fontWeight: 700 }}>${price}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                        /{billing === "annual" ? "year" : "month"}
                      </span>
                    </>
                  )}
                </div>
                <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
                      <Check size={15} color="var(--teal-dark)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                {plan.id === "enterprise" ? (
                  <a href="#contact" className="btn btn-secondary btn-full" style={{ display: "block", textAlign: "center" }}>
                    Contact sales
                  </a>
                ) : (
                  <button
                    className={plan.recommended ? "btn btn-primary btn-full" : "btn btn-secondary btn-full"}
                    onClick={() => navigate("/login?mode=register")}
                  >
                    Start free trial
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <StitchDivider />

      <section id="faq" style={{ maxWidth: 760, margin: "0 auto", padding: "72px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="eyebrow" style={{ color: "var(--teal-dark)" }}>FAQ</div>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>Questions we hear the most</h2>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {FAQ.map((item, i) => (
            <div key={item.q} className="card" style={{ padding: "18px 20px", cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 14 }}>{item.q}</strong>
                <ChevronDown size={18} style={{ transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
              </div>
              {openFaq === i && (
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="contact" style={{ background: "var(--navy)", padding: "64px 20px", textAlign: "center" }}>
        <ShieldCheck size={28} color="var(--teal-mid)" style={{ marginBottom: 16 }} />
        <h2 style={{ color: "white", fontSize: 26 }}>Ready to see it on your own factory data?</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 10, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Start a free trial in minutes, or talk to us first — either way, your data stays yours.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/login?mode=register")} className="btn btn-primary" style={{ padding: "12px 24px" }}>
            Start free trial
          </button>
          <a href="mailto:support@textileie.com" className="btn btn-secondary" style={{ padding: "12px 24px", background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
            Email us
          </a>
          <a href="https://wa.me/923253272020" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "12px 24px", background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
            WhatsApp
          </a>
        </div>
      </section>

      <footer style={{ padding: "32px 20px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
          © {new Date().getFullYear()} TextileIE. Built for the textile and apparel industry.
        </p>
      </footer>

      {showDemoModal && <DemoRequestModal onClose={() => setShowDemoModal(false)} />}
    </div>
  );
}
