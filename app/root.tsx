import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { useCursorTrail } from "./lib/hooks/useCursorTrail";
import { useRareEvents } from "./lib/hooks/useRareEvents";
import { NightSky } from "./lib/components/NightSky";
import { BarnLight } from "./lib/components/BarnLight";
import { GardenShadows } from "./lib/components/GardenShadows";
import { EyeInCorner } from "./lib/components/RareEvents/EyeInCorner";
import { BackgroundBlur } from "./lib/components/RareEvents/BackgroundBlur";
import { Toaster } from "sonner";
import { CartProvider } from "./lib/contexts/CartContext";
import { Header } from "./lib/components/Header";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Fredoka:wght@300..700&family=Creepster&family=Handjet:wght@500;600;700;800&display=swap",
  },
  { rel: "icon", type: "image/svg+xml", href: "/cr-favicon.svg" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* SVG Filter Definitions for Drip Effect */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
          <defs>
            <filter id="drip-filter" x="-50%" y="-50%" width="200%" height="200%">
              {/* Dilate the text to create thickness (reduced for subtlety) */}
              <feMorphology operator="dilate" radius="1.5" in="SourceAlpha" result="dilated"/>
              {/* Blur for organic drip effect (reduced from 2 to 1) */}
              <feGaussianBlur stdDeviation="1" in="dilated" result="blurred"/>
              {/* Offset downward to create drip (reduced from 6 to 3) */}
              <feOffset dy="3" in="blurred" result="offsetBlur"/>
              {/* Composite original text over drip */}
              <feComposite in="SourceGraphic" in2="offsetBlur" operator="over"/>
            </filter>
          </defs>
        </svg>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '2px solid rgba(74, 50, 88, 0.5)',
              color: '#F5F5DC',
            },
            className: 'sonner-toast',
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Enable cursor trail effect (environmental horror layer)
  useCursorTrail();

  // Rare events system (1% chance on navigation) - Phase 1.5
  const rareEvent = useRareEvents();

  return (
    <CartProvider>
      {/* Environmental Horror Layer - Phase 1.3 */}
      <NightSky />
      <BarnLight />
      <GardenShadows />

      {/* Rare Events - Phase 1.5 */}
      <EyeInCorner show={rareEvent === 'eye'} />
      <BackgroundBlur show={rareEvent === 'darken'} />

      {/* Main app content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Header />
        <Outlet />
      </div>
    </CartProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "The Ranch Encountered an Issue...";
  let details = "Something unexpected happened in the colony.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Lost in the Ranch" : "The Ranch Encountered an Issue";
    details =
      error.status === 404
        ? "This path doesn't exist in the ranch. The caterpillars must have moved it."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="drip-text text-4xl mb-4">{message}</h1>
      <p className="text-lg mb-4">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto bg-ranch-purple/20 rounded-lg">
          <code className="text-base">{stack}</code>
        </pre>
      )}
    </main>
  );
}
