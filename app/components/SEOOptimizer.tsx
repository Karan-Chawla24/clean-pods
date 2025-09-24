"use client";

import { useEffect } from "react";

interface SEOOptimizerProps {
  enableImageOptimization?: boolean;
  enableLazyLoading?: boolean;
  enablePreloading?: boolean;
}

export default function SEOOptimizer({
  enableImageOptimization = true,
  enableLazyLoading = true,
  enablePreloading = true,
}: SEOOptimizerProps) {
  useEffect(() => {
    if (enableImageOptimization) {
      // Add image optimization meta tags
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (!metaViewport) {
        const viewport = document.createElement("meta");
        viewport.name = "viewport";
        viewport.content = "width=device-width, initial-scale=1, viewport-fit=cover";
        document.head.appendChild(viewport);
      }

      // Add preload hints for critical images
      if (enablePreloading) {
        const criticalImages = [
          "/beadslogo.png",
          "/Home.jpg",
          "/pod_image.jpg"
        ];

        criticalImages.forEach((src) => {
          const existingPreload = document.querySelector(`link[rel="preload"][href="${src}"]`);
          if (!existingPreload) {
            const preload = document.createElement("link");
            preload.rel = "preload";
            preload.as = "image";
            preload.href = src;
            document.head.appendChild(preload);
          }
        });
      }

      // Add lazy loading support for older browsers
      if (enableLazyLoading && "loading" in HTMLImageElement.prototype === false) {
        // Fallback for browsers that don't support native lazy loading
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/vanilla-lazyload@17.8.3/dist/lazyload.min.js";
        script.onload = () => {
          // @ts-expect-error - LazyLoad is loaded dynamically from CDN
          new LazyLoad({
            elements_selector: "img[data-src]",
            class_loaded: "loaded",
            class_error: "error"
          });
        };
        document.head.appendChild(script);
      }
    }

    // Add performance monitoring
    if (typeof window !== "undefined" && "performance" in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            console.log("LCP:", entry.startTime);
          }
          if (entry.entryType === "first-input") {
            const fidEntry = entry as any; // Type assertion for FID entry
            console.log("FID:", fidEntry.processingStart - fidEntry.startTime);
          }
          if (entry.entryType === "layout-shift") {
            const clsEntry = entry as any; // Type assertion for CLS entry
            if (!clsEntry.hadRecentInput) {
              console.log("CLS:", clsEntry.value);
            }
          }
        }
      });

      observer.observe({ entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"] });
    }
  }, [enableImageOptimization, enableLazyLoading, enablePreloading]);

  return null; // This component doesn't render anything
}

// Utility function to generate responsive image sizes
export function generateImageSizes(breakpoints: { [key: string]: number }) {
  return Object.entries(breakpoints)
    .map(([breakpoint, width]) => `(max-width: ${breakpoint}) ${width}px`)
    .join(", ");
}

// Utility function to generate blur data URL for placeholder
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  
  if (ctx) {
    // Create a simple gradient blur placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#f3f4f6");
    gradient.addColorStop(1, "#e5e7eb");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL();
}

// SEO Image Guidelines Component
export function SEOImageGuidelines() {
  return (
    <div className="hidden">
      {/* 
        SEO Image Optimization Guidelines:
        
        1. Alt Text Best Practices:
           - Be descriptive and specific
           - Include relevant keywords naturally
           - Keep under 125 characters
           - Don't start with "Image of" or "Picture of"
           
        2. File Naming:
           - Use descriptive, keyword-rich filenames
           - Use hyphens instead of underscores
           - Keep filenames concise but descriptive
           
        3. Image Formats:
           - Use WebP for modern browsers with JPEG fallback
           - Use SVG for logos and simple graphics
           - Optimize file sizes without compromising quality
           
        4. Responsive Images:
           - Use Next.js Image component with proper sizes
           - Implement lazy loading for below-the-fold images
           - Use priority loading for above-the-fold images
           
        5. Structured Data:
           - Include image URLs in product schema
           - Add image metadata for rich snippets
           - Use proper image dimensions in schema
      */}
    </div>
  );
}