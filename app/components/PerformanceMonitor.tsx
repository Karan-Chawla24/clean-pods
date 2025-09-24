"use client";

import { useEffect, useState } from "react";

interface WebVitalsMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

interface PerformanceMonitorProps {
  enableReporting?: boolean;
  enableConsoleLogging?: boolean;
  enableOptimizations?: boolean;
}

export default function PerformanceMonitor({
  enableReporting = true,
  enableConsoleLogging = false,
  enableOptimizations = true,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({});

  useEffect(() => {
    if (!enableReporting) return;

    // Core Web Vitals monitoring
    const observeWebVitals = () => {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        
        setMetrics(prev => ({ ...prev, lcp }));
        
        if (enableConsoleLogging) {
          console.log("LCP:", lcp, lcp > 2500 ? "❌ Poor" : lcp > 1200 ? "⚠️ Needs Improvement" : "✅ Good");
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any; // Type assertion for FID entry
          const fid = fidEntry.processingStart - fidEntry.startTime;
          
          setMetrics(prev => ({ ...prev, fid }));
          
          if (enableConsoleLogging) {
            console.log("FID:", fid, fid > 300 ? "❌ Poor" : fid > 100 ? "⚠️ Needs Improvement" : "✅ Good");
          }
        }
      });
      fidObserver.observe({ entryTypes: ["first-input"] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any; // Type assertion for CLS entry
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
          }
        }
        
        setMetrics(prev => ({ ...prev, cls: clsValue }));
        
        if (enableConsoleLogging) {
          console.log("CLS:", clsValue, clsValue > 0.25 ? "❌ Poor" : clsValue > 0.1 ? "⚠️ Needs Improvement" : "✅ Good");
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === "first-contentful-paint");
        if (fcpEntry) {
          const fcp = fcpEntry.startTime;
          
          setMetrics(prev => ({ ...prev, fcp }));
          
          if (enableConsoleLogging) {
            console.log("FCP:", fcp, fcp > 3000 ? "❌ Poor" : fcp > 1800 ? "⚠️ Needs Improvement" : "✅ Good");
          }
        }
      });
      fcpObserver.observe({ entryTypes: ["paint"] });

      // Time to First Byte (TTFB)
      const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        
        setMetrics(prev => ({ ...prev, ttfb }));
        
        if (enableConsoleLogging) {
          console.log("TTFB:", ttfb, ttfb > 800 ? "❌ Poor" : ttfb > 200 ? "⚠️ Needs Improvement" : "✅ Good");
        }
      }
    };

    // Performance optimizations
    if (enableOptimizations) {
      // Preload critical resources
      const preloadCriticalResources = () => {
        const criticalResources = [
          { href: "/beadslogo.png", as: "image" },
          { href: "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css", as: "style" },
        ];

        criticalResources.forEach(({ href, as }) => {
          const existingPreload = document.querySelector(`link[rel="preload"][href="${href}"]`);
          if (!existingPreload) {
            const link = document.createElement("link");
            link.rel = "preload";
            link.href = href;
            link.as = as;
            if (as === "style") {
              link.onload = () => {
                link.rel = "stylesheet";
              };
            }
            document.head.appendChild(link);
          }
        });
      };

      // Optimize images
      const optimizeImages = () => {
        const images = document.querySelectorAll("img");
        images.forEach((img) => {
          // Add loading="lazy" to images below the fold
          if (!img.hasAttribute("loading") && !img.hasAttribute("priority")) {
            const rect = img.getBoundingClientRect();
            if (rect.top > window.innerHeight) {
              img.setAttribute("loading", "lazy");
            }
          }

          // Add proper dimensions to prevent layout shift
          if (!img.hasAttribute("width") || !img.hasAttribute("height")) {
            img.addEventListener("load", () => {
              if (!img.hasAttribute("width")) {
                img.setAttribute("width", img.naturalWidth.toString());
              }
              if (!img.hasAttribute("height")) {
                img.setAttribute("height", img.naturalHeight.toString());
              }
            });
          }
        });
      };

      // Resource hints
      const addResourceHints = () => {
        const hints = [
          { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
          { rel: "dns-prefetch", href: "//cdn.jsdelivr.net" },
          { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
        ];

        hints.forEach(({ rel, href, crossorigin }) => {
          const existingHint = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
          if (!existingHint) {
            const link = document.createElement("link");
            link.rel = rel;
            link.href = href;
            if (crossorigin) {
              link.crossOrigin = crossorigin;
            }
            document.head.appendChild(link);
          }
        });
      };

      preloadCriticalResources();
      optimizeImages();
      addResourceHints();

      // Re-run image optimization when new images are added
      const observer = new MutationObserver(() => {
        optimizeImages();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }

    // Start monitoring after a short delay to ensure page is loaded
    const timer = setTimeout(observeWebVitals, 1000);

    return () => clearTimeout(timer);
  }, [enableReporting, enableConsoleLogging, enableOptimizations]);

  // Development mode performance insights
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && enableConsoleLogging) {
      const logPerformanceInsights = () => {
        console.group("🚀 Performance Insights");
        
        if (metrics.lcp) {
          console.log(`LCP: ${metrics.lcp.toFixed(2)}ms ${metrics.lcp > 2500 ? "❌" : metrics.lcp > 1200 ? "⚠️" : "✅"}`);
        }
        
        if (metrics.fid) {
          console.log(`FID: ${metrics.fid.toFixed(2)}ms ${metrics.fid > 300 ? "❌" : metrics.fid > 100 ? "⚠️" : "✅"}`);
        }
        
        if (metrics.cls) {
          console.log(`CLS: ${metrics.cls.toFixed(3)} ${metrics.cls > 0.25 ? "❌" : metrics.cls > 0.1 ? "⚠️" : "✅"}`);
        }
        
        if (metrics.fcp) {
          console.log(`FCP: ${metrics.fcp.toFixed(2)}ms ${metrics.fcp > 3000 ? "❌" : metrics.fcp > 1800 ? "⚠️" : "✅"}`);
        }
        
        if (metrics.ttfb) {
          console.log(`TTFB: ${metrics.ttfb.toFixed(2)}ms ${metrics.ttfb > 800 ? "❌" : metrics.ttfb > 200 ? "⚠️" : "✅"}`);
        }
        
        console.groupEnd();
      };

      const timer = setTimeout(logPerformanceInsights, 3000);
      return () => clearTimeout(timer);
    }
  }, [metrics, enableConsoleLogging]);

  return null; // This component doesn't render anything
}

// Performance optimization utilities
export const performanceUtils = {
  // Lazy load component
  lazyLoad: (callback: () => void, threshold = 0.1) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    return observer;
  },

  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  // Get connection quality
  getConnectionQuality: () => {
    // @ts-expect-error - Navigator connection API is not fully standardized
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  },
};