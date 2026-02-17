import type { Metadata } from "next";  // メタデータ型
import { Geist, Geist_Mono } from "next/font/google";  // フォント
import { Toaster } from "@/components/ui/sonner";  // トースト通知
import { TooltipProvider } from "@/components/ui/tooltip";  // ツールチップ
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",  // CSS カスタムプロパティ
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",  // モノスペースフォント
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitHub Issue Outliner",  // アプリタイトル
  description: "GitHub Issues をアウトライナーで直感的に管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
