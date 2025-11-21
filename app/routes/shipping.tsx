/**
 * Shipping & Returns Page
 *
 * Horror-themed shipping and returns policy
 */

import { Link } from 'react-router';

export default function Shipping() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] px-4 md:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-block text-[#00CED1] hover:text-[#32CD32] mb-6 transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          ← Back to Store
        </Link>

        <h1
          className="text-4xl text-[#F5F5DC] mb-8"
          style={{ fontFamily: 'Tourney, cursive', fontWeight: 800 }}
        >
          Shipping & Returns
        </h1>

        <div
          className="prose prose-invert max-w-none text-[#F5F5DC]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <p className="text-[#9B8FB5] mb-6">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Order Processing
            </h2>
            <p className="mb-4">
              All orders are made-to-order and fulfilled by{' '}
              <a
                href="https://www.printful.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00CED1] hover:underline"
              >
                Printful
              </a>
              . This means:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Orders are typically processed within 2-7 business days</li>
              <li>Each item is printed after you order, ensuring quality and reducing waste</li>
              <li>You'll receive a tracking number once your order ships</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Shipping Times
            </h2>
            <p className="mb-4">Shipping times vary by location:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>United States:</strong> 3-7 business days after production
              </li>
              <li>
                <strong>Canada:</strong> 5-10 business days after production
              </li>
              <li>
                <strong>International:</strong> 7-21 business days after production
              </li>
            </ul>
            <p className="mt-4 text-[#9B8FB5] text-sm">
              Note: Production time (2-7 days) + Shipping time = Total delivery time
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Shipping Costs
            </h2>
            <p className="mb-4">
              Shipping costs are calculated at checkout based on:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Destination address</li>
              <li>Package weight and size</li>
              <li>Selected shipping method</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Returns & Exchanges
            </h2>
            <p className="mb-4">
              We want you to love your Caterpillar Ranch products! If there's an issue:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Damaged or Defective Items:</strong> Contact us within 30 days of delivery
                with photos. We'll send a replacement at no cost.
              </li>
              <li>
                <strong>Wrong Item:</strong> We'll send the correct item immediately
              </li>
              <li>
                <strong>Size Issues:</strong> We can offer an exchange if the item is unworn and
                in original condition
              </li>
            </ul>
            <p className="mt-4">
              <strong className="text-[#FF1493]">Please note:</strong> Due to our print-on-demand
              model, we cannot accept returns for change of mind. Please check size charts before
              ordering.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Lost or Stolen Packages
            </h2>
            <p className="mb-4">
              If your tracking shows delivered but you didn't receive your package:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Check with neighbors and building management</li>
              <li>Verify the delivery address on your order</li>
              <li>Wait 24-48 hours (sometimes marked delivered early)</li>
              <li>Contact us - we'll help resolve the issue</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Contact Us About Your Order
            </h2>
            <p>
              Have questions about your order? Please{' '}
              <Link to="/" className="text-[#00CED1] hover:underline">
                contact us via the footer form
              </Link>{' '}
              with your order number, and we'll help you out! 🐛
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
