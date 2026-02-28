import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research KISSer",
  description: "Transform research papers into audience-specific presentations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
