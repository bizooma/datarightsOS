import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="bg-[#14202b] text-white">
          <div className="max-w-3xl mx-auto px-6 py-16 text-center">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              DataRightsOS — Terms of Service
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              Effective date: 6-1-2026 · Version 1.0
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="max-w-3xl mx-auto px-6 py-16">
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-[15px] prose-strong:text-foreground prose-a:text-primary">
            <p>
              These Terms of Service ("Terms") govern your access to and use of DataRightsOS, the
              website datarightsos.com, the embeddable widget, dashboard, and related services
              (collectively, the "Service"), operated by Bizooma, LLC, a Texas limited liability
              company ("Bizooma," "we," "us"). By creating an account, installing the widget, or
              using the Service, you ("Subscriber," "you") agree to these Terms. If you are
              accepting on behalf of a business, you represent that you have authority to bind it.
            </p>

            <hr className="my-8 border-border" />

            <h2>1. What the Service Is — and Is Not</h2>
            <p>
              <strong>1.1 Tools, not compliance.</strong> The Service provides software tools that help you
              display legal statements, capture and manage consumer privacy and accessibility
              requests, track deadlines, and maintain records of your responses.
            </p>
            <p>
              <strong>1.2 NO GUARANTEE OF COMPLIANCE.</strong> THE SERVICE DOES NOT MAKE YOU COMPLIANT WITH ANY
              LAW, INCLUDING THE CCPA/CPRA, VCDPA, CTDPA, OTHER STATE PRIVACY LAWS, THE ADA, WCAG
              GUIDELINES, THE GDPR, OR ANY OTHER STATUTE, REGULATION, OR STANDARD. Compliance is
              determined by your own practices across your entire business. You are solely
              responsible for your compliance with all laws that apply to you. Use of the Service,
              including any "Active" status indicator, is not a representation by Bizooma that you
              are compliant with anything.
            </p>
            <p>
              <strong>1.3 No legal advice.</strong> Nothing in the Service — including sample statement
              templates, checklists, deadline calculations, help content, or guidance — is legal
              advice, and no attorney-client relationship is created. Templates are starting
              points only. You should consult a licensed attorney regarding your obligations.
            </p>
            <p>
              <strong>1.4 Accessibility.</strong> The Service provides an accessibility statement display,
              visitor display preferences, and a barrier-reporting channel. It does not audit,
              remediate, or make your website accessible, and does not ensure conformance with
              WCAG or the ADA.
            </p>

            <h2>2. Your Content and Your Responsibilities</h2>
            <p>
              <strong>2.1 Your statements are yours.</strong> You author, approve, and publish your own privacy
              policy, cookie policy, accessibility statement, AI use statement, and any other
              statements displayed through the Service. You are solely responsible for their
              accuracy, completeness, and lawfulness.
            </p>
            <p>
              <strong>2.2 Your requests are yours to fulfill.</strong> The Service captures, verifies, tracks,
              and documents consumer requests. Actually fulfilling those requests — deleting,
              correcting, providing, or ceasing the sale/sharing of personal information across
              your systems and vendors — is your responsibility. Checklist items marked complete
              reflect your team's own attestations, not Bizooma's verification of the underlying
              work.
            </p>
            <p>
              <strong>2.3 Accurate configuration.</strong> You are responsible for the accuracy of the
              information you configure, including your business name, privacy contact email, data
              locations, statement content, and for wiring your tracking tags through the widget's
              consent gating where applicable. Enforcement features cannot control scripts, tags,
              or cookies that you do not route through the Service.
            </p>
            <p>
              <strong>2.4 Lawful use.</strong> You will not use the Service to violate any law, infringe
              third-party rights, transmit malware, probe or disrupt the Service, resell it except
              as expressly permitted by your plan (Agency), or misrepresent the Service's function
              to your own customers — including claiming that the Service makes you or them
              "compliant."
            </p>

            <h2>3. Accounts, Trials, Plans, and Billing</h2>
            <p>
              <strong>3.1 Account.</strong> You must provide accurate account information and keep credentials
              secure. You are responsible for activity under your account.
            </p>
            <p>
              <strong>3.2 Free trial.</strong> New accounts may receive a free trial (7 days unless stated
              otherwise). At trial expiration without upgrade, the widget becomes inactive, access
              to the dashboard is limited until you subscribe, and your captured data is retained
              per Section 6. We may modify or discontinue trial offers at any time.
            </p>
            <p>
              <strong>3.3 Subscriptions.</strong> Paid plans (e.g., Core, Proof, Agency) bill in advance on a
              recurring monthly or annual basis through our payment processor (Stripe). Your
              subscription renews automatically until canceled. Plan features, limits, and pricing
              are described at datarightsos.com and may change per Section 12.
            </p>
            <p>
              <strong>3.4 ALL SALES FINAL — NO REFUNDS.</strong> All fees are non-refundable and non-creditable,
              including for partial billing periods, unused time, downgrades, feature changes, or
              dissatisfaction, except where a refund is required by law. Canceling stops future
              renewals; it does not refund the current period. You retain access through the end of
              the period you paid for.
            </p>
            <p>
              <strong>3.5 Cancellation.</strong> You may cancel at any time from your account or by written
              notice to support@bizooma.com. Downgrades take effect at the next billing cycle.
            </p>
            <p>
              <strong>3.6 Taxes; failed payments.</strong> Fees exclude taxes, which you are responsible for. If
              payment fails, we may retry, suspend, or terminate the Service after notice.
            </p>
            <p>
              <strong>3.7 Promotions.</strong> Promotional or founding-client pricing applies only per its
              stated terms, may be capped or withdrawn prospectively, and has no cash value.
            </p>

            <h2>4. Service Availability and Third Parties</h2>
            <p>
              <strong>4.1 Third-party dependencies.</strong> The Service is built on and depends on third-party
              infrastructure and services, including without limitation cloud hosting and
              deployment platforms, content delivery networks, DNS providers, payment processing
              (Stripe), email delivery providers, and optional integrations you enable (e.g.,
              Zapier, webhooks, analytics, tag platforms).
            </p>
            <p>
              <strong>4.2 NO LIABILITY FOR OUTAGES.</strong> WE DO NOT CONTROL THIRD-PARTY PROVIDERS AND ARE NOT
              RESPONSIBLE OR LIABLE FOR ANY UNAVAILABILITY, DEGRADATION, DATA LOSS, DELAY, OR
              FAILURE OF THE SERVICE CAUSED IN WHOLE OR IN PART BY THIRD-PARTY PROVIDERS, INTERNET
              OR DNS FAILURES, FORCE MAJEURE EVENTS, OR SCHEDULED OR EMERGENCY MAINTENANCE. DURING
              ANY UNAVAILABILITY, THE WIDGET MAY NOT DISPLAY, CAPTURE CONSENTS OR REQUESTS, OR
              ENFORCE PREFERENCES, AND DEADLINE NOTIFICATIONS MAY NOT SEND. YOUR LEGAL OBLIGATIONS
              AND DEADLINES REMAIN YOURS REGARDLESS OF SERVICE AVAILABILITY.
            </p>
            <p>
              <strong>4.3 No SLA except by separate agreement.</strong> The Service is provided without uptime
              commitments. Service level agreements, if any, are available only under a separately
              executed agreement on the Agency plan.
            </p>
            <p>
              <strong>4.4 Integrations are yours.</strong> Integrations you enable (webhooks, Zapier, connected
              apps) act on your instructions. We are not responsible for actions taken, or not
              taken, in your connected systems.
            </p>

            <h2>5. Records, Audit Trail, and Notifications</h2>
            <p>
              <strong>5.1 What the records are.</strong> The Service maintains logs of events it processes —
              requests, verifications, checklist attestations, consent receipts, notifications,
              and related metadata — as reported by your team, your visitors' browsers, and the
              Service's own operations.
            </p>
            <p>
              <strong>5.2 What the records are not.</strong> We do not warrant that any record will be
              admissible in, or sufficient for, any legal, regulatory, or adversarial proceeding,
              or that records establish your compliance. Marketing descriptions of records (e.g.,
              "court-ready") describe format and integrity features (time-stamps, immutability
              within the Service), not a legal guarantee.
            </p>
            <p>
              <strong>5.3 Notifications are a convenience.</strong> Deadline reminders, alerts, and emails are
              provided on a best-effort basis. You remain responsible for meeting your own legal
              deadlines whether or not a notification is sent or received.
            </p>

            <h2>6. Data, Privacy, and Roles</h2>
            <p>
              <strong>6.1 Roles.</strong> For personal information submitted by your website visitors through
              the Service (e.g., requester name, email, state, consent records), you are the
              business/controller and Bizooma is your service provider/processor. We process such
              data only to provide the Service and as permitted by applicable law, and we do not
              sell it or share it for cross-context behavioral advertising.
            </p>
            <p>
              <strong>6.2 DPA.</strong> Where required, a Data Processing Addendum (available at
              datarightsos.com/dpa or on request) is incorporated into these Terms.
            </p>
            <p>
              <strong>6.3 Retention.</strong> Records are retained per your plan's stated retention (e.g.,
              1 year on Core; unlimited on Proof and Agency). On trial expiry, data is retained
              behind the upgrade wall for 90 days. On account termination or cancellation, we may
              delete your data 30 days after the end of your final period; export your records
              before then. We may retain data longer where required by law.
            </p>
            <p>
              <strong>6.4 Security.</strong> We use commercially reasonable safeguards appropriate to the data
              we hold. No system is perfectly secure, and we do not warrant against unauthorized
              access; our liability for security incidents is limited per Section 9.
            </p>
            <p>
              <strong>6.5 Sending on your behalf.</strong> You authorize the Service to send emails to your
              visitors and team (verification links, acknowledgments, completion notices, alerts)
              using your configured business name and reply-to address.
            </p>

            <h2>7. Intellectual Property</h2>
            <p>
              The Service, including software, design, and content we provide, is owned by Bizooma
              and its licensors. We grant you a limited, non-exclusive, non-transferable license to
              use the Service during your subscription per your plan. You retain ownership of your
              content and statements. You grant us a license to host, process, and display your
              content solely to operate the Service. Feedback you provide may be used without
              obligation. "Powered by DataRightsOS" attribution displays per your plan's terms;
              removal is available only on plans that include white-labeling.
            </p>

            <h2>8. Warranty Disclaimer</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, NON-INFRINGEMENT, ACCURACY, AND UNINTERRUPTED OR ERROR-FREE OPERATION.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
            <p>
              (a) BIZOOMA IS NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, GOODWILL, OR DATA;
            </p>
            <p>
              (b) BIZOOMA IS NOT LIABLE FOR ANY FINES, PENALTIES, JUDGMENTS, SETTLEMENTS, DEFENSE
              COSTS, OR OTHER AMOUNTS ARISING FROM ANY REGULATORY ACTION, ENFORCEMENT, LAWSUIT, OR
              CLAIM AGAINST YOU RELATING TO YOUR COMPLIANCE OR NON-COMPLIANCE WITH ANY LAW,
              INCLUDING PRIVACY AND ACCESSIBILITY LAWS;
            </p>
            <p>
              (c) BIZOOMA'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO
              THE SERVICE IS LIMITED TO THE FEES YOU PAID TO BIZOOMA FOR THE SERVICE IN THE TWELVE
              (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.
            </p>
            <p>
              Some jurisdictions do not allow certain limitations; in those, these limits apply to
              the fullest extent permitted.
            </p>

            <h2>10. Indemnification</h2>
            <p>
              You will defend, indemnify, and hold harmless Bizooma and its members, officers, and
              agents from and against any claims, damages, and expenses (including reasonable
              attorneys' fees) arising from: (a) your websites, products, or services; (b) your
              statements and content; (c) your handling of, or failure to handle, consumer
              requests; (d) your violation of law or these Terms; or (e) disputes between you and
              your customers, visitors, or clients (including, for Agency subscribers, your
              clients' end users).
            </p>

            <h2>11. Suspension and Termination</h2>
            <p>
              We may suspend or terminate your access for material breach of these Terms, unlawful
              use, non-payment, or risk to the Service or other subscribers, with notice where
              practicable. You may terminate by canceling per Section 3.5. Sections 1, 2, and 5–15
              survive termination.
            </p>

            <h2>12. Changes to the Service and These Terms</h2>
            <p>
              We may modify the Service and these Terms. For material changes to the Terms, we
              will provide notice (e.g., email or in-dashboard) at least 14 days before they take
              effect; continued use after the effective date constitutes acceptance. Price changes
              apply at your next renewal with prior notice.
            </p>

            <h2>13. Governing Law and Disputes</h2>
            <p>
              These Terms are governed by the laws of the State of Texas, without regard to
              conflict-of-laws rules. The exclusive venue for disputes is the state or federal
              courts located in Randall County, Texas, and the parties consent to personal
              jurisdiction there. The prevailing party is entitled to reasonable attorneys'
              fees. Any claim must be brought within one (1) year after it accrues.
            </p>

            <h2>14. Agency / White-Label Plans</h2>
            <p>
              Agency subscribers may deploy the Service on client sites per their plan. The Agency
              subscriber is Bizooma's customer and is fully responsible for its clients' use,
              configuration, statements, and request handling, and for passing through obligations
              no less protective than these Terms. White-label presentation does not change the
              parties' roles under Section 6 or Bizooma's disclaimers and liability limits.
            </p>

            <h2>15. General</h2>
            <p>
              These Terms, plus any order form, DPA, or Agency MSA, are the entire agreement and
              supersede prior discussions. If any provision is unenforceable, the rest remain in
              effect. No waiver is implied by delay. You may not assign these Terms without our
              consent; we may assign to a successor. Notices to us: Bizooma, LLC,
              support@bizooma.com. Notices to you: your account email.
            </p>

            <hr className="my-8 border-border" />

            <p className="italic">Questions? support@bizooma.com</p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}