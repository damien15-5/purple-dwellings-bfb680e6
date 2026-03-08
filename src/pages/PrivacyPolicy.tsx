export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">XAVORIAN</span> Privacy Policy
            </h1>
            <p className="text-muted-foreground">Effective Date: 1 March 2026</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <p className="text-muted-foreground leading-relaxed">
                Xavorian Technology Company is committed to protecting the privacy of all persons who use the Xavorian Platform. This Privacy Policy explains what personal data we collect, why we collect it, how we use it, how we protect it, and what rights you have in relation to it. This Policy is compliant with the Nigerian Data Protection Regulation 2019 (NDPR) and the Nigeria Data Protection Act 2023.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. WHO WE ARE</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Xavorian Technology Company is the data controller responsible for your personal data collected through the Xavorian Platform. We are incorporated under the laws of the Federal Republic of Nigeria. Our contact details for data protection matters are:
              </p>
              <div className="bg-secondary/50 rounded-lg p-4 text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">Data Protection Officer: Xavorian Technology Company</p>
                <p>Email: <span className="text-light-purple-accent font-semibold">privacy@xavorian.com</span></p>
                <p>Website: <span className="text-light-purple-accent font-semibold">xavorian.com</span></p>
              </div>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. WHAT PERSONAL DATA WE COLLECT</h2>
              <h3 className="text-xl font-semibold mb-3 text-light-purple-accent">2.1 Data You Provide Directly</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you register and use the Platform we collect your full legal name, email address, phone number, date of birth, residential address, National Identification Number (NIN) or Bank Verification Number (BVN) for KYC purposes, profile photo, bank account details for payment and escrow purposes, property documents including title documents submitted with listings, and any other information you provide in your profile or in communications with us.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-light-purple-accent">2.2 Data We Collect Automatically</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you use the Platform we automatically collect your IP address, device type and operating system, browser type and version, pages visited and time spent on each page, search queries and filters applied, listings viewed and time spent on each listing, offers made and received, GPS location data where you grant permission, and session data including login and logout timestamps.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-light-purple-accent">2.3 Data From Third Parties</h3>
              <p className="text-muted-foreground leading-relaxed">
                We receive identity verification data from our KYC partners including verification status, identity match scores, and fraud risk indicators. We receive payment confirmation data from our payment partner Paystack. We do not receive your full NIN or BVN from these partners. We only receive a verification result and a risk score.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. WHY WE COLLECT YOUR DATA AND OUR LEGAL BASIS</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We process your personal data on the following legal bases under the NDPR and the Nigeria Data Protection Act 2023:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li><span className="font-semibold text-light-purple-accent">Contract performance:</span> We process your data to provide the Platform services you have requested including account management, listing publication, offer processing, and escrow services.</li>
                <li><span className="font-semibold text-light-purple-accent">Legal obligation:</span> We process identity data to comply with our KYC obligations and with applicable anti-money laundering and fraud prevention laws in Nigeria.</li>
                <li><span className="font-semibold text-light-purple-accent">Legitimate interests:</span> We process usage data to improve the Platform, detect fraud, ensure platform security, and personalise your experience. Our legitimate interests do not override your rights.</li>
                <li><span className="font-semibold text-light-purple-accent">Consent:</span> Where we process data for marketing communications we do so only with your explicit consent, which you may withdraw at any time.</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. HOW WE USE YOUR DATA</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use your personal data for the following specific purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>To create and manage your account on the Platform.</li>
                <li>To verify your identity through the KYC process as required by law and by our platform rules.</li>
                <li>To publish and manage your property listings.</li>
                <li>To process offers, negotiations, and transactions between Users.</li>
                <li>To operate the Escrow service and facilitate payment protection.</li>
                <li>To monitor communications on the Platform for fraud and scam detection.</li>
                <li>To personalise your search results and listing feed based on your preferences and behaviour.</li>
                <li>To send you transactional notifications including offer alerts, payment confirmations, and dispute updates.</li>
                <li>To send you marketing communications where you have given consent.</li>
                <li>To investigate and resolve disputes between Users.</li>
                <li>To comply with legal obligations including reporting to Nigerian regulatory authorities where required.</li>
                <li>To improve the Platform through analysis of aggregated usage data.</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. HOW WE PROTECT YOUR DATA</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Xavorian takes the security of your personal data seriously. We implement the following technical and organisational measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Your NIN and BVN are stored as irreversible cryptographic hashes. They are never stored in plain text and cannot be reconstructed from the stored hash.</li>
                <li>All data transmitted between your device and our servers is encrypted using HTTPS with HSTS enforcement.</li>
                <li>Access to personal data within Xavorian is restricted on a need-to-know basis. Staff members only access data relevant to their role.</li>
                <li>All payment data is handled by our PCI-compliant payment partner. Xavorian does not store card details or full bank account numbers.</li>
                <li>We conduct regular security assessments of our platform infrastructure.</li>
                <li>We maintain an incident response plan and will notify affected Users and the National Information Technology Development Agency (NITDA) of any data breach as required under Nigerian law within 72 hours of becoming aware of it.</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. HOW LONG WE KEEP YOUR DATA</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We retain your personal data for as long as your account is active and for a period of seven years after account closure to comply with our legal obligations under Nigerian law, including tax and financial record keeping requirements.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Escrow transaction records and audit logs are retained for ten years from the date of the transaction to comply with financial record keeping requirements.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you request deletion of your account, we will delete or anonymise your personal data within thirty days, except where retention is required by law or where data is necessary to resolve an outstanding dispute or enforce a legal claim.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. WHO WE SHARE YOUR DATA WITH</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell your personal data to any third party. We share your data only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><span className="font-semibold text-light-purple-accent">KYC verification partners:</span> We share your NIN or BVN with our identity verification partners solely for the purpose of verifying your identity. These partners are contractually bound to process your data only for this purpose.</li>
                <li><span className="font-semibold text-light-purple-accent">Payment partners:</span> We share transaction details with our payment partner Paystack to facilitate Escrow arrangements and payment processing.</li>
                <li><span className="font-semibold text-light-purple-accent">Notification service providers:</span> We share your contact details with our email, SMS, and notification providers to deliver transactional and marketing communications.</li>
                <li><span className="font-semibold text-light-purple-accent">Legal authorities:</span> We may disclose your data to the Nigerian Police Force, the Economic and Financial Crimes Commission (EFCC), the Independent Corrupt Practices Commission (ICPC), or any other competent Nigerian authority where we are required to do so by law or court order, or where we reasonably believe disclosure is necessary to prevent fraud or protect the safety of our Users.</li>
                <li><span className="font-semibold text-light-purple-accent">Professional advisors:</span> We may share data with our lawyers, auditors, and other professional advisors under strict confidentiality obligations.</li>
                <li><span className="font-semibold text-light-purple-accent">Business transfers:</span> In the event of a merger, acquisition, or sale of all or part of the Xavorian business, your data may be transferred to the acquiring entity, subject to equivalent privacy protections.</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. YOUR RIGHTS UNDER NIGERIAN DATA PROTECTION LAW</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Under the Nigerian Data Protection Regulation 2019 and the Nigeria Data Protection Act 2023, you have the following rights in relation to your personal data:
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-light-purple-accent mb-1">Right of access</h3>
                  <p className="text-muted-foreground">You have the right to request a copy of the personal data we hold about you.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-purple-accent mb-1">Right to rectification</h3>
                  <p className="text-muted-foreground">You have the right to request correction of inaccurate or incomplete personal data we hold about you.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-purple-accent mb-1">Right to erasure</h3>
                  <p className="text-muted-foreground">You have the right to request deletion of your personal data where it is no longer necessary for the purpose for which it was collected, subject to our legal retention obligations.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-purple-accent mb-1">Right to restrict processing</h3>
                  <p className="text-muted-foreground">You have the right to request that we restrict processing of your data in certain circumstances.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-purple-accent mb-1">Right to data portability</h3>
                  <p className="text-muted-foreground">You have the right to receive your personal data in a structured, commonly used, and machine-readable format.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-purple-accent mb-1">Right to object</h3>
                  <p className="text-muted-foreground">You have the right to object to processing of your data for direct marketing purposes at any time.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-purple-accent mb-1">Right to withdraw consent</h3>
                  <p className="text-muted-foreground">Where processing is based on your consent, you have the right to withdraw that consent at any time without affecting the lawfulness of processing before withdrawal.</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise any of these rights, please contact us at privacy@xavorian.com. We will respond to your request within thirty days. Where a request is complex or numerous, we may extend this period by a further sixty days with prior notice to you.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. COOKIES AND TRACKING</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Xavorian Platform uses cookies and similar tracking technologies to maintain your login session, remember your preferences, analyse how you use the Platform, personalise your experience, and improve Platform performance.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                You can control cookie settings through your browser settings. Disabling certain cookies may affect the functionality of the Platform. We do not use cookies to serve third party advertising. We do not share tracking data with advertising networks.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. CHILDREN'S PRIVACY</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Xavorian Platform is not intended for use by persons under the age of eighteen years. We do not knowingly collect personal data from persons under eighteen. If we become aware that we have collected personal data from a person under eighteen we will delete that data immediately. If you believe we have collected data from a minor please contact us at privacy@xavorian.com.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">11. CHANGES TO THIS POLICY</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our data practices or applicable law. We will notify you of material changes by email or through a prominent notice on the Platform at least fourteen days before the changes take effect. Your continued use of the Platform after the effective date of the updated Policy constitutes your acceptance of the changes.
              </p>
            </section>

            <section className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift">
              <h2 className="text-2xl font-bold mb-4 text-foreground">12. HOW TO CONTACT US</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For all privacy related enquiries, requests, or complaints please contact us at:
              </p>
              <div className="bg-secondary/50 rounded-lg p-4 text-muted-foreground mb-4">
                <p className="font-semibold text-foreground mb-2">Xavorian Technology Company — Data Protection Office</p>
                <p>Email: <span className="text-light-purple-accent font-semibold">privacy@xavorian.com</span></p>
                <p>Support: <span className="text-light-purple-accent font-semibold">support@xavorian.com</span></p>
                <p>Website: <span className="text-light-purple-accent font-semibold">xavorian.com</span></p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                If you are not satisfied with our response to a privacy complaint you have the right to lodge a complaint with the National Information Technology Development Agency (NITDA), which is the data protection supervisory authority in Nigeria.
              </p>
            </section>

            <div className="bg-gradient-to-r from-primary/10 to-accent-purple/10 rounded-xl p-8 border-2 border-light-purple-border mt-8">
              <p className="text-foreground font-semibold text-center">
                Trust is not a feature. It is the product.
              </p>
              <p className="text-center text-muted-foreground mt-4">
                xavorian.com | legal@xavorian.com | privacy@xavorian.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
