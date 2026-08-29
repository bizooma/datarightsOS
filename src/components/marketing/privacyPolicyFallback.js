// BUILD-TIME FALLBACK COPY of our privacy policy.
//
// The live document is the published LegalStatement record; /privacy-policy reads it
// at runtime so both URLs serve one document. This copy exists ONLY for the case where
// that fetch fails: on a legal page, a stale copy of the real text beats "could not
// load". It is rendered with a visible notice pointing at the canonical version, so a
// reader is never misled into treating a possibly-outdated copy as current.
//
// DRIFT IS THE KNOWN COST: editing the statement does NOT update this file. Whenever
// the policy text changes, this constant has to be updated in the same change, or the
// fallback silently starts serving an older policy. Keep VERSION/EFFECTIVE_DATE in
// step too — they are what the notice and header show.
//
// THE DRIFT IS NOT SILENT: the "Privacy Policy Fallback Drift Check" workflow compares
// the published statement to this copy daily and emails when they diverge. After
// editing anything here, update the fingerprint in
// base44/shared/privacyPolicyFallbackMeta.ts — otherwise the alarm keeps firing.
export const FALLBACK_VERSION = '1.0';
export const FALLBACK_EFFECTIVE_DATE = '2026-07-15';
export const FALLBACK_HEADING = 'DataRightsOS — Privacy Policy';

