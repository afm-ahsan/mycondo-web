import { Link } from 'react-router-dom';
import { PageContent } from '@/layouts/public/components/page-content';
import { PageHero } from '@/layouts/public/components/page-hero';
import { LegalContent } from '@/pages/public/components/legal-content';

export function TermsAndConditionsPage() {
  return (
    <>
      <PageHero
        title="Terms & Conditions"
        description="Please review the terms governing the use of CondoBD."
      />
      <PageContent>
        <p className="mb-6 text-sm text-muted-foreground">Effective Date: 18 August 2026</p>
        <LegalContent>
          <p>Welcome to CondoBD.</p>
          <p>
            These Terms &amp; Conditions govern access to and use of the CondoBD website, web
            application and related services. By accessing or using CondoBD, you agree to comply
            with these Terms.
          </p>
          <p>
            If you access CondoBD on behalf of a condominium, property-management organization or
            other entity, your access may also be governed by agreements between that
            organization and the service provider.
          </p>

          <h2>1. The Service</h2>
          <p>
            CondoBD provides software functionality for condominium and residential property
            management.
          </p>
          <p>
            Features may include property and flat management, resident and ownership records,
            tenant registration, billing and payments, expenses, facilities, security operations,
            visitors, vehicles, staff, notifications, reports and other related administrative
            functions.
          </p>
          <p>Available features may vary between organizations.</p>

          <h2>2. User Accounts</h2>
          <p>Certain features require an authorized user account.</p>
          <p>You are responsible for:</p>
          <ul>
            <li>providing accurate information where required;</li>
            <li>keeping your login credentials confidential;</li>
            <li>protecting access to your account and devices;</li>
            <li>
              promptly informing the appropriate administrator if you believe your account has
              been compromised; and
            </li>
            <li>using the platform only for legitimate and authorized purposes.</li>
          </ul>
          <p>
            You must not allow another person to impersonate you or knowingly use an account for
            which they do not have authorization.
          </p>

          <h2>3. Roles and Permissions</h2>
          <p>Access to CondoBD is role-based and permission-driven.</p>
          <p>Your condominium or organization may determine:</p>
          <ul>
            <li>what information you may view;</li>
            <li>what information you may add or modify;</li>
            <li>which administrative functions you may perform; and</li>
            <li>which buildings, flats, residents or operational areas you may access.</li>
          </ul>
          <p>
            The availability of a screen or feature does not itself grant permission to use
            information beyond your authorized scope.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You must not use CondoBD to:</p>
          <ul>
            <li>violate applicable law;</li>
            <li>gain unauthorized access to accounts, systems or information;</li>
            <li>interfere with the operation or security of the platform;</li>
            <li>introduce malicious software or harmful content;</li>
            <li>intentionally submit false or fraudulent information;</li>
            <li>misuse personal, financial or identity-related information;</li>
            <li>attempt to bypass security or authorization controls; or</li>
            <li>use another person&apos;s information for an unauthorized purpose.</li>
          </ul>

          <h2>5. Organization-Provided Information</h2>
          <p>
            Much of the information available through CondoBD may be entered, uploaded or
            maintained by condominium administrators, residents or other authorized users.
          </p>
          <p>
            The relevant organization is responsible for ensuring that it has an appropriate
            basis for collecting, maintaining and using information that it places in the system.
          </p>
          <p>Users are responsible for the accuracy of information they submit.</p>

          <h2>6. Financial Information</h2>
          <p>
            Where CondoBD provides billing, invoice, payment, service-charge or
            expense-management functionality, the platform assists with recording and managing
            operational information.
          </p>
          <p>
            Users should verify important financial records and transactions according to their
            condominium&apos;s approved financial and accounting procedures.
          </p>
          <p>
            CondoBD does not itself constitute banking, legal, tax, auditing or professional
            accounting advice.
          </p>

          <h2>7. Third-Party Services</h2>
          <p>
            Some features may depend on third-party services such as hosting, messaging, email,
            storage or payment services.
          </p>
          <p>Those services may be subject to their own terms and privacy practices.</p>
          <p>
            Availability of a third-party service may occasionally affect related CondoBD
            functionality.
          </p>

          <h2>8. Intellectual Property</h2>
          <p>
            Unless otherwise stated, the CondoBD software, interface, branding, documentation and
            related materials are protected by applicable intellectual-property laws.
          </p>
          <p>No ownership rights are transferred merely by accessing or using the service.</p>
          <p>
            You may not copy, modify, reverse engineer, reproduce or commercially redistribute
            protected parts of the platform except where permitted by law or written agreement.
          </p>

          <h2>9. Availability and Changes</h2>
          <p>
            We aim to provide a reliable service, but uninterrupted availability cannot be
            guaranteed.
          </p>
          <p>
            Maintenance, upgrades, security changes, infrastructure failures or circumstances
            outside reasonable control may temporarily affect access.
          </p>
          <p>
            Features may be improved, modified, replaced or discontinued as the platform evolves,
            subject to applicable contractual obligations.
          </p>

          <h2>10. Suspension or Termination of Access</h2>
          <p>
            Access may be restricted, suspended or terminated when reasonably necessary,
            including where:
          </p>
          <ul>
            <li>an account is disabled by an authorized administrator;</li>
            <li>there is suspected misuse or unauthorized access;</li>
            <li>continuing access presents a security risk;</li>
            <li>applicable agreements have ended; or</li>
            <li>applicable law or a lawful instruction requires it.</li>
          </ul>

          <h2>11. Limitation of Responsibility</h2>
          <p>
            To the extent permitted by applicable law, CondoBD and its service providers are not
            responsible for losses arising solely from:
          </p>
          <ul>
            <li>incorrect information supplied by users or organizations;</li>
            <li>decisions made independently by condominium management;</li>
            <li>unauthorized sharing of user credentials;</li>
            <li>third-party systems beyond reasonable control; or</li>
            <li>use of the platform contrary to these Terms.</li>
          </ul>
          <p>
            Nothing in these Terms excludes obligations or liabilities that cannot lawfully be
            excluded.
          </p>

          <h2>12. Privacy</h2>
          <p>
            Use of personal information through CondoBD is also governed by the{' '}
            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
              CondoBD Privacy Policy
            </Link>
            .
          </p>

          <h2>13. Changes to These Terms</h2>
          <p>
            These Terms may be updated when the service, legal requirements or operational
            practices change.
          </p>
          <p>The latest version should always be made available through CondoBD.</p>
          <p>Where appropriate, users may be informed of material changes.</p>

          <h2>14. Governing Requirements</h2>
          <p>
            Use of CondoBD is subject to applicable laws and regulations of Bangladesh and any
            other laws that lawfully apply to the relevant service or user.
          </p>

          <h2>15. Contact</h2>
          <p>
            Questions regarding these Terms may be submitted through the{' '}
            <Link to="/contact-us" target="_blank" rel="noopener noreferrer">
              CondoBD Contact Us page
            </Link>
            .
          </p>
        </LegalContent>
      </PageContent>
    </>
  );
}
