import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SkipToContent } from "@/components/common/SkipToContent";
import AppFrame from "@/components/layout/AppFrame";

export const metadata: Metadata = {
  title: "MetricPulse - Social Media Analytics Platform",
  description: "Track, analyze, and grow your social media presence across all platforms with real-time analytics and actionable insights.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SkipToContent />
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
