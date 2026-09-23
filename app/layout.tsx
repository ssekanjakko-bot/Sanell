import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanel Uganda - Quality Shopping in Uganda",
  description: "Shop quality products at Sanel Uganda",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <head>
 <script src="https://eu1-config.doofinder.com/2.x/cd7a520b-3708-4bd7-ace3-67ed7a517b63.js" async></script>
 </head>
      <body className="big-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}