/**
 * Footer Component
 *
 * Site-wide footer with:
 * - Brand/tagline
 * - Newsletter signup
 * - Contact and policy links
 * - Social media icons + admin link
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { Instagram } from 'lucide-react';
import { ContactModal } from './ContactModal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { SOCIAL_LINKS } from '~/lib/constants/social';

interface NewsletterResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// Custom TikTok icon (Lucide doesn't have it)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    // Client-side email validation (matches backend regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });

      const data = await response.json() as NewsletterResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      toast.success(data.message);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <footer
        className="mt-16 border-t-2 footer-border bg-[#2d1f3a]/50 backdrop-blur-sm"
        style={{
          borderTopColor: '#4A3258',
          animation: 'flicker-border 12s infinite',
        }}
      >
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
          {/* Desktop: Single Row Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Section 1: Brand (25%) */}
            <div className="flex flex-col items-center md:items-start">
              <div
                className="footer-logo"
                style={{ animation: 'breathe-footer 5s ease-in-out infinite' }}
              >
                <span
                  className="text-2xl text-[#FF1493] block"
                  style={{ fontFamily: 'Creepster, cursive' }}
                >
                  Caterpillar Rancch
                </span>
              </div>
              <p
                className="text-sm text-[#9B8FB5] mt-2"
                style={{ fontFamily: 'Handjet, monospace', fontWeight: 600 }}
              >
                Adorable Horror Tees
              </p>
            </div>

            {/* Section 2: Newsletter (30%) */}
            <div className="md:col-span-1">
              <h3
                className="text-lg text-[#32CD32] mb-3"
                style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
              >
                Join the Colony
              </h3>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isSubmitting}
                  className="bg-[#1a1a1a] border-[#4A3258] text-[#F5F5DC] placeholder:text-[#9B8FB5]
                    focus:border-[#00CED1]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#00CED1] text-[#1a1a1a] hover:bg-[#00CED1]/90 font-semibold"
                  style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            </div>

            {/* Section 3: Links (25%) */}
            <div className="flex flex-col gap-2">
              <h3
                className="text-lg text-[#32CD32] mb-1"
                style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
              >
                Support
              </h3>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="text-[#9B8FB5] hover:text-[#32CD32] transition-colors text-left text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Contact Us
              </button>
              <Link
                to="/privacy"
                className="text-[#9B8FB5] hover:text-[#32CD32] transition-colors text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-[#9B8FB5] hover:text-[#32CD32] transition-colors text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Terms of Service
              </Link>
              <Link
                to="/shipping"
                className="text-[#9B8FB5] hover:text-[#32CD32] transition-colors text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Shipping & Returns
              </Link>
            </div>

            {/* Section 4: Social + Admin (20%) */}
            <div className="flex flex-col items-center md:items-end gap-4">
              <h3
                className="text-lg text-[#32CD32]"
                style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
              >
                Follow Us
              </h3>
              <div className="flex items-center gap-4">
                {/* Instagram */}
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9B8FB5] hover:text-[#FF1493] transition-colors"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>

                {/* TikTok */}
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9B8FB5] hover:text-[#00CED1] transition-colors"
                  aria-label="Follow us on TikTok"
                >
                  <TikTokIcon className="w-5 h-5" />
                </a>

                {/* Admin Link */}
                <Link
                  to="/admin/login"
                  className="text-[#9B8FB5] hover:text-[#32CD32] transition-colors text-base"
                  aria-label="Admin portal"
                  title="Admin"
                >
                  🐛
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-[#4A3258] text-center">
            <p
              className="text-xs text-[#9B8FB5]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              © {new Date().getFullYear()} Caterpillar Ranch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* CSS for animations */}
      <style>{`
        @keyframes breathe-footer {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }

        @keyframes flicker-border {
          0%, 96%, 100% { border-top-color: #4A3258; }
          98% { border-top-color: #32CD32; }
        }
      `}</style>
    </>
  );
}
