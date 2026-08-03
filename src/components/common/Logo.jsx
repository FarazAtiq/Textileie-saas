/**
 * Shared TextileIE mark — a woven/interlacing thread motif rendered
 * as clean vector line art, replacing the 🧵 emoji used previously.
 * Used on the landing page nav and the login/register page so the
 * brand mark is identical everywhere rather than drifting between
 * an emoji in one place and something else elsewhere.
 */
export default function Logo({ size = 34, radius, showWordmark = false, dark = false }) {
  const r = radius ?? Math.round(size * 0.28);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="img"
        aria-label="TextileIE"
      >
        <defs>
          <linearGradient id="tie-badge" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#12988A" />
            <stop offset="1" stopColor="#0B6659" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="40" height="40" rx={r} fill="url(#tie-badge)" />
        <path
          d="M9 14 C 16 14, 16 26, 23 26 C 27 26, 29 22, 31 22"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M9 26 C 16 26, 16 14, 23 14 C 27 14, 29 18, 31 18"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {showWordmark && (
        <span style={{
          fontWeight: 700,
          fontSize: Math.round(size * 0.47),
          letterSpacing: "-0.01em",
          color: dark ? "var(--navy)" : "white",
        }}>
          TextileIE
        </span>
      )}
    </div>
  );
}
