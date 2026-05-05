import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsConditionsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/signup" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Signup
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms & Conditions</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: April 7, 2026</p>

          <div className="space-y-6 text-slate-700">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using UNIFIND, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Platform Role (IMPORTANT)</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-900">UNIFIND is a marketplace platform that connects student buyers and sellers.</p>
                <ul className="list-disc pl-6 space-y-1 mt-2 text-amber-800">
                  <li>We do NOT own, sell, or guarantee any products listed</li>
                  <li>We are NOT a party to transactions between users</li>
                  <li>We do NOT verify the quality, safety, or legality of items</li>
                  <li>All transactions are between users directly</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Eligibility:</strong> Must be 18+ or a college student with parental consent</li>
                <li><strong>Verification:</strong> Valid college email (@sigce.edu.in) required</li>
                <li><strong>Accurate Information:</strong> You must provide truthful account details</li>
                <li><strong>Account Security:</strong> You are responsible for maintaining password confidentiality</li>
                <li><strong>No Fake Profiles:</strong> Creating multiple or fake accounts is prohibited</li>
                <li><strong>Account Sharing:</strong> Do not share your account with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Listing Rules</h2>
              <p className="mb-2"><strong>Allowed Items:</strong></p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Textbooks, study materials, notes</li>
                <li>Electronics (laptops, phones, calculators)</li>
                <li>Furniture and dorm essentials</li>
                <li>Clothing and accessories</li>
                <li>Sports equipment</li>
              </ul>
              <p className="mb-2"><strong>Prohibited Items:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Illegal items (drugs, weapons, stolen goods)</li>
                <li>Counterfeit or pirated products</li>
                <li>Hazardous materials</li>
                <li>Adult content or services</li>
                <li>Academic dishonesty tools (pre-written assignments)</li>
              </ul>
              <p className="mt-3"><strong>Listing Requirements:</strong></p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Accurate descriptions and photos</li>
                <li>Honest condition assessment</li>
                <li>Fair pricing</li>
                <li>No misleading information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Transactions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Direct Transactions:</strong> All sales occur directly between users</li>
                <li><strong>Payment:</strong> Users arrange payment methods independently (cash, UPI, etc.)</li>
                <li><strong>Meeting:</strong> We recommend meeting in public, safe locations on campus</li>
                <li><strong>Inspection:</strong> Buyers should inspect items before payment</li>
                <li><strong>No Platform Fees:</strong> Currently, UNIFIND does not charge listing or transaction fees</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Refunds & Disputes</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-2">UNIFIND does not handle refunds or disputes.</p>
                <ul className="list-disc pl-6 space-y-1 text-blue-800">
                  <li>Disputes are between buyer and seller</li>
                  <li>We may provide chat history for evidence</li>
                  <li>We recommend resolving issues amicably</li>
                  <li>Repeated complaints may result in account suspension</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fraud, scams, or deceptive practices</li>
                <li>Harassment, bullying, or threatening behavior</li>
                <li>Spamming or unsolicited advertising</li>
                <li>Impersonating others</li>
                <li>Scraping or automated data collection</li>
                <li>Circumventing security measures</li>
                <li>Posting offensive or inappropriate content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Content Ownership</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Your Content:</strong> You retain ownership of photos, descriptions, and messages</li>
                <li><strong>License to UNIFIND:</strong> You grant us a license to display your content on the platform</li>
                <li><strong>Removal Rights:</strong> We may remove content that violates these terms</li>
                <li><strong>Responsibility:</strong> You are responsible for content you post</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Account Suspension & Termination</h2>
              <p className="mb-2">We reserve the right to suspend or terminate accounts for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of these terms</li>
                <li>Fraudulent activity or scams</li>
                <li>Multiple user complaints</li>
                <li>Illegal activities</li>
                <li>Abusive behavior</li>
              </ul>
              <p className="mt-3">Suspended users may appeal by contacting systemrecord07@gmail.com</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Limitation of Liability</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2">IMPORTANT DISCLAIMER:</p>
                <ul className="list-disc pl-6 space-y-1 text-red-800">
                  <li>UNIFIND is provided "AS IS" without warranties</li>
                  <li>We are NOT liable for disputes, damages, or losses between users</li>
                  <li>We are NOT responsible for item quality, safety, or legality</li>
                  <li>We do NOT guarantee platform availability or error-free operation</li>
                  <li>Users assume all risks when buying or selling</li>
                  <li>Maximum liability is limited to ₹1,000 or amount paid (if any)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Second-Hand Goods Disclaimer</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All items are sold "AS-IS" with no warranty from UNIFIND</li>
                <li>Sellers must disclose known defects</li>
                <li>Buyers should inspect items before purchase</li>
                <li>No returns or exchanges unless agreed between users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">12. Communication Monitoring</h2>
              <p>We may monitor chat messages for:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Safety and fraud prevention</li>
                <li>Terms enforcement</li>
                <li>Dispute resolution</li>
                <li>Platform improvement</li>
              </ul>
              <p className="mt-2 text-sm italic">We respect your privacy and only review messages when necessary.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">13. Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>UNIFIND name, logo, and design are our trademarks</li>
                <li>You may not copy, modify, or distribute our platform</li>
                <li>Respect copyright when posting images or content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">14. Dispute Resolution</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Governing Law:</strong> Laws of India and Maharashtra state</li>
                <li><strong>Jurisdiction:</strong> Courts of Navi Mumbai, Maharashtra</li>
                <li><strong>Arbitration:</strong> Disputes may be resolved through arbitration before litigation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">15. Changes to Terms</h2>
              <p>We may update these terms at any time. Significant changes will be notified via email or platform notification. Continued use after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">16. Safety Tips</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-900 mb-2">Stay Safe on UNIFIND:</p>
                <ul className="list-disc pl-6 space-y-1 text-green-800">
                  <li>Meet in public places on campus</li>
                  <li>Bring a friend when meeting sellers/buyers</li>
                  <li>Inspect items thoroughly before paying</li>
                  <li>Avoid advance payments to unknown users</li>
                  <li>Trust your instincts - if something feels wrong, walk away</li>
                  <li>Report suspicious activity immediately</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">17. Contact Us</h2>
              <p>For questions about these terms:</p>
              <ul className="list-none space-y-1 mt-2">
                <li>Email: <a href="mailto:systemrecord07@gmail.com" className="text-indigo-600 hover:underline">systemrecord07@gmail.com</a></li>
                <li>Address: SIGCE, Navi Mumbai, Maharashtra, India</li>
              </ul>
            </section>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 italic">By using UNIFIND, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
