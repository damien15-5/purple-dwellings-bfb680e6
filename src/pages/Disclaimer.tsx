import { SEOHead } from '@/components/SEOHead';

export const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Disclaimer" description="Read Xavorian's disclaimer regarding property listings, AI verification, and liability limitations." path="/disclaimer" />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">XAVORIAN</span> Disclaimer
            </h1>
            <p className="text-muted-foreground">Last Updated: January 2025 • Effective Date: January 2025</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. GENERAL DISCLAIMER</h2>
              <p className="text-muted-foreground leading-relaxed">
                Xavorian ("Platform," "we," "us," "our," or "Company") provides a <span className="text-light-purple-accent font-semibold">technology-enabled real estate marketplace</span> platform that facilitates connections between property buyers, sellers, and agents. This Disclaimer outlines the limitations of liability, disclaimers of warranties, and important legal information regarding your use of our Platform and services.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Please note that Xavorian is <span className="text-light-purple-accent font-semibold">not itself a real estate broker</span>, agent, or financial institution. We do not buy, sell, or hold property on our own behalf. We do not provide real estate advice, financial advice, legal advice, or tax advice. Our role is limited to providing the technology platform and infrastructure that enables real estate transactions.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. LIMITATION OF LIABILITY</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">2.1 Disclaimer of Warranties</h3>
              <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-6">
                <p className="text-foreground font-semibold uppercase">
                  XAVORIAN PROVIDES ITS PLATFORM AND SERVICES ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                </p>
              </div>
              <p className="text-muted-foreground mt-4">We do not warrant that:</p>
              <ul className="space-y-2 text-muted-foreground mt-3">
                <li>• Our Platform will be uninterrupted, error-free, or secure</li>
                <li>• All information on our Platform is accurate, complete, or current</li>
                <li>• Defects will be corrected</li>
                <li>• Our servers are free from viruses or harmful components</li>
                <li>• Services will meet your expectations</li>
                <li>• All users are honest or trustworthy</li>
                <li>• Property listings are authentic or legally held</li>
                <li>• AI verification systems are infallible</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">2.2 Limitation of Damages</h3>
              <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-6">
                <p className="text-foreground font-semibold uppercase">
                  IN NO EVENT SHALL XAVORIAN BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST REVENUE, OR LOST DATA.
                </p>
              </div>
              <p className="text-muted-foreground mt-4">
                Our total liability shall not exceed the fees paid by you in the twelve (12) months preceding the claim, or <span className="text-light-purple-accent font-semibold">$100 USD</span>, whichever is greater.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. NO REAL ESTATE ADVICE</h2>
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                <p className="text-foreground font-semibold uppercase">
                  XAVORIAN DOES NOT PROVIDE REAL ESTATE ADVICE, INVESTMENT ADVICE, OR GUIDANCE ON PROPERTY VALUATION.
                </p>
              </div>
              <p className="text-muted-foreground mt-4">We strongly recommend that you:</p>
              <ul className="space-y-3 text-muted-foreground mt-3">
                <li><strong className="text-foreground">Consult licensed real estate agents</strong> in your jurisdiction</li>
                <li><strong className="text-foreground">Hire professional property inspectors</strong> to evaluate physical condition</li>
                <li><strong className="text-foreground">Conduct independent market research</strong> and property valuation</li>
                <li><strong className="text-foreground">Consult real estate attorneys</strong> regarding legal matters</li>
                <li><strong className="text-foreground">Verify all information</strong> through government records and official sources</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. NO FINANCIAL OR INVESTMENT ADVICE</h2>
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                <p className="text-foreground font-semibold uppercase">
                  XAVORIAN DOES NOT PROVIDE FINANCIAL ADVICE, INVESTMENT ADVICE, TAX ADVICE, OR LOAN ADVICE.
                </p>
              </div>
              <p className="text-muted-foreground mt-4">
                Prices, mortgage calculations, rental yield estimates, and other financial information provided on our Platform are <span className="text-light-purple-accent font-semibold">estimates only</span> and should not be relied upon for financial decision-making.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. NO LEGAL ADVICE</h2>
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                <p className="text-foreground font-semibold uppercase">
                  NOTHING ON XAVORIAN CONSTITUTES LEGAL ADVICE.
                </p>
              </div>
              <p className="text-muted-foreground mt-4">
                Real estate transactions involve complex legal issues that vary by jurisdiction. Before entering into any property transaction, you must consult with a <span className="text-light-purple-accent font-semibold">qualified attorney</span> licensed in your jurisdiction.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. PROPERTY LISTINGS DISCLAIMER</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">6.1 Accuracy of Listings</h3>
              <p className="text-muted-foreground">
                While we implement AI verification systems, Xavorian <span className="text-light-purple-accent font-semibold">cannot guarantee</span> the accuracy, completeness, or authenticity of property listings. Sellers are responsible for the accuracy of information they provide.
              </p>
              <p className="text-muted-foreground mt-3">We do not independently verify:</p>
              <ul className="space-y-2 text-muted-foreground mt-3">
                <li>• Property ownership</li>
                <li>• Physical property conditions</li>
                <li>• Property boundaries or survey accuracy</li>
                <li>• Title clarity or liens</li>
                <li>• Zoning compliance</li>
                <li>• Building code compliance</li>
                <li>• Environmental conditions</li>
                <li>• Price accuracy</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">6.2 Verification Limitations</h3>
              <p className="text-muted-foreground">
                Our AI verification system analyzes documents for authenticity and fraud indicators, but <span className="text-light-purple-accent font-semibold">automated systems are not infallible</span>. Even if documents receive "verified" status, this does not guarantee absolute authenticity or legal validity.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">6.3 Sellers' Responsibility</h3>
              <p className="text-muted-foreground">
                Sellers are <span className="text-light-purple-accent font-semibold">solely responsible</span> for the accuracy, legality, and authenticity of listings and documents they provide. Xavorian does not endorse, recommend, or vouch for any sellers or properties.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. COMMUNICATION AND CHAT DISCLAIMER</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">7.1 AI Monitoring</h3>
              <p className="text-muted-foreground">
                Our AI system monitors communications to detect fraud, scams, and violations. However, AI monitoring is <span className="text-light-purple-accent font-semibold">not comprehensive</span> and may not detect all problematic communications.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">7.2 Fraud Prevention Red Flags</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Requests for payment outside the Platform</li>
                <li>• Pressure to move quickly</li>
                <li>• Offers that seem too good to be true</li>
                <li>• Requests for personal financial details</li>
                <li>• Inconsistencies in information</li>
                <li>• Requests to wire money or use untraceable payment methods</li>
                <li>• Unknown sellers with no verification badges</li>
                <li>• Refusal to use secure escrow services</li>
              </ul>
              <p className="text-muted-foreground mt-4 font-semibold text-destructive">
                Report suspected fraud to our support team immediately.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. ESCROW DISCLAIMER</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">8.1 Escrow Process</h3>
              <p className="text-muted-foreground">
                Xavorian facilitates escrow transactions through third-party escrow agents. <span className="text-light-purple-accent font-semibold">Xavorian does not act as an escrow agent itself.</span>
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">8.2 No Guarantee of Transaction Completion</h3>
              <p className="text-muted-foreground">
                Xavorian does not guarantee that escrow transactions will complete successfully. Transactions may fail for numerous reasons including verification failures, document issues, or participant disputes.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">8.3 Dispute Resolution</h3>
              <p className="text-muted-foreground">
                Disputes arising from escrow transactions are subject to our Terms of Service and applicable law. Xavorian is not responsible for resolving disputes or compensating parties for losses.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. USER CONDUCT AND RESPONSIBILITY</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">9.1 Your Responsibility</h3>
              <p className="text-muted-foreground">
                You are <span className="text-light-purple-accent font-semibold">solely responsible</span> for your conduct on the Platform and your interactions with other users.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">9.2 No Endorsement</h3>
              <p className="text-muted-foreground">
                A listing on our Platform does not constitute an endorsement or recommendation by Xavorian.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">9.3 Prohibited Uses</h3>
              <p className="text-muted-foreground">Users agree not to:</p>
              <ul className="space-y-2 text-muted-foreground mt-3">
                <li>• Commit fraud, scams, or misrepresentation</li>
                <li>• Violate applicable laws</li>
                <li>• Infringe intellectual property rights</li>
                <li>• Harass, threaten, or abuse other users</li>
                <li>• Access or tamper with Platform systems</li>
                <li>• Post false or misleading information</li>
                <li>• Conduct illegal transactions</li>
                <li>• Engage in money laundering or sanctions evasion</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. MODIFICATIONS TO DISCLAIMER</h2>
              <p className="text-muted-foreground">
                Xavorian reserves the right to modify this Disclaimer at any time. Changes become effective upon posting to the Platform. Your continued use indicates acceptance of the modified Disclaimer.
              </p>
            </section>

            <div className="bg-gradient-to-r from-primary/10 to-accent-purple/10 rounded-xl p-8 border-2 border-light-purple-border mt-8">
              <p className="text-foreground font-semibold text-center">
                For legal inquiries, contact us at <span className="text-light-purple-accent">legal@xavorian.com</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
