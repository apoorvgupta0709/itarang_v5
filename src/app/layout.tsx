import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Injects global CSS styles (including Tailwind directives) across the entire application

// Authentication provider that wraps the app to manage user sessions and context
import { AuthProvider } from "@/components/auth/AuthProvider";

// Initialize the Inter font (from Google Fonts) which will be applied globally
const inter = Inter({ subsets: ["latin"] });

// ... (metadata unchanged)

// Custom Providers component that can bundle other global providers like React Query, ThemeProvider, etc.
import Providers from "@/components/Providers";

/**
 * RootLayout is the top-most component in the Next.js App Router hierarchy.
 * It is required in the `app` directory and must contain the `<html>` and `<body>` tags.
 * This layout wraps every single page and nested layout in the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the Inter font and ensure the body always takes at least the full viewport height */}
      <body className={`${inter.className} min-h-screen`}>
        {/* AuthProvider makes authentication state available to all child components */}
        <AuthProvider>
          {/* Providers component wraps the app in any additional global contexts */}
          <Providers>
            {/* 'children' represents the nested layout or page currently being rendered */}
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
