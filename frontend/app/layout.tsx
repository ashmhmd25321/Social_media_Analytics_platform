import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SkipToContent } from "@/components/common/SkipToContent";
import AppFrame from "@/components/layout/AppFrame";

export const metadata: Metadata = {
  title: "MetricPulse - Social Media Analytics Platform",
  description: "Track, analyze, and grow your social media presence across all platforms with real-time analytics and actionable insights.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body>
        <SkipToContent />
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
