/**
 * Checkout - Shipping Information
 *
 * Guest checkout flow - collect shipping address and email
 * MVP: Form validation only, no Printful API yet (Phase 7)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import type { Route } from './+types/checkout';
import { useCart } from '~/lib/contexts/CartContext';
import { Button } from '~/lib/components/ui/button';
import { Input } from '~/lib/components/ui/input';
import { HORROR_COPY } from '~/lib/constants/horror-copy';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Checkout - Caterpillar Ranch' },
    { name: 'description', content: 'Complete your order' },
  ];
}

export default function CheckoutPage() {
  const { cart, totals } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if cart is empty
  if (cart.items.length === 0) {
    navigate('/');
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    // Store shipping info in sessionStorage for review page
    sessionStorage.setItem('checkout_shipping', JSON.stringify(formData));

    // Navigate to review
    setTimeout(() => {
      navigate('/checkout/review');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-ranch-dark py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl text-ranch-pink drip-text mb-2 font-display-800">
            {HORROR_COPY.checkout.title}
          </h1>
          <p className="text-ranch-lavender font-display-600">
            {HORROR_COPY.checkout.shippingTitle}
          </p>
        </motion.div>

        {/* Order Summary (Collapsed) */}
        <motion.div
          className="mb-6 bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between items-center font-display">
            <div>
              <span className="text-ranch-cream font-display-700">
                {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
              </span>
              {totals.effectiveDiscountPercent > 0 && (
                <span className="ml-2 text-ranch-lime text-lg font-display-600">
                  ({totals.effectiveDiscountPercent}% off applied)
                </span>
              )}
            </div>
            <div className="text-2xl text-ranch-cyan font-display-700">
              ${totals.total.toFixed(2)}
            </div>
          </div>
        </motion.div>

        {/* Shipping Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
            <h2 className="text-2xl text-ranch-cream mb-4 font-display-700">
              Contact Information
            </h2>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-ranch-cream text-lg mb-2 font-display-700">
                Email <span className="text-ranch-pink">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your@email.com"
                className={errors.email ? 'border-ranch-pink' : ''}
              />
              {errors.email && (
                <p className="text-ranch-pink text-lg mt-1">{errors.email}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-ranch-cream text-lg mb-2 font-display-700">
                Full Name <span className="text-ranch-pink">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="John Doe"
                className={errors.name ? 'border-ranch-pink' : ''}
              />
              {errors.name && (
                <p className="text-ranch-pink text-lg mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="bg-ranch-purple/20 border-2 border-ranch-purple rounded-lg p-6">
            <h2 className="text-2xl text-ranch-cream mb-4 font-display-700">
              {HORROR_COPY.checkout.shippingAddress}
            </h2>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-ranch-cream text-lg mb-2 font-display-700">
                Street Address <span className="text-ranch-pink">*</span>
              </label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Main St"
                className={errors.address ? 'border-ranch-pink' : ''}
              />
              {errors.address && (
                <p className="text-ranch-pink text-lg mt-1">{errors.address}</p>
              )}
            </div>

            {/* Address Line 2 (Optional) */}
            <div className="mb-4">
              <label className="block text-ranch-cream text-lg mb-2 font-display-700">
                Apartment, Suite, etc. (optional)
              </label>
              <Input
                type="text"
                value={formData.address2}
                onChange={(e) => handleChange('address2', e.target.value)}
                placeholder="Apt 4B"
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-ranch-cream text-lg mb-2 font-display-700">
                  City <span className="text-ranch-pink">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="City"
                  className={errors.city ? 'border-ranch-pink' : ''}
                />
                {errors.city && (
                  <p className="text-ranch-pink text-lg mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-ranch-cream text-lg mb-2 font-display-700">
                  State <span className="text-ranch-pink">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="CA"
                  maxLength={2}
                  className={errors.state ? 'border-ranch-pink' : ''}
                />
                {errors.state && (
                  <p className="text-ranch-pink text-lg mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-ranch-cream text-lg mb-2 font-display-700">
                  ZIP Code <span className="text-ranch-pink">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleChange('zip', e.target.value)}
                  placeholder="12345"
                  maxLength={10}
                  className={errors.zip ? 'border-ranch-pink' : ''}
                />
                {errors.zip && (
                  <p className="text-ranch-pink text-lg mt-1">{errors.zip}</p>
                )}
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-ranch-cream text-lg mb-2 font-display-700">
                Phone (optional)
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="horror"
            size="lg"
            className="w-full h-14 text-lg font-display-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Preparing...' : 'Continue to Review'}
          </Button>

          {/* Back to Cart */}
          <Button
            type="button"
            variant="ghost"
            className="w-full text-ranch-lavender font-display-600"
            onClick={() => navigate('/')}
          >
            ← Back to Shopping
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
