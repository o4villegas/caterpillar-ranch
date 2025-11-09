import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Product, ProductVariant } from '../types/product';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from './ui/drawer';
import { HORROR_COPY, getRandomLoadingMessage } from '../constants/horror-copy';
import { ParticleBurst } from './ParticleBurst';
import { GameModal } from './GameModal';
import { ProductView } from './ProductView';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, variantId: string, quantity: number, earnedDiscount?: number) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(getRandomLoadingMessage());
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [earnedDiscount, setEarnedDiscount] = useState(0);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set first in-stock variant as default
  useEffect(() => {
    if (isOpen && !selectedVariant) {
      const firstInStock = product.variants.find(v => v.inStock);
      if (firstInStock) {
        setSelectedVariant(firstInStock);
      }
    }
  }, [isOpen, product.variants, selectedVariant]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVariant(null);
      setQuantity(1);
      setIsAdding(false);
    }
  }, [isOpen]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setIsAdding(true);
    setLoadingMessage(getRandomLoadingMessage());

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));

    onAddToCart(product.id, selectedVariant.id, quantity, earnedDiscount);
    setIsAdding(false);

    // Trigger particle burst effect
    setShowParticleBurst(true);
    setTimeout(() => setShowParticleBurst(false), 1000);

    // Show toast notification with horror theme
    toast.success(HORROR_COPY.success.added, {
      description: `${quantity}x ${product.name} (${selectedVariant.size}) - The Ranch accepts your selection 🐛`,
      duration: 3000,
    });

    // Close modal after brief delay
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleGameComplete = (discount: number) => {
    setEarnedDiscount(discount);
  };

  const inStockVariants = product.variants.filter(v => v.inStock);

  // Desktop: Use Dialog
  if (!isMobile) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>{product.description}</DialogDescription>
            </DialogHeader>
            <ProductView
              product={product}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
              quantity={quantity}
              setQuantity={setQuantity}
              earnedDiscount={earnedDiscount}
              isAdding={isAdding}
              loadingMessage={loadingMessage}
              inStockVariants={inStockVariants}
              onPlayGame={() => setIsGameModalOpen(true)}
              onAddToCart={handleAddToCart}
            />
          </DialogContent>
        </Dialog>
        <ParticleBurst trigger={showParticleBurst} />
        <GameModal
          isOpen={isGameModalOpen}
          onClose={() => setIsGameModalOpen(false)}
          productId={product.id}
          productSlug={product.slug}
          onGameComplete={handleGameComplete}
        />
      </>
    );
  }

  // Mobile: Use Drawer
  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto pb-8">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{product.name}</DrawerTitle>
            <DrawerDescription>{product.description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ProductView
              product={product}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
              quantity={quantity}
              setQuantity={setQuantity}
              earnedDiscount={earnedDiscount}
              isAdding={isAdding}
              loadingMessage={loadingMessage}
              inStockVariants={inStockVariants}
              onPlayGame={() => setIsGameModalOpen(true)}
              onAddToCart={handleAddToCart}
            />
          </div>
        </DrawerContent>
      </Drawer>
      <ParticleBurst trigger={showParticleBurst} />
      <GameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        productId={product.id}
        productSlug={product.slug}
        onGameComplete={handleGameComplete}
      />
    </>
  );
}
