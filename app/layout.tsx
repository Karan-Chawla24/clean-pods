import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { OrganizationSchema, WebsiteSchema } from "./components/StructuredData";
import SEOOptimizer from "./components/SEOOptimizer";
import PerformanceMonitor from "./components/PerformanceMonitor";

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
  title: {
    default: "BubbleBeads - Premium Laundry Detergent Pods | Revolutionary Cleaning Solutions",
    template: "%s | BubbleBeads"
  },
  description:
    "Revolutionary laundry detergent pods for modern households. Premium cleaning solutions with eco-friendly ingredients. Clean, fresh, and effortless laundry experience with BubbleBeads.",
  keywords: [
    "laundry detergent pods",
    "premium detergent",
    "eco-friendly cleaning",
    "household cleaning products",
    "laundry solutions",
    "detergent capsules",
    "washing pods",
    "cleaning supplies",
    "fabric care",
    "stain removal"
  ],
  authors: [{ name: "BubbleBeads", url: "https://bubblebeads.in" }],
  creator: "BubbleBeads",
  publisher: "BubbleBeads",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://bubblebeads.in'),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "BubbleBeads - Premium Laundry Detergent Pods",
    description: "Revolutionary laundry detergent pods for modern households. Premium cleaning solutions with eco-friendly ingredients.",
    siteName: "BubbleBeads",
    images: [
      {
        url: "/beadslogo.jpg",
        width: 1200,
        height: 630,
        alt: "BubbleBeads - Premium Laundry Detergent Pods",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BubbleBeads - Premium Laundry Detergent Pods",
    description: "Revolutionary laundry detergent pods for modern households. Premium cleaning solutions with eco-friendly ingredients.",
    images: ["/beadslogo.jpg"],
    creator: "@bubblebeads",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/beadslogo.ico" },
      { url: "/beadslogo.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/beadslogo.ico",
    apple: [
      { url: "/beadslogo.png" },
      { url: "/beadslogo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen`}
      >
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          telemetry={false}
        >
          <Script 
            src="https://mercury.phonepe.com/web/bundle/checkout.js"
            strategy="beforeInteractive"
          />
          <OrganizationSchema
            name="BubbleBeads"
            url={process.env.NEXT_PUBLIC_BASE_URL || "https://bubblebeads.in"}
            logo={`${process.env.NEXT_PUBLIC_BASE_URL || "https://bubblebeads.in"}/beadslogo.jpg`}
            description="Revolutionary laundry detergent pods for modern households. Premium cleaning solutions with eco-friendly ingredients."
            contactPoint={{
              telephone: "+91-XXXXXXXXXX",
              contactType: "Customer Service",
              email: "support@bubblebeads.in"
            }}
            sameAs={[
              "https://www.facebook.com/bubblebeads",
              "https://www.instagram.com/bubblebeads",
              "https://twitter.com/bubblebeads"
            ]}
          />
          <WebsiteSchema />
          <SEOOptimizer 
            enableImageOptimization={true}
            enableLazyLoading={true}
            enablePreloading={true}
          />
          <PerformanceMonitor 
            enableReporting={true}
            enableConsoleLogging={process.env.NODE_ENV === "development"}
            enableOptimizations={true}
          />
          {children}
          <ToastProvider />
        </ClerkProvider>
      </body>
    </html>
  );
}
