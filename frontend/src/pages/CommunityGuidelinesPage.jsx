import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Heart, AlertTriangle, CheckCircle } from 'lucide-react';

const CommunityGuidelinesPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">Community Guidelines</h1>
          </div>
          <p className="text-sm text-slate-500 mb-8">Building a safe and respectful marketplace together</p>

          <div className="space-y-8 text-slate-700">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-rose-500" />
                <h2 className="text-xl font-bold text-slate-900">Be Respectful</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li>Treat all users with kindness and respect</li>
                <li>Use polite language in messages and listings</li>
                <li>Respect others' time - respond promptly to inquiries</li>
                <li>No harassment, bullying, or discriminatory behavior</li>
                <li>Disagree respectfully if issues arise</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-bold text-slate-900">Be Honest</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate descriptions and photos</li>
                <li>Disclose any defects or issues with items</li>
                <li>Set fair and reasonable prices</li>
                <li>Honor your commitments - don't ghost buyers/sellers</li>
                <li>No fake listings or misleading information</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-900">Stay Safe</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li>Meet in public places on campus (library, cafeteria, main gate)</li>
                <li>Bring a friend when meeting new users</li>
                <li>Inspect items thoroughly before paying</li>
                <li>Avoid sharing personal information (home address, bank details)</li>
                <li>Trust your instincts - if something feels wrong, walk away</li>
                <li>Report suspicious activity immediately</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-900">Don't Do This</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li>❌ Scam or defraud other users</li>
                <li>❌ List prohibited items (illegal goods, weapons, drugs)</li>
                <li>❌ Spam or post irrelevant content</li>
                <li>❌ Create fake accounts or impersonate others</li>
                <li>❌ Harass or threaten other users</li>
                <li>❌ Share academic dishonesty tools</li>
                <li>❌ Post offensive or inappropriate content</li>
              </ul>
            </section>

            <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-indigo-900 mb-3">Reporting Issues</h2>
              <p className="text-indigo-800 mb-3">If you encounter problems or violations:</p>
              <ul className="list-disc pl-6 space-y-1 text-indigo-800">
                <li>Use the "Report" button on listings or profiles</li>
                <li>Email us at: <a href="mailto:systemrecord07@gmail.com" className="underline font-semibold">systemrecord07@gmail.com</a></li>
                <li>Provide details and evidence (screenshots, chat logs)</li>
                <li>We review all reports within 24-48 hours</li>
              </ul>
            </section>

            <section className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-900 mb-3">Good Practices</h2>
              <ul className="list-disc pl-6 space-y-2 text-green-800">
                <li>✅ Take clear, well-lit photos of items</li>
                <li>✅ Write detailed, accurate descriptions</li>
                <li>✅ Respond to messages within 24 hours</li>
                <li>✅ Be flexible with meeting times and locations</li>
                <li>✅ Leave honest reviews after transactions</li>
                <li>✅ Help build a positive community</li>
              </ul>
            </section>

            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-600">
                Together, we can make UNIFIND a safe, trustworthy, and vibrant marketplace for all students.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Questions? Contact us at <a href="mailto:systemrecord07@gmail.com" className="text-indigo-600 hover:underline">systemrecord07@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelinesPage;
