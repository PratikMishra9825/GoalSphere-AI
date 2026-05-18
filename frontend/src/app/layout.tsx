import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/contexts/SocketContext";
import { GoogleProvider } from "@/components/providers/GoogleProvider";
import { FetchInterceptor } from "@/components/providers/FetchInterceptor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ATOMQUEST GoalSphere",
  description: "AI-powered In-House Goal Setting & Performance Tracking Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.className} bg-background text-foreground min-h-screen antialiased`}
      >
        <FetchInterceptor />
        <GoogleProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </GoogleProvider>
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
