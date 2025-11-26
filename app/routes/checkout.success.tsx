/**
 * Checkout Success - Post-payment confirmation page
 *
 * Displayed after successful Stripe payment
 * Verifies payment status and shows order confirmation
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import type { Route } from './+types/checkout.success';
import { useCart } from '~/lib/contexts/CartContext';
import { Button } from '~/lib/components/ui/button';
import { Badge } from '~/lib/components/ui/badge';

interface PendingOrder {
  orderId: string;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl: string;
    };
    variant: {
      size: string;
      color: string;
    };
    quantity: number;
    earnedDiscount: number;
  }>;
  shipping: {
    name: string;
    email: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  totals: {
    subtotal: number;
    totalDiscount: number;
    total: number;
    itemCount: number;
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Order Confirmed - Caterpillar Ranch' },
    { name: 'description', content: 'Your order has been confirmed' },
  ];
}

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [orderDetails, setOrderDetails] = useState<PendingOrder | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function verifyPayment() {
      // Try to get pending order from sessionStorage
      const pendingOrderJson = sessionStorage.getItem('pending_order');

      if (pendingOrderJson) {
        try {
          const pendingOrder = JSON.parse(pendingOrderJson) as PendingOrder;
          setOrderDetails(pendingOrder);

          // Clear cart and session data after successful payment
          clearCart();
          sessionStorage.removeItem('checkout_shipping');
          sessionStorage.removeItem('pending_order');

          // Store in order history
          const orders = JSON.parse(localStorage.getItem('caterpillar-ranch-orders') || '[]');
          orders.push({
            ...pendingOrder,
            placedAt: new Date().toISOString(),
            status: 'confirmed',
          });
          localStorage.setItem('caterpillar-ranch-orders', JSON.stringify(orders));
        } catch {
          console.error('Failed to parse pending order');
        }
      }

      // Verify with Stripe if we have a session ID
      if (sessionId) {
        try {
          const response = await fetch(`/api/checkout/session/${sessionId}`);

          if (response.ok) {
            const data = await response.json() as {
              data: {
                status: string;
                paymentStatus: string;
                orderId: string;
                customerEmail: string;
                amountTotal: number;
              };
            };

            if (data.data.paymentStatus === 'paid') {
              // Payment verified - order is being processed by webhook
              setIsVerifying(false);
            } else if (data.data.paymentStatus === 'unpaid') {
              setVerificationError('Payment not completed. Please try again.');
              setIsVerifying(false);
            } else {
              // Still processing
              setIsVerifying(false);
            }
          } else {
            setVerificationError('Could not verify payment status.');
            setIsVerifying(false);
          }
        } catch {
          setVerificationError('Error verifying payment.');
          setIsVerifying(false);
        }
      } else {
        // No session ID - check if we have order details from sessionStorage
        if (!orderDetails) {
          setVerificationError('No order information found.');
        }
        setIsVerifying(false);
      }
    }

    verifyPayment();
  }, [sessionId, clearCart]);

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-ranch-dark flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-pulse text-6xl mb-4">🐛</div>
          <p className="text-ranch-lavender text-xl font-display-600">
            Verifying your payment...
          </p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (verificationError && !orderDetails) {
    return (
      <div className="min-h-screen bg-ranch-dark py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl text-ranch-pink mb-4 font-display-800">
              Something Went Wrong
            </h1>
            <p className="text-ranch-lavender mb-8 font-body">
              {verificationError}
            </p>
            <Button
              variant="horror"
              onClick={() => navigate('/checkout/review')}
              className="font-display-600"
            >
              Return to Checkout
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ranch-dark py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.div
            className="text-8xl mb-4"
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            🎉
          </motion.div>
          <h1 className="text-5xl text-ranch-lime mb-2 font-display-800">
            Order Confirmed!
          </h1>
          <p className="text-ranch-lavender text-lg font-display-600">
            The Ranch has accepted your harvest
          </p>
        </motion.div>

        {/* Order Details */}
        <motion.div
          className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {orderDetails && (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-ranch-lavender text-sm font-body">Order Number</p>
                  <p className="text-ranch-cyan text-2xl font-display-700">
                    {orderDetails.orderId}
                  </p>
                </div>
                <Badge variant="success" className="text-lg px-4 py-1">
                  Confirmed
                </Badge>
              </div>

              {/* Items Summary */}
              <div className="border-t border-ranch-purple/50 pt-4 mb-4">
                <h3 className="text-ranch-cream mb-3 font-display-700">
                  Order Summary
                </h3>
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div>
                      <span className="text-ranch-cream font-display-600">
                        {item.product.name}
                      </span>
                      <span className="text-ranch-lavender text-sm ml-2 font-body">
                        × {item.quantity}
                      </span>
                    </div>
                    <span className="text-ranch-cyan font-display-600">
                      ${(item.product.price * (1 - item.earnedDiscount / 100) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-ranch-purple/50 pt-4">
                <div className="flex justify-between text-lg">
                  <span className="text-ranch-cream font-display-700">Total Paid</span>
                  <span className="text-ranch-cyan font-display-700">
                    ${orderDetails.totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="border-t border-ranch-purple/50 pt-4 mt-4">
                <h3 className="text-ranch-cream mb-2 font-display-700">
                  Shipping To
                </h3>
                <div className="text-ranch-lavender font-body">
                  <p className="font-semibold text-ranch-cream">{orderDetails.shipping.name}</p>
                  <p>{orderDetails.shipping.address}</p>
                  {orderDetails.shipping.address2 && <p>{orderDetails.shipping.address2}</p>}
                  <p>{orderDetails.shipping.city}, {orderDetails.shipping.state} {orderDetails.shipping.zip}</p>
                </div>
              </div>
            </>
          )}

          {!orderDetails && (
            <div className="text-center py-8">
              <p className="text-ranch-lime text-xl mb-2 font-display-700">
                Payment Successful!
              </p>
              <p className="text-ranch-lavender font-body">
                You will receive a confirmation email shortly with your order details.
              </p>
            </div>
          )}
        </motion.div>

        {/* Next Steps */}
        <motion.div
          className="bg-ranch-purple/10 border border-ranch-purple/30 rounded-lg p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-ranch-cream mb-3 font-display-700">
            What Happens Next?
          </h3>
          <ul className="space-y-2 text-ranch-lavender font-body">
            <li className="flex items-start gap-2">
              <span className="text-ranch-lime">✓</span>
              <span>You'll receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ranch-cyan">→</span>
              <span>Your order is being prepared by our caterpillars</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ranch-cyan">→</span>
              <span>We'll send tracking info once your order ships (usually 3-5 business days)</span>
            </li>
          </ul>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/" className="flex-1">
            <Button
              variant="horror"
              size="lg"
              className="w-full font-display-600"
            >
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
