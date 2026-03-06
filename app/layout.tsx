import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdProvider from "@/components/providers/AntdProvider";
import AppLayout from "@/components/layout/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dokhaidev - Tích hợp thông minh, quản lý dễ dàng",
  description: "Tích hợp thông minh, quản lý dễ dàng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AntdProvider>
            <AppLayout>{children}</AppLayout>
          </AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
