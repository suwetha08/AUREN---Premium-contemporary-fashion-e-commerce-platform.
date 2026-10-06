import type { Metadata } from "next";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { StoreProvider } from "../context/StoreContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "AUREN | Contemporary Fashion & Streetwear",
  description: "AUREN: Contemporary silhouettes. Refined essentials. Designed for everyday movement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased bg-[#101011] text-white">
        <StoreProvider>
          <Header />
          <main className="pt-[80px] min-h-screen">
            {children}
          </main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
