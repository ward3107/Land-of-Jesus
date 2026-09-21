import type { Metadata } from "next";
import { EB_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Land of Jesus — Where Christian heritage lives",
  description: "Discover the living Christian heritage of the Holy Land. Explore churches, sacred places and living Christian communities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
