import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GHG Scope 3 Category 1 계산기 | 데모",
  description: "구매한 제품 및 서비스(Scope 3 Category 1)의 온실가스 배출량을 계산하세요. 무료 데모 버전입니다.",
  keywords: ["GHG", "Scope 3", "Category 1", "탄소 발자국", "배출량 계산", "온실가스", "구매 제품"],
  openGraph: {
    title: "GHG Scope 3 Category 1 계산기 | 데모",
    description: "구매한 제품 및 서비스의 온실가스 배출량을 계산하세요",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
