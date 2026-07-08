import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quizly",
  description: "Modern quiz platform dashboard",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
