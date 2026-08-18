import { PageContent } from '@/layouts/public/components/page-content';
import { PageHero } from '@/layouts/public/components/page-hero';
import { LegalContent } from '@/pages/public/components/legal-content';

export function AboutUsPage() {
  return (
    <>
      <PageHero
        title="About"
        description="Learn more about CondoBD and our approach to condominium management."
      />
      <PageContent>
        <LegalContent>
          <p>
            <strong>CondoBD</strong> is a modern condominium and residential property-management
            platform designed to simplify the day-to-day administration of apartment communities,
            residential complexes, buildings, towers, owners, tenants, facilities, finances,
            security operations, and shared services.
          </p>
          <p>
            Our goal is simple: bring the essential activities of condominium management into one
            secure, organized, and easy-to-use digital platform.
          </p>

          <h2>What CondoBD Helps Manage</h2>
          <p>
            Depending on the features enabled for a particular condominium or organization,
            CondoBD may support areas such as:
          </p>
          <ul>
            <li>Buildings, towers, floors, flats and other property information</li>
            <li>Flat owners, tenants, residents and household information</li>
            <li>Ownership and occupancy records</li>
            <li>Service charges, billing, invoices and payments</li>
            <li>Operational expenses and financial records</li>
            <li>Visitor and vehicle access management</li>
            <li>Domestic staff and service-provider records</li>
            <li>Staff attendance and front-desk operations</li>
            <li>Parcels and delivery management</li>
            <li>Facility reservations and shared amenities</li>
            <li>Complaints, maintenance and service requests</li>
            <li>Notifications and communications</li>
            <li>Documents, reports and administrative records</li>
            <li>Role-based and permission-based access to information and functions</li>
          </ul>
          <p>
            Not every condominium uses every feature. Available functionality may vary according
            to the organization, subscription, configuration and permissions assigned to each
            user.
          </p>

          <h2>Designed for Condominium Communities</h2>
          <p>
            CondoBD is intended to serve the different people involved in residential property
            management, including:
          </p>
          <ul>
            <li>Condominium and property administrators</li>
            <li>Management committees</li>
            <li>Flat owners</li>
            <li>Tenants and residents</li>
            <li>Security and front-desk personnel</li>
            <li>Accounts and operational staff</li>
            <li>Authorized service personnel</li>
          </ul>
          <p>
            The platform is designed so that users see and perform only the functions appropriate
            to their role and granted permissions.
          </p>

          <h2>Security and Privacy</h2>
          <p>
            CondoBD is designed with security, privacy and responsible access to information as
            core principles.
          </p>
          <p>
            Administrative permissions, organization boundaries and access controls are used to
            restrict access to information and operations. Certain personal, residential,
            financial and identity-related information may require additional protection
            depending on its nature and the user&apos;s authorization.
          </p>
          <p>
            We continually aim to improve the platform&apos;s reliability, usability and security
            as the service evolves.
          </p>

          <h2>Our Approach</h2>
          <p>We believe condominium management software should be:</p>
          <ul>
            <li>
              <strong>Simple</strong> — common tasks should be easy to understand and complete.
            </li>
            <li>
              <strong>Organized</strong> — important property, resident, operational and financial
              information should be available from one structured system.
            </li>
            <li>
              <strong>Secure</strong> — access to information and administrative functions should
              be properly controlled.
            </li>
            <li>
              <strong>Transparent</strong> — appropriate records and activity histories should
              help authorized users understand what happened and when.
            </li>
            <li>
              <strong>Practical</strong> — features should solve real operational problems faced
              by residential communities.
            </li>
          </ul>

          <h2>Development</h2>
          <p>
            CondoBD is developed and maintained by <strong>AJWAD Technologies</strong>.
          </p>
          <p>For questions about CondoBD, please visit our Contact Us page.</p>
        </LegalContent>
      </PageContent>
    </>
  );
}
