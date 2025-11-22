import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#e6edf7] min-h-screen py-8">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl border border-[#ffcaca] p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#b91c1c] mb-2">Privacy Policy</h1>
            <div className="bg-[#ffe8e8] text-[#b91c1c] text-sm font-medium px-4 py-2 rounded-full inline-block">
              Effective Date: May 24th, 2025
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="text-[#6b7db3] leading-relaxed">
              Swift-lore.com ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy outlines the types of personal information we collect, how we use and safeguard that information, and your rights regarding your data.
            </p>
          </div>

          {/* Section 1 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">1. Information We Collect</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              We may collect the following types of personal information:
            </p>

            {/* Identifiers */}
            <div className="bg-[#ffe8e8] rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#b91c1c] mb-2">Identifiers</h3>
              <p className="text-[#6b7db3] text-sm mb-2">
                Personal information that can identify you directly or indirectly.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Name</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Email address</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">IP address</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Browser type</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Operating system</span>
              </div>
            </div>

            {/* Usage Data */}
            <div className="bg-[#ffe8e8] rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#b91c1c] mb-2">Usage Data</h3>
              <p className="text-[#6b7db3] text-sm mb-2">
                Information about how you interact with our website and services.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Pages visited</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Time on site</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Referring/exit pages</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Clicks</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Scroll depth</span>
              </div>
            </div>

            {/* Device Data */}
            <div className="bg-[#ffe8e8] rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#b91c1c] mb-2">Device Data</h3>
              <p className="text-[#6b7db3] text-sm mb-2">
                Technical information about the device you use to access our website.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Device type</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Operating system</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Screen resolution</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Geographic region</span>
              </div>
            </div>

            {/* Submission Data */}
            <div className="bg-[#ffe8e8] rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#b91c1c] mb-2">Submission Data</h3>
              <p className="text-[#6b7db3] text-sm mb-2">
                Information you voluntarily provide through forms or interactions.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Form submissions</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Suggestions</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Contact inquiries</span>
              </div>
            </div>

            <p className="text-[#6b7db3] leading-relaxed">
              We collect this information through form submissions, analytics tools (e.g., Google Analytics, Plausible), cookies and similar technologies, and embedded content (e.g., Instagram, Twitter).
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">2. How We Use Your Information</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              We use your data to:
            </p>
            <ul className="text-[#6b7db3] mb-4 space-y-1">
              <li>• Analyze website usage and performance</li>
              <li>• Respond to inquiries or submissions</li>
              <li>• Deliver and improve content and user experience</li>
              <li>• Comply with legal obligations</li>
              <li>• Display ads (non-personalized unless you consent otherwise)</li>
            </ul>
            <div className="bg-[#fef2f2] border border-[#b91c1c] rounded-lg p-4">
              <p className="text-[#b91c1c] text-sm font-medium">
                ⚠️ We only process your data when we have a <strong>lawful basis</strong> to do so, such as your consent, our legitimate interests, or a legal obligation.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">3. Cookies and Tracking Technologies</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              We use cookies to:
            </p>
            <ul className="text-[#6b7db3] mb-4 space-y-1">
              <li>• Store user preferences</li>
              <li>• Analyze traffic patterns</li>
              <li>• Serve contextual or personalized advertisements</li>
            </ul>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              You can manage your cookie preferences via our cookie consent banner. Non-essential cookies are only set with your prior consent (required in the EU and other regions). You can change or withdraw your consent at any time by clicking "Cookie Settings" in the site footer.
            </p>
            <div className="bg-[#ffe8e8] rounded-lg p-4 text-center">
              <p className="text-[#b91c1c] font-medium">
                📋 For more information, refer to our <strong>Cookie Policy</strong>
              </p>
            </div>
            {/* Google AdSense Disclosure (Required by Google) */}
