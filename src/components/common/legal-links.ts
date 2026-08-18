export interface LegalLink {
  label: string;
  to: string;
}

export const LEGAL_LINKS: LegalLink[] = [
  { label: 'About', to: '/about' },
  { label: 'Terms & Conditions', to: '/terms-and-conditions' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Contact Us', to: '/contact-us' },
];
