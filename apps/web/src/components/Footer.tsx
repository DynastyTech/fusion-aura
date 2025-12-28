'use client';

import Link from 'next/link';
import { 
  HiEnvelope, 
  HiMapPin,
  HiPhone,
} from 'react-icons/hi2';
import { FaInstagram, FaWhatsapp, FaFacebook, FaTiktok, FaLeaf } from 'react-icons/fa';

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/products' },
    { name: 'New Arrivals', href: '/products?sort=newest' },
    { name: 'Best Sellers', href: '/products?sort=popular' },
    { name: 'On Sale', href: '/products?sale=true' },
  ],
  support: [
    { name: 'Track Order', href: '/track-order' },
    { name: 'Shipping Info', href: '/shipping' },
    { name: 'Returns & Refunds', href: '/returns' },
    { name: 'FAQs', href: '/faq' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog', href: '/blog' },
  ],
};

const socialLinks = [
  { 
    name: 'Instagram', 
    href: 'https://instagram.com/abutii_alpha', 
    icon: FaInstagram,
    handle: '@abutii_alpha',
  },
  { 
    name: 'WhatsApp', 
    href: 'https://wa.me/27658090794', 
    icon: FaWhatsapp,
    handle: '+27 65 809 0794',
  },
  { 
    name: 'Facebook', 
    href: 'https://facebook.com/abutiialpha', 
    icon: FaFacebook,
    handle: 'Abutii Alpha',
  },
  { name: 'TikTok', href: 'https://tiktok.com/@abutii_alpha', icon: FaTiktok },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[rgb(var(--card))] border-t border-[rgb(var(--border))]">
      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-primary-dark 
                              rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-r from-primary-light to-primary-dark 
                              p-2 rounded-xl">
                  <FaLeaf className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold">
                <span className="text-primary-light">Fusion</span>
                <span className="text-primary-dark">Aura</span>
              </span>
            </Link>
            
            <p className="text-[rgb(var(--muted-foreground))] mb-6 max-w-sm">
              Sustainable Life, Timeless Remedies, Trusted Care. 
              Experience the fusion of nature and innovation.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a 
                href="mailto:alphageneralsol@gmail.com" 
                className="flex items-center gap-2 text-[rgb(var(--muted-foreground))] 
                           hover:text-primary-dark transition-colors"
              >
                <HiEnvelope className="w-4 h-4" />
                <span>alphageneralsol@gmail.com</span>
              </a>
              <a 
                href="tel:+27658090794" 
                className="flex items-center gap-2 text-[rgb(var(--muted-foreground))] 
                           hover:text-primary-dark transition-colors"
              >
                <HiPhone className="w-4 h-4" />
                <span>+27 65 809 0794</span>
              </a>
              <p className="flex items-center gap-2 text-[rgb(var(--muted-foreground))]">
                <HiMapPin className="w-4 h-4" />
                <span>Sandton, South Africa</span>
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 rounded-xl bg-[rgb(var(--muted))] 
                             hover:bg-primary-dark transition-all duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5 text-[rgb(var(--muted-foreground))] 
                                          group-hover:text-white transition-colors" />
                  {social.handle && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 
                                   bg-[rgb(var(--card))] border border-[rgb(var(--border))]
                                   rounded text-xs whitespace-nowrap opacity-0 
                                   group-hover:opacity-100 transition-opacity shadow-lg">
                      {social.handle}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[rgb(var(--muted-foreground))] hover:text-primary-dark 
                               transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[rgb(var(--muted-foreground))] hover:text-primary-dark 
                               transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[rgb(var(--muted-foreground))] hover:text-primary-dark 
                               transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[rgb(var(--border))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[rgb(var(--muted-foreground))] text-center sm:text-left">
              © {currentYear} FusionAura. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link 
                href="/privacy" 
                className="text-[rgb(var(--muted-foreground))] hover:text-primary-dark transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-[rgb(var(--muted-foreground))] hover:text-primary-dark transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

