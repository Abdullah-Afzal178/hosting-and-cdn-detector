import { ImageResponse } from "next/og";

import { PAGE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const FLOW = ["www.bbc.co.uk", "4 records", "Fastly", "Fastly, Inc."];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          width: "100%",
          background: "#fbfaf8",
          padding: "56px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontSize: "24px",
              fontWeight: 800,
              color: "#57534e",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: "#f97316",
                color: "#ffffff",
                fontSize: "26px",
              }}
            >
              ⚡
            </div>
            {SITE_NAME}
          </div>

          <div
            style={{
              marginTop: "28px",
              fontSize: "68px",
              lineHeight: 1.03,
              fontWeight: 800,
              color: "#1c1917",
              maxWidth: "920px",
            }}
          >
            Which CDN does this site use?
          </div>
          <div
            style={{
              marginTop: "20px",
              fontSize: "24px",
              lineHeight: 1.4,
              color: "#78716c",
              maxWidth: "840px",
            }}
          >
            {PAGE_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {FLOW.map((step, index) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "14px",
                  border: index === 2 ? "3px solid #f97316" : "1px solid #e7e5e4",
                  background: "#ffffff",
                  padding: "18px 26px",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: index === 2 ? "#ea580c" : "#292524",
                }}
              >
                {step}
              </div>
              {index < FLOW.length - 1 ? (
                <div style={{ display: "flex", color: "#d6d3d1", fontSize: "28px" }}>→</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
