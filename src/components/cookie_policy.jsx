import React from 'react';

export default function CookiePolicyPage() {
  return (
    <div className="bg-[#e6edf7] min-h-screen py-8">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl border border-[#ffcaca] p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#b91c1c] mb-2">Cookie Policy</h1>
            <div className="bg-[#ffe8e8] text-[#b91c1c] text-sm font-medium px-4 py-2 rounded-full inline-block">
              Effective Date: May 24th, 2025
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="text-[#6b7db3] leading-relaxed">
              This Cookie Policy explains how Swift-Lore.com ("we", "us", or "our") uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control their use.
            </p>
          </div>

          {/* Section 1 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">1. What Are Cookies?</h2>
            <p className="text-[#6b7db3] leading-relaxed">
              Cookies are small data files stored on your device when you visit a website. They are widely used to make websites work, improve functionality, and provide information to the site owners.
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">2. Types of Cookies We Use</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              We use the following categories of cookies on Swift-Lore.com:
            </p>

            {/* Essential Cookies */}
            <div className="bg-[#ffe8e8] rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#b91c1c] mb-2">Essential Cookies</h3>
              <p className="text-[#6b7db3] text-sm mb-2">
                These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Session cookies</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Consent banner cookies</span>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="bg-[#ffe8e8] rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#b91c1c] mb-2">Analytics Cookies</h3>
              <p className="text-[#6b7db3] text-sm mb-2">
                These cookies collect information about how visitors use our website. We use this data to improve the site's performance and user experience.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Google Analytics</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Plausible</span>
              </div>
            </div>

            {/* Functionality Cookies */}
            <div className="bg-[#ffe8e8] rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#b91c1c] mb-2">Functionality Cookies</h3>
              <p className="text-[#6b7db3] text-sm mb-2">
                These cookies allow the website to remember choices you make and provide enhanced, more personalized features.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Preference cookies for language</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Layout preferences</span>
              </div>
            </div>

            {/* Advertising & Social Media Cookies */}
            <div className="bg-[#ffe8e8] rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#b91c1c] mb-2">Advertising & Social Media Cookies</h3>
              <p className="text-[#6b7db3] text-sm mb-2">
                These cookies are used to make advertising messages more relevant to you and to enable sharing via social networks. These cookies may track your browsing activity across websites.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Google AdSense</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Twitter embeds</span>
                <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Instagram embeds</span>
              </div>
              <div className="bg-[#fef2f2] border border-[#b91c1c] rounded-lg p-2">
                <p className="text-[#b91c1c] text-xs font-medium">
                  ⚠️ These cookies are only used with your <strong>explicit consent</strong> (required in EU/UK/Brazil).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">3. How to Control Cookies</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              When you first visit Swift-Lore.com, you will see a <strong>cookie consent banner</strong>. You can:
            </p>
            <ul className="text-[#6b7db3] mb-4 space-y-1">
              <li>• Accept all cookies</li>
              <li>• Reject all non-essential cookies</li>
              <li>• Customize your preferences by cookie category</li>
            </ul>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              You can also change or withdraw your consent at any time via the <strong>"Cookie Settings"</strong> link in the website footer.
            </p>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              Additionally, you can control cookies through your browser settings:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Chrome</span>
              <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Firefox</span>
              <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Safari</span>
              <span className="bg-[#8a9ac7] text-white text-xs px-2 py-1 rounded-full">Edge</span>
            </div>
          </div>

          {/* Section 4 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">4. Cookies Set by Third Parties</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              Some cookies on our site are set by third parties:
            </p>
            <ul className="text-[#6b7db3] mb-4 space-y-1">
              <li>• Google (Analytics, AdSense)</li>
              <li>• Twitter (embeds)</li>
              <li>• Instagram (embeds)</li>
            </ul>
            <p className="text-[#6b7db3] leading-relaxed">
              These third parties may use cookies to collect information about your online activities across websites. Please refer to their privacy policies for more information.
            </p>
          </div>

          {/* Section 5 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">5. Changes to This Policy</h2>
            <p className="text-[#6b7db3] leading-relaxed">
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated effective date.
            </p>
          </div>

          {/* Section 6 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#b91c1c] mb-4">6. Contact</h2>
            <p className="text-[#6b7db3] leading-relaxed mb-4">
              If you have any questions about our use of cookies, please email us at:
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