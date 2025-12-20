import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Rajdhani } from "next/font/google";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeatBrain.ai",
  description: "AI-Powered Music Creation from your voice",
  icons: {
    icon: '/BeatBrainHeadLogo.png',
  },
};

import { Navigation } from "@/components/Navigation";
import { MusicFactProvider } from "@/components/MusicFactContext";
import { GlobalMusicFactPopup } from "@/components/GlobalMusicFactPopup";
import { Toaster } from 'sonner';
import { getSecret } from "@/lib/secrets";
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = await getSecret("FIREBASE_API_KEY");

  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: "beatbrain-ai.firebaseapp.com",
    projectId: "beatbrain-ai",
    storageBucket: "beatbrain-ai.firebasestorage.app",
    messagingSenderId: "628954934544",
    appId: "1:628954934544:web:1e64400d98c5a10bf10995",
    measurementId: "G-BNQYSH7DK4"
  };

  // Initialize Firebase
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${rajdhani.variable} antialiased relative`}
        suppressHydrationWarning
      >
        <MantineProvider defaultColorScheme="dark">
          <MusicFactProvider>
            <Navigation />
            {children}
            <Toaster richColors position="top-center" theme="dark" />
            <GlobalMusicFactPopup />
          </MusicFactProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
