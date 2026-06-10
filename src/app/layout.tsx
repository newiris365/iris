import type { Metadata } from "next";
import "./globals.css";
import AIChatWidget from "../components/AIChatWidget";

export const metadata: Metadata = {
  title: "IRIS 365 | Next-Gen Campus Operating System",
  description: "AI-powered automation platform for modern educational institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0D0A1A] text-white antialiased font-sans selection:bg-[#6C2BD9]">
        {children}
        <AIChatWidget />
      </body>
    </html>
  );
}
