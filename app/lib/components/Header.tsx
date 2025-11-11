import { useState } from 'react';
import { Link } from 'react-router';
import { CartIcon } from './Cart/CartIcon';
import { CartDrawer } from './Cart/CartDrawer';

export function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 border-ranch-purple bg-ranch-dark/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between max-w-6xl">
          {/* Logo/Brand */}
          <Link
            to="/"
            className="group transition-all hover:scale-105"
          >
            <span
              className="text-3xl font-bold text-ranch-pink"
              style={{
                fontFamily: 'Creepster, cursive',
                textShadow: '0 0 4px #32CD32, 0 0 6px #32CD32, 0 0 8px #32CD32, -1px -1px 0 #32CD32, 1px -1px 0 #32CD32, -1px 1px 0 #32CD32, 1px 1px 0 #32CD32'
              }}
            >
              Caterpillar Rancch
            </span>
          </Link>

          {/* Cart Icon */}
          <CartIcon onClick={() => setIsCartOpen(true)} />
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
