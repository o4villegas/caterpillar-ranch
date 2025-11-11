import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '../ui/drawer';
import { useNavigate } from 'react-router';
import { useCart } from '../../contexts/CartContext';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartEmpty } from './CartEmpty';
import { Button } from '../ui/button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { cart, totals } = useCart();
  const hasItems = cart.items.length > 0;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-ranch-dark border-4 border-ranch-purple max-h-[90vh]">
        <DrawerHeader className="border-b-2 border-ranch-purple/50">
          <DrawerTitle className="text-2xl text-ranch-pink drip-text" style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}>
            {hasItems ? 'Your Order is Growing' : 'The Ranch Awaits'}
          </DrawerTitle>
          <DrawerDescription className="text-ranch-lavender" style={{ fontFamily: 'Handjet, monospace', fontWeight: 300 }}>
            {hasItems
              ? `${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'} growing in your cart`
              : 'Select your harvest to begin'
            }
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 px-4">
          {!hasItems && <CartEmpty />}

          {hasItems && (
            <>
              {/* Cart Items List */}
              <div className="space-y-4 py-4">
                {cart.items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

              {/* Cart Summary */}
              <div className="sticky bottom-0 bg-ranch-dark pb-4 pt-2 border-t-2 border-ranch-purple/50">
                <CartSummary />

                {/* Checkout Button */}
                <Button
                  className="w-full mt-4 bg-ranch-cyan hover:bg-ranch-lime text-ranch-dark text-lg"
                  size="lg"
                  onClick={() => {
                    onClose(); // Close drawer
                    navigate('/checkout'); // Navigate to checkout
                  }}
                  style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
                >
                  Complete the Harvest
                </Button>

                {/* Continue Shopping */}
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-ranch-lavender hover:text-ranch-cream"
                  onClick={onClose}
                  style={{ fontFamily: 'Handjet, monospace', fontWeight: 300 }}
                >
                  Continue Browsing
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
