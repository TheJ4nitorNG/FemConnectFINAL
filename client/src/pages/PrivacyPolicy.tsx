import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-6" data-testid="text-privacy-title">Privacy Policy</h1>
          <p className="text-muted-foreground mb-4">Last updated: February 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p className="text-foreground/80 mb-3">
              Welcome to FemConnect. We are committed to protecting your personal information and your right to privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              mobile application and website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-foreground mb-2">Personal Information</h3>
            <p className="text-foreground/80 mb-3">We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-foreground/80 mb-3 space-y-1">
              <li>Name and username</li>
              <li>Email address</li>
              <li>Profile information (bio, interests, pronouns)</li>
              <li>Photos you upload</li>
              <li>Messages you send to other users</li>
              <li>Location information (if you choose to share it)</li>
            </ul>
            
            <h3 className="text-lg font-medium text-foreground mb-2">Automatically Collected Information</h3>
            <p className="text-foreground/80 mb-3">When you use our app, we may automatically collect:</p>
            <ul className="list-disc pl-6 text-foreground/80 mb-3 space-y-1">
              <li>Device information (type, operating system)</li>
              <li>Usage data (features used, time spent)</li>
              <li>IP address and general location</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <p className="text-foreground/80 mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-foreground/80 mb-3 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Connect you with other users based on your preferences</li>
              <li>Send you notifications about messages and matches</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Sharing Your Information</h2>
            <p className="text-foreground/80 mb-3">We may share your information in the following situations:</p>
            <ul className="list-disc pl-6 text-foreground/80 mb-3 space-y-1">
              <li><strong>With other users:</strong> Your profile information is visible to other users of the app</li>
              <li><strong>Service providers:</strong> Companies that help us provide our services (hosting, email, analytics)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Safety:</strong> To protect the safety of our users or others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Your Privacy Rights</h2>
            <p className="text-foreground/80 mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-foreground/80 mb-3 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Security</h2>
            <p className="text-foreground/80 mb-3">
              We implement appropriate technical and organizational security measures to protect your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Retention</h2>
            <p className="text-foreground/80 mb-3">
              We retain your personal information for as long as your account is active or as needed to provide you services. 
              You can delete your account at any time, and we will delete your data within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Children's Privacy</h2>
            <p className="text-foreground/80 mb-3">
              FemConnect is not intended for users under 18 years of age. We do not knowingly collect personal 
              information from children under 18. If we learn we have collected such information, we will delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Changes to This Policy</h2>
            <p className="text-foreground/80 mb-3">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact Us</h2>
            <p className="text-foreground/80 mb-3">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-foreground/80">
              Email: privacy@femconnect.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
