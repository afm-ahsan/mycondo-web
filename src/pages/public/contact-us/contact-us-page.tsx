import { PageContent } from '@/layouts/public/components/page-content';
import { PageHero } from '@/layouts/public/components/page-hero';
import { LegalContent } from '@/pages/public/components/legal-content';

export function ContactUsPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        description="We're here to help — reach out through any channel below."
      />
      <PageContent>
        <LegalContent>
          <h2>Get in Touch</h2>
          <p>
            Have a question about CondoBD, your account, condominium management features, or need
            technical assistance?
          </p>
          <p>
            Our support team is ready to help. We aim to respond to enquiries within{' '}
            <strong>48 business hours</strong>.
          </p>
          <p>
            For condominium-specific matters, please include relevant information such as your{' '}
            <strong>
              condominium/property name, flat or unit reference, and a brief description of the
              issue
            </strong>{' '}
            where applicable. Please do not send passwords, authentication codes, or unnecessary
            sensitive personal information.
          </p>

          <h2>How to Reach Us</h2>

          <h3>Email</h3>
          <p>For support, technical assistance, and general enquiries</p>
          <p>
            <a href="mailto:contact@ajwadtech.com">contact@ajwadtech.com</a>
          </p>

          <h3>Phone</h3>
          <p>Speak directly with our support team</p>
          <p>
            <a href="tel:+8801323993388">+880 1323 993 388</a>
            <br />
            <a href="tel:+8801323993377">+880 1323 993 377</a>
          </p>

          <h3>Address</h3>
          <p>Our base of operations</p>
          <p>
            Baneswar, Rajshahi
            <br />
            Bangladesh
          </p>

          <h3>Business Hours</h3>
          <p>When our team is available</p>
          <p>
            Saturday – Thursday
            <br />
            <strong>9:00 AM – 6:00 PM (BST)</strong>
            <br />
            Friday: Closed
          </p>

          <h2>What We Can Help With</h2>
          <p>Our support team can assist with CondoBD-related matters, including:</p>
          <ul>
            <li>
              <strong>Account &amp; access support</strong> — login problems, account access,
              password-related issues, and profile assistance.
            </li>
            <li>
              <strong>Owner, tenant &amp; resident management</strong> — assistance with Flat
              Owner, Tenant, Resident and household-related application features.
            </li>
            <li>
              <strong>Property management</strong> — questions relating to condominiums,
              buildings/towers, floors, flats/units and associated configuration.
            </li>
            <li>
              <strong>Billing &amp; payments</strong> — application-related questions concerning
              service charges, invoices, payment records, expenses and related financial features.
            </li>
            <li>
              <strong>Facilities &amp; bookings</strong> — assistance with available
              facility-management and reservation features.
            </li>
            <li>
              <strong>Security &amp; front-desk operations</strong> — application support for
              visitors, vehicles, domestic staff, service providers, parcels and related
              operational features.
            </li>
            <li>
              <strong>Application issues</strong> — unexpected errors, pages or functions not
              working as expected, usability problems, or other technical issues.
            </li>
            <li>
              <strong>General enquiries</strong> — questions about CondoBD, its features,
              availability or services.
            </li>
          </ul>
          <p>
            <strong>Condominium-specific requests:</strong> Matters such as approving
            registrations, changing ownership or tenancy records, correcting official
            condominium records, payment disputes, facility approvals, or other management
            decisions should normally be directed to your{' '}
            <strong>condominium management or authorized administrator</strong>. CondoBD support
            can assist with application-related or technical issues but should not override
            decisions belonging to individual condominium management authorities.
          </p>

          <h2>Help Us Assist You Faster</h2>
          <p>When reporting an application problem, please provide:</p>
          <ul>
            <li>The page or feature where the problem occurred</li>
            <li>A short description of what you were trying to do</li>
            <li>What you expected to happen</li>
            <li>What actually happened</li>
            <li>A screenshot of the problem, where appropriate</li>
            <li>Your condominium/property name, if relevant</li>
          </ul>
          <p>
            Please{' '}
            <strong>
              do not send your password, OTP, access token, full National ID information,
              payment credentials, or other unnecessary sensitive information
            </strong>{' '}
            by email or other support channels.
          </p>

          <h2>More Ways to Connect</h2>
          <p>
            We are expanding our support channels. Additional ways to contact the CondoBD team
            may become available in the future.
          </p>

          <h3>WhatsApp</h3>
          <p>Quick assistance through WhatsApp — Coming Soon</p>

          <h3>Facebook Page</h3>
          <p>Updates, announcements, and information about CondoBD — Coming Soon</p>
        </LegalContent>
      </PageContent>
    </>
  );
}
