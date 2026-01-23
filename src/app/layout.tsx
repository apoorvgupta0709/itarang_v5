import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });
// ... (metadata unchanged)

import Providers from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <AuthProvider>
          <Providers>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
