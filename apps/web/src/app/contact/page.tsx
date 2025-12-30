'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  HiEnvelope, 
  HiPhone, 
  HiMapPin,
  HiPaperAirplane,
  HiCheckCircle,
} from 'react-icons/hi2';
import { FaInstagram, FaFacebook, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import BackButton from '@/components/BackButton';

const socialLinks = [
  { 
    name: 'Instagram', 
    href: 'https://instagram.com/abutii_alpha', 
    icon: FaInstagram,
    handle: '@abutii_alpha',
    color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
  },
  { 
    name: 'WhatsApp', 
    href: 'https://wa.me/27658090794', 
    icon: FaWhatsapp,
    handle: '+27 65 809 0794',
    color: 'bg-green-500',
  },
  { 
    name: 'Facebook', 
    href: 'https://facebook.com/abutiialpha', 
    icon: FaFacebook,
    handle: 'Abutii Alpha',
    color: 'bg-blue-600',
  },
  { 
    name: 'TikTok', 
    href: 'https://tiktok.com/@fusionaura1', 
    icon: FaTiktok,
    handle: '@fusionaura1',
    color: 'bg-black dark:bg-white dark:text-black',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 via-transparent to-primary-dark/5" />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-dark/10 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <BackButton className="mb-6" />
          
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium 
                           bg-primary-dark/10 text-primary-dark mb-4 animate-fade-in">
              📬 Get in Touch
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[rgb(var(--foreground))] 
                         mb-4 animate-fade-in-up">
              Contact Us
            </h1>
            <p className="text-lg text-[rgb(var(--muted-foreground))] max-w-2xl mx-auto animate-fade-in-up"
               style={{ animationDelay: '0.1s' }}>
              Have a question or feedback? We&apos;d love to hear from you. 
              Reach out through any of the channels below.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              {/* Contact Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <a 
                  href="mailto:alphageneralsol@gmail.com"
                  className="card-hover p-6 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary-dark/10 group-hover:bg-primary-dark 
                                  group-hover:text-white transition-colors">
                      <HiEnvelope className="w-6 h-6 text-primary-dark group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-[rgb(var(--foreground))]">Email Us</p>
                      <p className="text-sm text-[rgb(var(--muted-foreground))]">
                        alphageneralsol@gmail.com
                      </p>
                    </div>
                  </div>
                </a>

                <a 
                  href="tel:+27658090794"
                  className="card-hover p-6 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary-dark/10 group-hover:bg-primary-dark 
                                  group-hover:text-white transition-colors">
                      <HiPhone className="w-6 h-6 text-primary-dark group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-[rgb(var(--foreground))]">Call Us</p>
                      <p className="text-sm text-[rgb(var(--muted-foreground))]">
                        +27 65 809 0794
                      </p>
                    </div>
                  </div>
                </a>
              </div>

              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-dark/10">
                    <HiMapPin className="w-6 h-6 text-primary-dark" />
                  </div>
                  <div>
                    <p className="font-semibold text-[rgb(var(--foreground))]">Location</p>
                    <p className="text-[rgb(var(--muted-foreground))]">
                      Sandton, South Africa<br />
                      We deliver nationwide!
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg font-bold text-[rgb(var(--foreground))] mb-4">
                  Follow Us on Social Media
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-hover p-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${social.color} text-white`}>
                          <social.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-[rgb(var(--foreground))]">
                            {social.name}
                          </p>
                          <p className="text-sm text-[rgb(var(--muted-foreground))]">
                            {social.handle}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Instagram Highlight */}
              <a 
                href="https://instagram.com/abutii_alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="block relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br 
                         from-purple-600 via-pink-500 to-orange-400 text-white group"
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="relative flex items-center gap-4">
                  <FaInstagram className="w-12 h-12" />
                  <div>
                    <p className="text-lg font-bold">Follow us on Instagram</p>
                    <p className="text-xl font-bold opacity-90">@abutii_alpha</p>
                    <p className="text-sm opacity-75 mt-1">
                      Stay updated with our latest products and offers!
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* Contact Form */}
            <div className="card p-6 lg:p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 
                                flex items-center justify-center">
                    <HiCheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-[rgb(var(--muted-foreground))] mb-6">
                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="btn-secondary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-6">
                    Send us a Message
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="input-field"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="input-field"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="input-field"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
                        Message
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="input-field resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full sm:w-auto"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        <>
                          <HiPaperAirplane className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

