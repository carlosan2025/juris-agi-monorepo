import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ActiveContextProvider } from "@/contexts/ActiveContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "JURIS-AGI | VC Decision Intelligence",
  description: "Evidence-based VC investment decision analysis with counterfactual reasoning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <ActiveContextProvider>
          {children}
        </ActiveContextProvider>
      </body>
    </html>
  );
}
