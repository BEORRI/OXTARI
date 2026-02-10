import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oxtari Assistant",
  description: "The GoldenRAGtriever",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-amiri overflow-x-hidden">
      <link rel="icon" href="icon.ico" />
      <link rel="icon" href="static/icon.ico" />
      <body className="font-amiri overflow-x-hidden">{children}</body>
    </html>
  );
}
