/**
 * Contact Form Modal
 *
 * Modal dialog for customer contact form
 * Used in footer and throughout site for support inquiries
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContactResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

const SUBJECTS = [
  { value: 'Order Issue', label: 'Order Issue' },
  { value: 'Product Question', label: 'Product Question' },
  { value: 'Other', label: 'Other' },
] as const;

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Product Question' as const,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill out all fields');
      return;
    }

    // Client-side email validation (matches backend regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as ContactResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      toast.success(data.message || 'Message sent! We\'ll respond soon. 🐛');

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        subject: 'Product Question',
        message: '',
      });
      onClose();
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2d1f3a] border-2 border-[#4A3258] max-w-md">
        <DialogHeader>
          <DialogTitle
            className="text-2xl text-[#F5F5DC]"
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
          >
            Contact Us 🐛
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm text-[#9B8FB5] mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={100}
              className="bg-[#1a1a1a] border-[#4A3258] text-[#F5F5DC] placeholder:text-[#9B8FB5]"
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-[#9B8FB5] mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-[#1a1a1a] border-[#4A3258] text-[#F5F5DC] placeholder:text-[#9B8FB5]"
              placeholder="your@email.com"
            />
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm text-[#9B8FB5] mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#1a1a1a] border-2 border-[#4A3258] rounded-lg
                text-[#F5F5DC] focus:border-[#00CED1] focus:outline-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {SUBJECTS.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm text-[#9B8FB5] mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              maxLength={2000}
              rows={6}
              className="w-full px-3 py-2 bg-[#1a1a1a] border-2 border-[#4A3258] rounded-lg
                text-[#F5F5DC] placeholder:text-[#9B8FB5] focus:border-[#00CED1] focus:outline-none
                resize-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
              placeholder="How can we help you?"
            />
            <p className="text-xs text-[#9B8FB5] mt-1">
              {formData.message.length}/2000 characters
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00CED1] text-[#1a1a1a] hover:bg-[#00CED1]/90 font-semibold"
            style={{ fontFamily: 'Tourney, cursive', fontWeight: 700 }}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
