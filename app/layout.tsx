import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanel Uganda",
  description: "Next.js with Tailwind v4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="big-white text-gray-900 antialiased">{children}</body>
    </html>
    <script src="https://eu1-config.doofinder.com/2.x/cd7a520b-3708-4bd7-ace3-67ed7a517b63.js" async></script>
  );
}