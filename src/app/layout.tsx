import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import "@mantine/core/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jira Utils",
  description: "Utilities for managing Jira instances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      {...mantineHtmlProps}
    >
      <head>
        <ColorSchemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <MantineProvider>
          <Navbar />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
