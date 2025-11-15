/**
 * Privacy Policy Page
 *
 * Horror-themed privacy policy that references Printful's handling
 */

import { Link } from 'react-router';

export default function Privacy() {
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
          style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}
        >
          Privacy Policy
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
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Introduction
            </h2>
            <p className="mb-4">
              Caterpillar Ranch values your privacy. This policy explains how we collect, use,
              and protect your personal information when you visit our store and purchase our
              adorable horror tees.
            </p>
            <p className="mb-4">
              We use{' '}
              <a
                href="https://www.printful.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00CED1] hover:underline"
              >
                Printful
              </a>{' '}
              for order fulfillment. Your order information is processed according to{' '}
              <a
                href="https://www.printful.com/policies/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00CED1] hover:underline"
              >
                Printful's Privacy Policy
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Contact Information:</strong> Name, email address, shipping address
              </li>
              <li>
                <strong>Order Information:</strong> Products purchased, payment details (processed
                securely)
              </li>
              <li>
                <strong>Game Data:</strong> Scores and discounts earned from mini-games
              </li>
              <li>
                <strong>Newsletter:</strong> Email address if you subscribe
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Send newsletters (only if you subscribe)</li>
              <li>Track game discounts applied to your order</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Data Sharing
            </h2>
            <p className="mb-4">
              We share your information only with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Printful:</strong> To fulfill your orders
              </li>
              <li>
                <strong>Payment Processors:</strong> To process transactions securely
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required by law
              </li>
            </ul>
            <p className="mt-4">
              We <strong>never</strong> sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Your Rights
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request corrections to your data</li>
              <li>Request deletion of your data</li>
              <li>Unsubscribe from newsletters at any time</li>
              <li>Opt out of non-essential cookies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2
              className="text-2xl text-[#32CD32] mb-4"
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              Contact Us
            </h2>
            <p>
              If you have questions about this privacy policy, please{' '}
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
