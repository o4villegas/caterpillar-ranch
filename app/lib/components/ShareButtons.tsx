/**
 * ShareButtons Component
 *
 * Social sharing for product pages with horror-themed styling.
 * Uses Web Share API on mobile (native share sheet) with
 * fallback buttons for desktop (X/Twitter, Copy Link).
 *
 * "Spread the Infestation" - viral sharing for Gen Z audience
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from './ui/button';

interface ShareButtonsProps {
  productName: string;
  productSlug: string;
  productImage?: string;
}

export function ShareButtons({ productName, productSlug, productImage }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const productUrl = `https://caterpillar-ranch.lando555.workers.dev/products/${productSlug}`;
  const shareText = `Check out "${productName}" from Caterpillar Ranch - horror tees that hit different`;
  const hashtags = 'CaterpillarRanch,HorrorFashion,GenZStyle';

  // Check if Web Share API is available (mobile)
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    setIsSharing(true);
    try {
      await navigator.share({
        title: `${productName} - Caterpillar Ranch`,
        text: shareText,
        url: productUrl,
      });
      toast.success('The infestation spreads...', {
        description: 'Thanks for sharing!',
      });
    } catch (error) {
      // User cancelled or share failed - that's okay
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success('Link copied to clipboard', {
        description: 'Now go spread the infestation...',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = productUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}&hashtags=${hashtags}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
    window.open(fbUrl, '_blank', 'width=550,height=420');
  };

  // Pinterest is great for fashion/apparel
  const handlePinterestShare = () => {
    const pinUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(productImage || '')}&description=${encodeURIComponent(shareText)}`;
    window.open(pinUrl, '_blank', 'width=750,height=550');
  };

  return (
    <motion.div
      className="pt-4 border-t border-ranch-purple/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      {/* Horror-themed heading */}
      <p className="text-ranch-lavender text-sm mb-3 font-display-600 flex items-center gap-2">
        <span className="text-ranch-lime">&#x1F41B;</span>
        Spread the Infestation
      </p>

      <div className="flex flex-wrap gap-2">
        {/* Native share button (mobile) */}
        {canNativeShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            disabled={isSharing}
            className="border-ranch-purple/50 text-ranch-cream hover:border-ranch-lime hover:text-ranch-lime transition-colors"
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}

        {/* X/Twitter */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleTwitterShare}
          className="border-ranch-purple/50 text-ranch-cream hover:border-ranch-cyan hover:text-ranch-cyan transition-colors"
          title="Share on X"
        >
          <XIcon className="w-4 h-4" />
          <span className="sr-only">Share on X</span>
        </Button>

        {/* Facebook */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFacebookShare}
          className="border-ranch-purple/50 text-ranch-cream hover:border-ranch-cyan hover:text-ranch-cyan transition-colors"
          title="Share on Facebook"
        >
          <FacebookIcon className="w-4 h-4" />
          <span className="sr-only">Share on Facebook</span>
        </Button>

        {/* Pinterest (good for fashion) */}
        {productImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePinterestShare}
            className="border-ranch-purple/50 text-ranch-cream hover:border-ranch-pink hover:text-ranch-pink transition-colors"
            title="Pin on Pinterest"
          >
            <PinterestIcon className="w-4 h-4" />
            <span className="sr-only">Pin on Pinterest</span>
          </Button>
        )}

        {/* Copy Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className={`border-ranch-purple/50 transition-colors ${
            copied
              ? 'border-ranch-lime text-ranch-lime'
              : 'text-ranch-cream hover:border-ranch-lime hover:text-ranch-lime'
          }`}
          title="Copy link"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center"
              >
                <LinkIcon className="w-4 h-4 mr-1" />
                Copy Link
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.div>
  );
}

// Simple inline SVG icons to avoid adding lucide-react dependency bloat
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
