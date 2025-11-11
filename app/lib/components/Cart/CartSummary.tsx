import { useCart } from '../../contexts/CartContext';
import { Badge } from '../ui/badge';

export function CartSummary() {
  const { totals } = useCart();

  const hasDiscount = totals.totalDiscount > 0;
  const isAtDiscountCap = totals.effectiveDiscountPercent >= 40;

  return (
    <div className="space-y-3 bg-ranch-purple/20 rounded-lg p-4 border-2 border-ranch-purple">
      {/* Subtotal */}
      <div className="flex justify-between items-center text-ranch-lavender" style={{ fontFamily: 'Handjet, monospace', fontWeight: 300 }}>
        <span>Subtotal</span>
        <span style={{ fontWeight: 700 }}>${totals.subtotal.toFixed(2)}</span>
      </div>

      {/* Discount (if any) */}
      {hasDiscount && (
        <div className="flex justify-between items-center text-ranch-lime" style={{ fontFamily: 'Handjet, monospace', fontWeight: 300 }}>
          <div className="flex items-center gap-2">
            <span>Earned Discount</span>
            {isAtDiscountCap && (
              <Badge variant="success" className="text-xs animate-heartbeat-pulse">
                MAX
              </Badge>
            )}
          </div>
          <span style={{ fontWeight: 700 }}>
            -{totals.effectiveDiscountPercent}% (${totals.totalDiscount.toFixed(2)})
          </span>
        </div>
      )}

      {/* Discount cap warning */}
      {isAtDiscountCap && (
        <div className="text-xs text-ranch-lavender/70 bg-ranch-purple/30 p-2 rounded border border-ranch-purple" style={{ fontFamily: 'Handjet, monospace', fontWeight: 300 }}>
          🎮 Maximum 40% discount reached! The Ranch rewards your skill.
        </div>
      )}

      {/* Savings display */}
      {totals.savings > 0 && (
        <div className="text-sm text-ranch-cyan italic" style={{ fontFamily: 'Handjet, monospace', fontWeight: 300 }}>
          You're saving ${totals.savings.toFixed(2)} from playing games! 🐛💚
        </div>
      )}

      {/* Visual separator */}
      <div className="h-px bg-ranch-purple" />

      {/* Total */}
      <div className="flex justify-between items-center" style={{ fontFamily: 'Handjet, monospace' }}>
        <span className="text-xl text-ranch-cream" style={{ fontWeight: 700 }}>Total</span>
        <span className="text-2xl text-ranch-cyan" style={{ fontWeight: 700 }}>
          ${totals.total.toFixed(2)}
        </span>
      </div>

      {/* Free shipping message (if applicable) */}
      {totals.total >= 50 && (
        <div className="text-xs text-ranch-lime bg-ranch-lime/10 p-2 rounded border border-ranch-lime/30" style={{ fontFamily: 'Handjet, monospace', fontWeight: 300 }}>
          🦋 Free shipping unlocked!
        </div>
      )}
    </div>
  );
}