<div className="bg-[#fef2f2] border border-[#b91c1c] rounded-lg p-4 mt-6">
  <h3 className="font-semibold text-[#b91c1c] mb-2">Google AdSense & Advertising Partners</h3>
  <p className="text-[#6b7db3] text-sm leading-relaxed">
    Google and its advertising partners may use cookies, web beacons, or similar 
    technologies to serve ads based on your prior visits to this or other websites. 
    Google’s use of advertising cookies enables it and its partners to serve 
    personalized or non-personalized ads to you based on your browsing activity. 
    You can opt out of personalized advertising by visiting 
    Google’s Ads Settings page.
  </p>
</div>
          </div>

          {/* Section 4 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">4. Sharing of Information</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              We may share your data with:
            </p>
            <ul className="text-[#6b7db3] mb-4 space-y-1">
              <li>• Analytics providers (e.g., Google, Plausible)</li>
              <li>• Advertising networks (e.g., Google AdSense)</li>
              <li>• Service providers (e.g., form handling, hosting platforms)</li>
            </ul>
            <div className="bg-[#fef2f2] border border-[#b91c1c] rounded-lg p-4 mb-4">
              <p className="text-[#b91c1c] text-sm font-medium">
                ⚠️ We <strong>do not sell</strong> your personal data.
              </p>
            </div>
            <p className="text-[#6b7db3] leading-relaxed">
              Where required, we enter into Data Processing Agreements (DPAs) with our third-party vendors to ensure GDPR compliance.
            </p>
          </div>

          {/* Section 5 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">5. Data Retention</h2>
            <p className="text-[#6b7db3] leading-relaxed">
              We retain your personal data only for as long as necessary to fulfill the purposes described in this policy or to comply with legal obligations. After that, we either securely delete or anonymize the data.
            </p>
          </div>

          {/* Section 6 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">6. International Data Transfers</h2>
            <p className="text-[#6b7db3] leading-relaxed">
              Our servers may be located in the United States or other countries outside your own. If you are located in the EU or UK, we ensure that your data is protected through appropriate safeguards, such as Standard Contractual Clauses.
            </p>
          </div>

          {/* Section 7 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">7. Your Rights</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              Depending on your location, you have the right to:
            </p>
            <ul className="text-[#6b7db3] mb-4 space-y-1">
              <li>• Access the personal data we hold about you</li>
              <li>• Request correction or deletion of your data</li>
              <li>• Object to or restrict processing</li>
              <li>• Withdraw consent (where applicable)</li>
              <li>• Lodge a complaint with a supervisory authority</li>
            </ul>
            <div className="bg-[#ffe8e8] rounded-lg p-4 text-center">
              <p className="text-[#b91c1c] font-medium">
                📧 To exercise any of these rights, please contact us at <strong>privacy@swift-lore.com</strong>
              </p>
            </div>
          </div>

          {/* Section 8 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">8. Do Not Sell or Share My Information (California Residents)</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              If you are a California resident, you have the right to opt out of the sale or sharing of your personal information. Although we do not sell your data, we may share certain information with ad networks that could be considered "sharing" under CPRA.
            </p>
            <p className="text-[#6b7db3] leading-relaxed">
              To opt out, click on the "Do Not Sell or Share My Personal Information" link in the footer or email us at privacy@swift-lore.com.
            </p>
          </div>

          {/* Section 9 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">9. Children's Privacy</h2>
            <div className="bg-[#fef2f2] border border-[#b91c1c] rounded-lg p-4">
              <p className="text-[#b91c1c] text-sm font-medium">
                ⚠️ Swift-lore.com is <strong>not intended for children</strong> under the age of 13 (or 16 in the EU). We do not knowingly collect data from children. If you believe we have collected such data, please contact us immediately.
              </p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">10. Updates to This Privacy Policy</h2>
            <p className="text-[#6b7db3] leading-relaxed">
              We may update this policy periodically. Any changes will be posted on this page with a new effective date. We encourage you to review this page regularly to stay informed about how we protect your data.
            </p>
          </div>

          {/* Section 11 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">11. Contact Us</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              If you have questions or concerns about this policy or your data, contact us at:
            </p>
            <div className="bg-[#ffe8e8] rounded-lg p-4 text-center">
              <p className="text-[#b91c1c] font-medium">
                📧 <strong>privacy@swift-lore.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="py-8"></div>
    </div>
  );
}