import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-foreground mb-6" data-testid="text-terms-title">Terms of Service</h1>
          <p className="text-muted-foreground mb-4">Last updated: February 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-foreground/80 mb-3">
              By accessing or using FemConnect, you agree to be bound by these Terms of Service. If you do not agree 
              to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p className="text-foreground/80 mb-3">To use FemConnect, you must:</p>
            <ul className="list-disc pl-6 text-foreground/80 mb-3 space-y-1">
              <li>Be at least 18 years of age</li>
              <li>Be legally able to enter into a binding contract</li>
              <li>Not be prohibited from using the service under applicable laws</li>
              <li>Not have been previously banned from the service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Account Registration</h2>
            <p className="text-foreground/80 mb-3">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities 
              under your account. You must provide accurate and complete information when creating your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Community Guidelines</h2>
            <p className="text-foreground/80 mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 text-foreground/80 mb-3 space-y-1">
              <li>Harass, threaten, or intimidate other users</li>
              <li>Post content that is illegal, harmful, or offensive</li>
              <li>Impersonate any person or entity</li>
              <li>Share explicit content without consent</li>
              <li>Use the service for commercial purposes without authorization</li>
              <li>Attempt to access other users' accounts</li>
              <li>Use automated systems or bots</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Discriminate against other users</li>
              <li>Share personal information of others without consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">5. User Content</h2>
            <p className="text-foreground/80 mb-3">
              You retain ownership of content you post. By posting content, you grant FemConnect a non-exclusive, 
              royalty-free license to use, modify, and display your content in connection with the service.
            </p>
            <p className="text-foreground/80 mb-3">
              We reserve the right to remove any content that violates these terms or our community guidelines.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Safety and Reporting</h2>
            <p className="text-foreground/80 mb-3">
              FemConnect is committed to creating a safe environment. If you encounter inappropriate behavior or 
              content, please report it immediately. We will review reports and take appropriate action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
            <p className="text-foreground/80 mb-3">
              The FemConnect name, logo, and all related marks are trademarks of FemConnect. You may not use our 
              trademarks without prior written permission. All content and features of the service are protected 
              by copyright and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Termination</h2>
            <p className="text-foreground/80 mb-3">
              We may suspend or terminate your account at any time for violations of these terms. You may also 
              delete your account at any time through your profile settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Disclaimers</h2>
            <p className="text-foreground/80 mb-3">
              FemConnect is provided "as is" without warranties of any kind. We do not guarantee the accuracy 
              of user profiles or that you will find compatible matches. We are not responsible for the conduct 
              of users on or off the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
            <p className="text-foreground/80 mb-3">
              To the maximum extent permitted by law, FemConnect shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Dispute Resolution</h2>
            <p className="text-foreground/80 mb-3">
              Any disputes arising from these terms or the service will be resolved through binding arbitration, 
              except where prohibited by law. You agree to waive any right to participate in class actions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Changes to Terms</h2>
            <p className="text-foreground/80 mb-3">
              We may update these Terms of Service from time to time. Continued use of the service after changes 
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact Us</h2>
            <p className="text-foreground/80 mb-3">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-foreground/80">
              Email: legal@femconnect.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
