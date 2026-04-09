import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/components/AntdProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classly — 학부모 소통을 더 쉽게",
  description: "AI가 학부모 상담 메시지를 대신 써드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">
        <AntdRegistry>
          <AntdProvider>{children}</AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
