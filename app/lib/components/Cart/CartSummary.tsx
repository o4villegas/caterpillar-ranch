import { useCart } from '../../contexts/CartContext';
import { Badge } from '../ui/badge';

export function CartSummary() {
  const { totals } = useCart();

  const hasDiscount = totals.totalDiscount > 0;
  const isAtDiscountCap = totals.effectiveDiscountPercent >= 40;

  return (
    <div className="space-y-3 bg-ranch-purple/20 rounded-lg p-4 border-2 border-ranch-purple">
      {/* Subtotal */}
      <div className="flex justify-between items-center text-ranch-lavender">
        <span>Subtotal</span>
        <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
      </div>

      {/* Discount (if any) */}
      {hasDiscount && (
        <div className="flex justify-between items-center text-ranch-lime">
          <div className="flex items-center gap-2">
            <span>Earned Discount</span>
            {isAtDiscountCap && (
              <Badge variant="success" className="text-xs animate-heartbeat-pulse">
                MAX
              </Badge>
            )}
          </div>
          <span className="font-bold">
            -{totals.effectiveDiscountPercent}% (${totals.totalDiscount.toFixed(2)})
          </span>
        </div>
      )}

      {/* Discount cap warning */}
      {isAtDiscountCap && (
        <div className="text-xs text-ranch-lavender/70 bg-ranch-purple/30 p-2 rounded border border-ranch-purple">
          🎮 Maximum 40% discount reached! The Ranch rewards your skill.
        </div>
      )}

      {/* Savings display */}
      {totals.savings > 0 && (
        <div className="text-sm text-ranch-cyan italic">
          You're saving ${totals.savings.toFixed(2)} from playing games! 🐛💚
        </div>
      )}

      {/* Visual separator */}
      <div className="h-px bg-ranch-purple" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-ranch-cream">Total</span>
        <span className="text-2xl font-bold text-ranch-cyan">
          ${totals.total.toFixed(2)}
        </span>
      </div>

      {/* Free shipping message (if applicable) */}
      {totals.total >= 50 && (
        <div className="text-xs text-ranch-lime bg-ranch-lime/10 p-2 rounded border border-ranch-lime/30">
          🦋 Free shipping unlocked!
        </div>
      )}
    </div>
  );
}
