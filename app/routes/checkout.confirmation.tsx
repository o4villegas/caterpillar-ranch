/**
 * Checkout Confirmation - Order success page
 *
 * Shows order confirmation after successful placement
 * MVP: Displays mock order from localStorage (real Printful tracking in Phase 7)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import type { Route } from './+types/checkout.confirmation';
import { Button } from '~/lib/components/ui/button';
import { Badge } from '~/lib/components/ui/badge';
import { HORROR_COPY } from '~/lib/constants/horror-copy';

interface OrderItem {
  id: string;
  product: {
    name: string;
    imageUrl: string;
    price: number;
  };
  variant: {
    size: string;
  };
  quantity: number;
  earnedDiscount: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  shipping: {
    email: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  totals: {
    subtotal: number;
    totalDiscount: number;
    effectiveDiscountPercent: number;
    total: number;
  };
  placedAt: string;
  status: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Order Confirmed - Caterpillar Ranch' },
    { name: 'description', content: 'Your order has been confirmed' },
  ];
}

export default function CheckoutConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order');

  useEffect(() => {
    if (!orderId) {
      // No order ID, redirect to home
      navigate('/');
      return;
    }

    // Load order from localStorage
    try {
      const orders = JSON.parse(localStorage.getItem('caterpillar-ranch-orders') || '[]');
      const foundOrder = orders.find((o: Order) => o.id === orderId);

      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        // Order not found, redirect to home
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  if (loading || !order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ranch-dark py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 text-6xl">🐛</div>
          <h1 className="text-5xl text-ranch-lime drip-text mb-2" style={{ fontFamily: 'Tourney, cursive', fontWeight: 800 }}>
            {HORROR_COPY.order.confirmed}
          </h1>
          <p className="text-ranch-lavender mb-4" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
            The Ranch has accepted your tribute
          </p>
          <Badge variant="success" className="text-lg px-4 py-2" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>
            Order #{order.id}
          </Badge>
        </motion.div>

        {/* Order Details */}
        <div className="space-y-6">
          {/* Confirmation Email */}
          <motion.div
            className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-ranch-cream" style={{ fontFamily: 'Inter, sans-serif' }}>
              A confirmation email has been sent to:
            </p>
            <p className="text-2xl text-ranch-cyan mt-2" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>
              {order.shipping.email}
            </p>
            <p className="text-lg text-ranch-lavender mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              {HORROR_COPY.order.tracking}
            </p>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl text-ranch-cream mb-4" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>
              Order Summary
            </h2>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-ranch-purple/50 pb-4 last:border-0 last:pb-0">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded bg-ranch-purple/10"
                  />
                  <div className="flex-1">
                    <h3 className="text-ranch-cream" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>{item.product.name}</h3>
                    <p className="text-lg text-ranch-lavender" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Size: {item.variant.size} | Qty: {item.quantity}
                    </p>
                    {item.earnedDiscount > 0 && (
                      <Badge variant="success" className="mt-1 text-xs">
                        -{item.earnedDiscount}% off
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-ranch-cyan" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>
                      ${(item.product.price * (1 - item.earnedDiscount / 100) * item.quantity).toFixed(2)}
                    </p>
                    {item.earnedDiscount > 0 && (
                      <p className="text-lg text-ranch-lavender line-through" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-ranch-purple pt-4">
              <div className="flex justify-between text-ranch-lavender" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700 }}>${order.totals.subtotal.toFixed(2)}</span>
              </div>

              {order.totals.totalDiscount > 0 && (
                <div className="flex justify-between text-ranch-lime" style={{ fontFamily: 'Tourney, cursive' }}>
                  <span style={{ fontWeight: 600 }}>{HORROR_COPY.checkout.discount} ({order.totals.effectiveDiscountPercent}%)</span>
                  <span style={{ fontWeight: 700 }}>-${order.totals.totalDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-ranch-lavender" style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}>
                <span>{HORROR_COPY.checkout.shipping}</span>
                <span className="text-ranch-lime" style={{ fontWeight: 700 }}>FREE</span>
              </div>

              <div className="flex justify-between text-2xl pt-2 border-t border-ranch-purple" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>
                <span className="text-ranch-cream">{HORROR_COPY.checkout.total}</span>
                <span className="text-ranch-cyan">${order.totals.total.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Shipping Address */}
          <motion.div
            className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl text-ranch-cream mb-4" style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}>
              Shipping to
            </h2>
            <div className="text-ranch-lavender space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <p className="text-ranch-cream font-semibold">{order.shipping.name}</p>
              <p>{order.shipping.address}</p>
              <p>{order.shipping.city}, {order.shipping.state} {order.shipping.zip}</p>
              <p className="pt-2 text-lg">{order.shipping.email}</p>
              {order.shipping.phone && <p className="text-base">{order.shipping.phone}</p>}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={() => navigate('/')}
              variant="horror"
              size="lg"
              className="w-full h-14 text-lg"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 600 }}
            >
              Continue Shopping
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
