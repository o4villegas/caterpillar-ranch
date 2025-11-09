/**
 * Checkout Review - Final order review before placement
 *
 * Shows cart items, shipping info, and totals
 * MVP: Creates mock order (real Printful integration in Phase 7)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import type { Route } from './+types/checkout.review';
import { useCart } from '~/lib/contexts/CartContext';
import { Button } from '~/lib/components/ui/button';
import { Badge } from '~/lib/components/ui/badge';
import { HORROR_COPY } from '~/lib/constants/horror-copy';

interface ShippingInfo {
  email: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Review Order - Caterpillar Ranch' },
    { name: 'description', content: 'Review your order' },
  ];
}

export default function CheckoutReviewPage() {
  const { cart, totals, clearCart } = useCart();
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    // Load shipping info from sessionStorage
    const saved = sessionStorage.getItem('checkout_shipping');
    if (saved) {
      setShippingInfo(JSON.parse(saved));
    } else {
      // No shipping info, redirect to checkout
      navigate('/checkout');
    }
  }, [navigate]);

  // Redirect if cart is empty
  if (cart.items.length === 0) {
    navigate('/');
    return null;
  }

  if (!shippingInfo) {
    return null; // Loading or redirecting
  }

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);

    // Simulate order placement
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock order ID
    const orderId = `RANCH-${Date.now()}`;

    // Store order in localStorage (MVP - Phase 7 will use Printful API)
    const order = {
      id: orderId,
      items: cart.items,
      shipping: shippingInfo,
      totals,
      placedAt: new Date().toISOString(),
      status: 'confirmed',
    };

    const orders = JSON.parse(localStorage.getItem('caterpillar-ranch-orders') || '[]');
    orders.push(order);
    localStorage.setItem('caterpillar-ranch-orders', JSON.stringify(orders));

    // Clear cart and shipping info
    clearCart();
    sessionStorage.removeItem('checkout_shipping');

    // Navigate to confirmation
    navigate(`/checkout/confirmation?order=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-ranch-dark py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-ranch-pink drip-text mb-2">
            Review Your Harvest
          </h1>
          <p className="text-ranch-lavender">
            Confirm your order before the Ranch accepts it
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Shipping & Items */}
          <div className="space-y-6">
            {/* Shipping Info */}
            <motion.div
              className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-ranch-cream">
                  Shipping to
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/checkout')}
                  className="text-ranch-lavender hover:text-ranch-cyan"
                >
                  Edit
                </Button>
              </div>
              <div className="text-ranch-lavender space-y-1">
                <p className="font-semibold text-ranch-cream">{shippingInfo.name}</p>
                <p>{shippingInfo.address}</p>
                <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}</p>
                <p className="pt-2 text-sm">{shippingInfo.email}</p>
                {shippingInfo.phone && <p className="text-sm">{shippingInfo.phone}</p>}
              </div>
            </motion.div>

            {/* Cart Items */}
            <motion.div
              className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-ranch-cream mb-4">
                Order Items ({totals.itemCount})
              </h2>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-ranch-purple/50 pb-4 last:border-0 last:pb-0">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded bg-ranch-purple/10"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-ranch-cream">{item.product.name}</h3>
                      <p className="text-sm text-ranch-lavender">
                        Size: {item.variant.size} | Qty: {item.quantity}
                      </p>
                      {item.earnedDiscount > 0 && (
                        <Badge variant="success" className="mt-1 text-xs">
                          -{item.earnedDiscount}% off
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ranch-cyan">
                        ${(item.product.price * (1 - item.earnedDiscount / 100) * item.quantity).toFixed(2)}
                      </p>
                      {item.earnedDiscount > 0 && (
                        <p className="text-xs text-ranch-lavender line-through">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Order Summary */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-ranch-cream mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-ranch-lavender">
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>

                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-ranch-lime">
                    <div className="flex items-center gap-2">
                      <span>{HORROR_COPY.checkout.discount}</span>
                      {totals.effectiveDiscountPercent >= 40 && (
                        <Badge variant="success">MAX</Badge>
                      )}
                    </div>
                    <span>-${totals.totalDiscount.toFixed(2)} ({totals.effectiveDiscountPercent}%)</span>
                  </div>
                )}

                <div className="flex justify-between text-ranch-lavender">
                  <span>{HORROR_COPY.checkout.shipping}</span>
                  <span className="text-ranch-lime">FREE</span>
                </div>

                <div className="border-t border-ranch-purple pt-3">
                  <div className="flex justify-between text-2xl font-bold">
                    <span className="text-ranch-cream">{HORROR_COPY.checkout.total}</span>
                    <span className="text-ranch-cyan">${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                variant="horror"
                size="lg"
                className="w-full h-14 text-lg mb-3"
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? HORROR_COPY.checkout.processing : HORROR_COPY.checkout.placeOrder}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-ranch-lavender"
                onClick={() => navigate('/checkout')}
                disabled={isPlacingOrder}
              >
                ← Back to Shipping
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
