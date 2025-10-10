export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">XAVORIAN</span> Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last Updated: January 2025 • Effective Date: January 2025</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. INTRODUCTION AND OVERVIEW</h2>
              <p className="text-muted-foreground leading-relaxed">
                Xavorian ("we," "us," "our," "Company," or "Platform") is committed to <span className="text-light-purple-accent font-semibold">protecting your privacy</span> and ensuring you have a positive experience on our website and mobile applications (collectively, the "Platform"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Platform and engage with our services, including browsing properties, listing properties for sale or rent, communicating with other users, and conducting property transactions through our secure escrow system.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We understand that privacy is of <span className="text-light-purple-accent font-semibold">paramount importance</span> to users in the real estate industry, particularly given the sensitive nature of property transactions, financial information, and personal identification documents that may be shared through our Platform. This Privacy Policy is designed to be transparent about our data practices and to give you full control over your personal information.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. INFORMATION WE COLLECT</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">2.1 Information You Provide Directly</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong className="text-foreground">Registration Information:</strong> When you create an account, we collect your full name, email address, phone number, physical address, date of birth, and password.</li>
                <li><strong className="text-foreground">Profile Information:</strong> Profile picture, bio, professional credentials, and verification documents.</li>
                <li><strong className="text-foreground">Property Listing Information:</strong> Property address, description, photographs, videos, price, specifications, amenities, and tenure information.</li>
                <li><strong className="text-foreground">Document Uploads:</strong> Certificates of Occupancy (C of O), property deeds, survey documents, and identification documents.</li>
                <li><strong className="text-foreground">Payment Information:</strong> Bank account details, credit card information, cryptocurrency wallet addresses, or mobile money account information.</li>
                <li><strong className="text-foreground">Communication Information:</strong> Messages, files shared, timestamps, and metadata from platform communications.</li>
                <li><strong className="text-foreground">Transaction Information:</strong> Transaction amounts, terms, property details, participant information, and dispute resolutions.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">2.2 Information Collected Automatically</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong className="text-foreground">Device Information:</strong> Hardware model, operating system, unique device identifiers, and mobile network information.</li>
                <li><strong className="text-foreground">Browsing Data:</strong> IP address, browser type, pages visited, search queries, clicks, and clickstream data.</li>
                <li><strong className="text-foreground">Location Information:</strong> Precise geolocation data (with your permission) for location-based services.</li>
                <li><strong className="text-foreground">Cookies and Tracking:</strong> Session-based and persistent cookies for functionality and personalization.</li>
                <li><strong className="text-foreground">Analytics Data:</strong> Aggregated data about user behavior, traffic patterns, and platform performance.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">2.3 Sensitive Personal Information</h3>
              <p className="text-muted-foreground">We collect identification documents, financial information, and biometric data (only as contained in ID documents) for verification and compliance purposes. All sensitive data is encrypted and processed according to <span className="text-light-purple-accent font-semibold">PCI DSS standards</span>.</p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. HOW WE USE YOUR INFORMATION</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">3.1 Primary Uses</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong className="text-foreground">Service Provision:</strong> Creating accounts, displaying listings, processing transactions, managing escrow, and facilitating communication.</li>
                <li><strong className="text-foreground">Verification and Fraud Prevention:</strong> Identity verification through KYC, document authentication via AI, fraud detection, and regulatory compliance.</li>
                <li><strong className="text-foreground">Communication:</strong> Account notifications, transaction updates, security alerts, and support responses.</li>
                <li><strong className="text-foreground">Personalization:</strong> Recommending properties, suggesting features, and customizing content based on preferences.</li>
                <li><strong className="text-foreground">Analytics:</strong> Improving services, fixing bugs, optimizing functionality, and developing new features.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">3.2 AI-Specific Uses</h3>
              <p className="text-muted-foreground">Our AI systems analyze documents for authenticity, monitor communications for fraud detection, identify suspicious transaction patterns, and improve our algorithms using <span className="text-light-purple-accent font-semibold">anonymized data</span>.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">3.3 Legal and Compliance Uses</h3>
              <p className="text-muted-foreground">We use information to comply with KYC requirements, AML regulations, real estate licensing laws, tax regulations, dispute resolution, and law enforcement requests.</p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. HOW WE SHARE YOUR INFORMATION</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">4.1 Information Shared with Other Users</h3>
              <p className="text-muted-foreground">Public listing information is visible to all users. Private messages are only visible to participants. Verification badges show your verified status without revealing documents.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">4.2 Information Shared with Third Parties</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong className="text-foreground">Payment Processors:</strong> PCI DSS compliant processors for transaction processing.</li>
                <li><strong className="text-foreground">AI and Verification Services:</strong> Third-party services for document authentication.</li>
                <li><strong className="text-foreground">Cloud Storage:</strong> Secure cloud servers (AWS, Google Cloud, Azure).</li>
                <li><strong className="text-foreground">Analytics Providers:</strong> Aggregated, anonymized data for analytics.</li>
                <li><strong className="text-foreground">Law Enforcement:</strong> When required by law or court order.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">4.3 Information NOT Shared</h3>
              <p className="text-muted-foreground font-semibold">We do NOT sell your personal information to advertisers or data brokers. Identification documents and banking information are never shared except as required by law.</p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. DATA SECURITY AND PROTECTION</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">5.1 Security Measures</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong className="text-foreground">Encryption:</strong> TLS 1.2+ for data in transit, AES-256 for data at rest.</li>
                <li><strong className="text-foreground">Access Controls:</strong> Role-based access controls (RBAC) with logged monitoring.</li>
                <li><strong className="text-foreground">Authentication:</strong> Strong passwords and two-factor authentication (2FA).</li>
                <li><strong className="text-foreground">Security Audits:</strong> Regular penetration testing and vulnerability assessments.</li>
                <li><strong className="text-foreground">Firewalls:</strong> Protected servers with intrusion detection systems.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">5.2 Breach Notification</h3>
              <p className="text-muted-foreground">In the event of a data breach, we will notify affected users within <span className="text-light-purple-accent font-semibold">30 days</span> with information about the breach, compromised data types, and recommended actions.</p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. DATA RETENTION</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li><strong className="text-foreground">Account Information:</strong> Retained for account duration + 2 years after deletion.</li>
                <li><strong className="text-foreground">Transaction Information:</strong> Retained for 7 years for tax and regulatory compliance.</li>
                <li><strong className="text-foreground">Chat History:</strong> Retained for 3 years unless deletion is requested.</li>
                <li><strong className="text-foreground">Verification Documents:</strong> Retained for 5 years for compliance and fraud prevention.</li>
                <li><strong className="text-foreground">Payment Information:</strong> Retained as required by financial regulations (typically 7 years).</li>
                <li><strong className="text-foreground">Analytics Data:</strong> Aggregated data retained indefinitely; individual data for 1 year.</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. YOUR RIGHTS AND CHOICES</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">7.1 Access and Portability</h3>
              <p className="text-muted-foreground">You have the right to access your personal information and receive a copy in a portable, machine-readable format.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">7.2 Correction and Deletion</h3>
              <p className="text-muted-foreground">You may correct, update, or delete your personal information through your account settings, subject to legal retention requirements.</p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">7.3 Opt-Out Options</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Opt out of promotional emails via unsubscribe link</li>
                <li>• Control cookies through browser settings</li>
                <li>• Disable location services through device settings</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-light-purple-accent">7.4 GDPR Rights (EU Users)</h3>
              <p className="text-muted-foreground">EU users have additional rights under GDPR, including the right to access, correct, delete, restrict processing, object to processing, withdraw consent, and lodge complaints with supervisory authorities.</p>
            </section>

            <div className="bg-gradient-to-r from-primary/10 to-accent-purple/10 rounded-xl p-8 border-2 border-light-purple-border mt-8">
              <p className="text-foreground font-semibold text-center">
                For privacy inquiries, contact us at <span className="text-light-purple-accent">privacy@xavorian.com</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
