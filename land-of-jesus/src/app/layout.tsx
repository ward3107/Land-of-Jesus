import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Land of Jesus — Where Christian heritage lives",
  description:
    "Discover the living Christian heritage of the Holy Land. Explore churches, sacred places and living Christian communities.",
};

// The root layout is intentionally minimal: <html>/<body> live in the
// [locale] layout so `lang`/`dir` and fonts can be locale-aware.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
