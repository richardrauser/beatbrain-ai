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

// ... existing imports ...

import { Toaster } from 'sonner';

// ... existing imports ...

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjF8lYxoSsPxxCQ5n0IOM7ok9v6Nelux0",
  authDomain: "beatbrain-ai.firebaseapp.com",
  projectId: "beatbrain-ai",
  storageBucket: "beatbrain-ai.firebasestorage.app",
  messagingSenderId: "628954934544",
  appId: "1:628954934544:web:1e64400d98c5a10bf10995",
  measurementId: "G-BNQYSH7DK4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// if (analytics.isSupported()) {
//   const analytics = getAnalytics(app);
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${rajdhani.variable} antialiased relative`}
      >
        <MantineProvider defaultColorScheme="dark">
          <Navigation />
          {children}
          <Toaster richColors position="top-center" theme="dark" />
        </MantineProvider>
      </body>
    </html>
  );
}
