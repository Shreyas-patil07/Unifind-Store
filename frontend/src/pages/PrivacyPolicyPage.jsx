import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/signup" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Signup
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: April 7, 2026</p>

          <div className="space-y-6 text-slate-700">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
              <p>Welcome to UNIFIND. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and protect your information when you use our student marketplace platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Data We Collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, college/university, branch, year of admission</li>
                <li><strong>Profile Data:</strong> Profile photo, bio, hostel room number (optional), phone number (optional)</li>
                <li><strong>Listings:</strong> Product images, descriptions, prices, categories</li>
                <li><strong>Communications:</strong> Messages between users, chat history</li>
                <li><strong>Usage Data:</strong> Device information, IP address, browser type, pages visited</li>
                <li><strong>Payment Information:</strong> Transaction details (if payment features are enabled)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account creation and authentication</li>
                <li>Displaying your listings to other users</li>
                <li>Enabling buyer-seller communication</li>
                <li>Sending notifications about messages, offers, and updates</li>
                <li>Fraud detection and platform moderation</li>
                <li>Improving our services and user experience</li>
                <li>Analytics and usage statistics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Sharing</h2>
              <p className="mb-2">We share your data only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>With Other Users:</strong> Your profile information and listings are visible to other verified students</li>
                <li><strong>With Service Providers:</strong> Cloud hosting (Firebase/Google Cloud), analytics tools</li>
                <li><strong>Payment Processors:</strong> If payment features are enabled (e.g., Razorpay, Stripe)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="mt-2 text-sm italic">We do NOT sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Storage & Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> All data is transmitted over HTTPS with SSL/TLS encryption</li>
                <li><strong>Password Security:</strong> Passwords are hashed and never stored in plain text</li>
                <li><strong>Access Control:</strong> Limited access based on roles and permissions</li>
                <li><strong>Data Retention:</strong> We retain your data as long as your account is active. Deleted accounts are permanently removed within 30 days</li>
                <li><strong>Backups:</strong> Regular backups are maintained for disaster recovery</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Edit:</strong> Update your profile and account information</li>
                <li><strong>Delete:</strong> Request deletion of your account and data</li>
                <li><strong>Withdraw Consent:</strong> Opt-out of non-essential communications</li>
                <li><strong>Data Portability:</strong> Request your data in a portable format</li>
              </ul>
              <p className="mt-2">To exercise these rights, contact us at: <a href="mailto:systemrecord07@gmail.com" className="text-indigo-600 hover:underline">systemrecord07@gmail.com</a></p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Cookies & Tracking</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns (Google Analytics)</li>
                <li>Improve platform performance</li>
              </ul>
              <p className="mt-2">You can disable cookies in your browser settings, but some features may not work properly.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Age Restriction</h2>
              <p>UNIFIND is intended for college students aged 18 and above. Users under 18 must have parental consent. We do not knowingly collect data from children under 13.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. University Verification</h2>
              <p>We verify users through college email addresses (@sigce.edu.in). While we take reasonable measures to verify authenticity, we are not responsible if someone bypasses verification.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Legal Compliance</h2>
              <p>This privacy policy complies with:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Information Technology Act, 2000 (India)</li>
                <li>Digital Personal Data Protection Act, 2023 (India)</li>
                <li>Reasonable security practices as per IT Rules</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify you of significant changes via email or platform notification. Continued use of UNIFIND after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">12. Contact Us</h2>
              <p>For privacy-related questions or concerns:</p>
              <ul className="list-none space-y-1 mt-2">
                <li>Email: <a href="mailto:systemrecord07@gmail.com" className="text-indigo-600 hover:underline">systemrecord07@gmail.com</a></li>
                <li>Address: SIGCE, Navi Mumbai, Maharashtra, India</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
