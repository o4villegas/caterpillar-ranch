/**
 * Terms of Service Page
 *
 * Horror-themed terms of service
 */

import { Link } from 'react-router';

export default function Terms() {
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
          Terms of Service
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
              Welcome to Caterpillar Ranch
            </h2>
            <p className="mb-4">
              By accessing and using this website, you accept and agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use our
              services.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Products & Services
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                All products are print-on-demand items fulfilled by{' '}
                <a
                  href="https://www.printful.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00CED1] hover:underline"
                >
                  Printful
                </a>
              </li>
              <li>Product images are for illustration purposes and may vary slightly from final product</li>
              <li>We reserve the right to refuse service to anyone for any reason</li>
              <li>Prices are subject to change without notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Game Discounts
            </h2>
            <p className="mb-4">
              Caterpillar Ranch offers mini-games where you can earn discounts:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Discounts earned through games are applied to your order at checkout</li>
              <li>Maximum discount is 15% per order</li>
              <li>Discounts cannot be combined with other promotional codes</li>
              <li>Discounts are non-transferable and have no cash value</li>
              <li>We reserve the right to void fraudulent discount attempts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Orders & Payment
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All orders are subject to product availability</li>
              <li>Payment must be received before order processing</li>
              <li>We accept major credit cards and other payment methods as displayed</li>
              <li>Orders are final once confirmed with Printful</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Intellectual Property
            </h2>
            <p className="mb-4">
              All content on this site, including designs, logos, and text, is the property of
              Caterpillar Ranch and is protected by copyright law. You may not reproduce,
              distribute, or create derivative works without our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Limitation of Liability
            </h2>
            <p className="mb-4">
              Caterpillar Ranch and its affiliates shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of our
              products or services.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Changes to Terms
            </h2>
            <p>
              We may update these terms at any time. Continued use of our services constitutes
              acceptance of any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
            >
              Contact Us
            </h2>
            <p>
              Questions about these terms? Please{' '}
              <Link to="/" className="text-[#00CED1] hover:underline">
                contact us via the footer form
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
