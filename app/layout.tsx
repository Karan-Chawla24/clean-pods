import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";
import { ClerkProvider } from "@clerk/nextjs";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BubbleBeads - Premium Laundry Detergent Pods",
  description:
    "Revolutionary laundry detergent pods for modern households. Clean, fresh, and effortless laundry experience.",
  keywords:
    "laundry detergent, detergent pods, cleaning products, household cleaning",
  authors: [{ name: "BubbleBeads" }],
  icons: {
    icon: "/beadslogo.ico",
    shortcut: "/beadslogo.ico",
    apple: "/beadslogo.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen`}
      >
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          telemetry={false}
        >
          {children}
          <ToastProvider />
        </ClerkProvider>
      </body>
    </html>
  );
}
