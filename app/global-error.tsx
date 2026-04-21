"use client";

import { useEffect, type CSSProperties } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

const bodyStyle: CSSProperties = {
  margin: 0,
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "48px 16px",
  backgroundColor: "#15191D",
  color: "#FFFFFF",
  fontFamily: "Inter, system-ui, sans-serif",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  display: "grid",
  gap: "12px",
  justifyItems: "center",
  textAlign: "center",
  padding: "24px",
  border: "1px solid #2E3841",
  borderRadius: "15px",
  backgroundColor: "#1E2428",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.16)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 600,
};

const messageStyle: CSSProperties = {
  margin: 0,
  color: "#7B8996",
  fontSize: "14px",
  lineHeight: 1.5,
};

const actionStyle: CSSProperties = {
  marginTop: "4px",
  padding: "8px 16px",
  border: 0,
  borderRadius: "8px",
  backgroundColor: "#242B32",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={bodyStyle}>
        <title>Something went wrong | Polymarket Clone</title>
        <main style={cardStyle}>
          <h1 style={titleStyle}>Something went wrong</h1>
          <p style={messageStyle}>
            The app shell failed to render. Try the request again to recover.
          </p>
          <button
            type="button"
            style={actionStyle}
            onClick={() => unstable_retry()}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
