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
      <body>"big-white text-gray-900 antailiased"</body>
    </html>
  );
}