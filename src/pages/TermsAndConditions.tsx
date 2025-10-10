export const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms & <span className="text-gradient-primary">Conditions</span>
            </h1>
            <p className="text-muted-foreground">Last Updated: January 2025</p>
          </div>

          <div className="space-y-6 bg-white rounded-xl p-8 border-2 border-light-purple-border">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Xavorian, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms and Conditions, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To access certain features of our Platform, you must register for an account. You agree to:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-6">
                <li>• Provide accurate and complete information during registration</li>
                <li>• Maintain the security of your password and account</li>
                <li>• Notify us immediately of any unauthorized use of your account</li>
                <li>• Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. Property Listings</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Sellers who list properties on Xavorian agree to:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-6">
                <li>• Provide accurate and truthful information about their properties</li>
                <li>• Upload authentic documents (C of O, deeds, surveys)</li>
                <li>• Have legal authority to sell or rent the listed property</li>
                <li>• Comply with all applicable real estate laws and regulations</li>
                <li>• Not engage in fraudulent or deceptive practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Users are expressly prohibited from:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-6">
                <li>• Uploading false or fraudulent documents</li>
                <li>• Misrepresenting property ownership or details</li>
                <li>• Engaging in money laundering or illegal financial activities</li>
                <li>• Harassing, threatening, or abusing other users</li>
                <li>• Attempting to bypass security measures or verification systems</li>
                <li>• Using automated systems to scrape or collect data from the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. Verification and KYC</h2>
              <p className="text-muted-foreground leading-relaxed">
                Xavorian uses AI-powered systems to verify documents and user identities. By using our Platform, you consent to this verification process and agree to provide accurate identification documents when requested. Verification does not guarantee the legitimacy of transactions and users remain responsible for their own due diligence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. Escrow Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Xavorian facilitates escrow services through third-party providers. Users agree to comply with escrow terms and conditions. Xavorian is not liable for disputes, delays, or failures in escrow transactions. All escrow fees are non-refundable once services are rendered.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on Xavorian, including text, graphics, logos, images, and software, is the property of Xavorian or its licensors and is protected by copyright, trademark, and other intellectual property laws. Users may not copy, modify, distribute, or reproduce any content without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                Xavorian reserves the right to suspend or terminate user accounts at any time for violation of these Terms and Conditions, fraudulent activity, or any other reason at our sole discretion. Upon termination, your right to use the Platform will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the jurisdiction where Xavorian is incorporated. Any disputes shall be subject to the exclusive jurisdiction of the courts in that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Xavorian reserves the right to modify these Terms and Conditions at any time. Changes will be posted on this page with an updated "Last Updated" date. Your continued use of the Platform after changes indicates acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">11. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms and Conditions, please contact us at <span className="text-light-purple-accent font-semibold">legal@xavorian.com</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
