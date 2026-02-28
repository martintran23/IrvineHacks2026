import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealBreakr AI — Cross-Examine Any Listing",
  description:
    "AI-powered real estate due diligence. Extract claims, spot contradictions, and build your buyer war room before trusting any listing.",
  openGraph: {
    title: "DealBreakr AI",
    description: "Cross-examine any listing before you trust it.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen noise-bg grid-bg antialiased">
        {children}
      </body>
    </html>
  );
}
