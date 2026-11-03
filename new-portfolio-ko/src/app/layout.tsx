import type { Metadata } from "next";
import "./globals.css";
import "../styles/animations.css";

export const metadata: Metadata = {
  title: "Michael Cecilio | ORBITAL",
  description:
    "A portfolio universe of AI engineering, creative development, and interactive projects by Michael Cecilio.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