export const PRIVACY_POLICY_FALLBACK_HTML = `<p>This Privacy Policy describes how Bizooma, LLC, a Texas limited liability company ("Bizooma," "we," "us," "our"), collects, uses, stores, shares, and protects information in connection with DataRightsOS — the website datarightsos.com, the dashboard, the embeddable widget, and related services (collectively, the "Service"). It applies to account holders and their authorized team members who sign in to the DataRightsOS dashboard ("you"), including those who sign in using Google.</p>

<p>For personal information submitted by your own website visitors through the widget (e.g., a visitor's data-rights request or cookie consent), you are the business/controller and we act as your service provider/processor; that data is governed by your own privacy policy and our agreement with you, and is described in Section 5 below.</p>

<hr>

<h2>1. Who We Are and How to Contact Us</h2>
<p>DataRightsOS is operated by Bizooma, LLC. If you have any questions about this policy or your data, contact us at <a href="mailto:support@bizooma.com">support@bizooma.com</a> or by mail at Bizooma, LLC, Amarillo, Texas, USA. The data controller for account and sign-in information is Bizooma, LLC.</p>

<h2>2. Information We Collect</h2>
<h3>2.1 Account and sign-in information</h3>
<p>When you create or sign in to a DataRightsOS account, we collect:</p>
<ul>
<li>Your name and email address;</li>
<li>Your role and organization within DataRightsOS;</li>
<li>Authentication identifiers from your chosen sign-in method (Google, Microsoft, or email/password).</li>
</ul>
<h3>2.2 Configuration and content you provide</h3>
<p>Business name, privacy contact email, site domains, brand settings, legal statement content, and internal notes you enter into the dashboard.</p>
<h3>2.3 Billing information</h3>
<p>If you subscribe to a paid plan, payment is processed by Stripe. We receive subscription status and identifiers from Stripe but do not store your full card number.</p>
<h3>2.4 Usage and technical data</h3>
<p>Log data such as IP address, browser type, pages viewed, and timestamps, collected to operate, secure, and improve the Service.</p>

<h2>3. Google User Data</h2>
<p>If you choose to sign in to DataRightsOS with Google, our use of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements. This section comprehensively discloses how our app accesses, uses, stores, and shares Google user data.</p>

<h3>3.1 What Google data we access</h3>
<p>When you sign in with Google, we request only your basic profile information through Google's OAuth sign-in: your name, your email address, and your Google account identifier. We do <strong>not</strong> request or access your Gmail messages, Google Drive files, Google Contacts, Calendar, or any other Google service data. We do not access your Google password — authentication is handled entirely by Google.</p>

<h3>3.2 How we use Google data</h3>
<p>We use the Google profile information described above solely to:</p>
<ul>
<li>Create and authenticate your DataRightsOS account;</li>
<li>Identify you within your organization and display your name to your team;</li>
<li>Send you account-related and service emails at your Google email address.</li>
</ul>
<p>We do <strong>not</strong> use Google user data for advertising, and we do<strong> not</strong> use it to build user profiles for purposes unrelated to providing the Service.</p>

<h3>3.3 How we store Google data</h3>
<p>Your name, email, and Google account identifier are stored in our secured application database (hosted on the Base44 platform) for as long as your account is active. Data in transit is encrypted using TLS. We retain this information until you delete your account or request its deletion, after which it is removed as described in Section 6.</p>

<h3>3.4 How we share Google data</h3>
<p>We do <strong>not</strong> sell Google user data, and we do <strong>not</strong> transfer or share it with third parties except:</p>
<ul>
<li>With infrastructure sub-processors that host and operate the Service on our behalf (e.g., our application hosting platform and our email delivery provider), solely to provide the Service and under confidentiality obligations;</li>
<li>Where required by law, legal process, or to protect our rights and users' safety.</li>
</ul>
<p>We do not transfer Google user data to third parties for their own purposes, for advertising, or for any use unrelated to the DataRightsOS features you use.</p>

<h3>3.5 Revoking access</h3>
<p>You can revoke DataRightsOS's access to your Google account at any time via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account permissions page</a>. You may also delete your DataRightsOS account by contacting <a href="mailto:support@bizooma.com">support@bizooma.com</a>.</p>

<h2>4. How We Use Your Information (Generally)</h2>
<ul>
<li>To provide, maintain, and secure the Service;</li>
<li>To authenticate you and manage your account and organization;</li>
<li>To process subscriptions and billing;</li>
<li>To send transactional and service communications;</li>
<li>To respond to support requests;</li>
<li>To detect, prevent, and address fraud, abuse, and security issues;</li>
<li>To comply with legal obligations.</li>
</ul>
<p>We do not sell your personal information or share it for cross-context behavioral advertising.</p>

<h2>5. Data Submitted by Your Website Visitors</h2>
<p>The Service captures data-rights requests and cookie-consent records from your website visitors on your behalf. For that visitor data, you are the controller/business and we act as your processor/service provider under our agreement with you. We process it only to provide the Service and do not use it for our own purposes, sell it, or share it for advertising. Your own privacy policy governs your collection of that visitor data.</p>

<h2>6. Data Retention and Deletion</h2>
<p>We retain account and sign-in information for as long as your account is active. When you delete your account or request deletion, we delete your personal information within a reasonable period, except where we must retain it to comply with legal obligations, resolve disputes, or enforce our agreements. To request deletion of your data, contact <a href="mailto:support@bizooma.com">support@bizooma.com</a>.</p>

<h2>7. Security</h2>
<p>We use commercially reasonable technical and organizational safeguards to protect your information, including encryption in transit and access controls. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>

<h2>8. Sub-processors and Service Providers</h2>
<p>We rely on trusted providers to operate the Service, including our application hosting and database platform (Base44), our payment processor (Stripe), and our email delivery provider (Resend). These providers process data only as needed to provide their services to us and under confidentiality obligations.</p>

<h2>9. Your Rights</h2>
<p>Depending on where you live, you may have rights to access, correct, delete, or port your personal information, and to object to or restrict certain processing. To exercise these rights, contact <a href="mailto:support@bizooma.com">support@bizooma.com</a>. We will respond as required by applicable law. You will not be discriminated against for exercising your rights.</p>

<h2>10. Children's Privacy</h2>
<p>The Service is intended for businesses and is not directed to children under 16. We do not knowingly collect personal information from children.</p>

<h2>11. International Users</h2>
<p>The Service is operated from the United States. If you access it from outside the U.S., you understand your information will be processed in the United States.</p>

<h2>12. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. If we change how our app uses, accesses, stores, or shares Google user data, or make other material changes, we will update the "Effective date" above and notify affected account holders by email and/or an in-dashboard notice before the change takes effect. Your continued use of the Service after the effective date constitutes acceptance of the updated policy.</p>

<hr>

<p><em>Questions about this policy or your data? Contact <a href="mailto:support@bizooma.com">support@bizooma.com</a>.</em></p>`;