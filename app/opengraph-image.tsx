import { ImageResponse } from "next/og";
import { siteConfig } from "./lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand logo badge as an inline SVG data URI (white badge, brand-blue library icon).
const logo = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="7" fill="#ffffff"/>
    <g transform="translate(7 7) scale(0.75)" stroke="#2a4d69" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>
    </g>
  </svg>`,
)}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "44px",
          padding: "80px",
          background: "linear-gradient(135deg, #2a4d69 0%, #1a354c 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={104} height={104} alt="" />
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#81b29a",
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 800,
            lineHeight: 1.12,
            maxWidth: "1000px",
          }}
        >
          Jamaican Acronyms & Abbreviations
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#adc2d2",
            maxWidth: "880px",
          }}
        >
          Search acronyms from across Jamaica — find out what they stand for.
        </div>
      </div>
    ),
    { ...size },
  );
}
