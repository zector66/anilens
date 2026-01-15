import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Terms of Service - AniLens',
  description: 'Terms of service and disclaimer for AniLens',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-background to-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 14, 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
              <p className="text-muted-foreground">
                AniLens is a fan-made project and is <strong className="text-foreground">not affiliated with, endorsed by, 
                or connected to AniList</strong> in any way. This is an independent project created by fans for fans.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Service Provided &quot;As Is&quot;</h2>
              <p className="text-muted-foreground mb-3">
                AniLens is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We make no warranties or guarantees about:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li>The accuracy, reliability, or completeness of the service</li>
                <li>Uninterrupted or error-free operation</li>
                <li>The correction of defects or bugs</li>
                <li>The availability of features at any given time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Use of Service</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>By using AniLens, you agree to:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Use the service for personal, non-commercial purposes</li>
                  <li>Not attempt to reverse engineer, hack, or exploit the service</li>
                  <li>Not use automated tools to scrape or abuse the service</li>
                  <li>Respect other users in multiplayer features</li>
                  <li>Comply with AniList&apos;s terms of service when using their API through our platform</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to Features</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue any feature or aspect of AniLens at any time 
                without prior notice. This includes but is not limited to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2 text-muted-foreground">
                <li>Game modes and mechanics</li>
                <li>Taste profile algorithms</li>
                <li>Multiplayer features</li>
                <li>Studio tools and export options</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">External Services</h2>
              <p className="text-muted-foreground mb-3">
                AniLens relies on external services, including but not limited to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li>AniList API for anime and manga data</li>
                <li>Supabase for database services</li>
                <li>Vercel for hosting</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We are <strong className="text-foreground">not responsible</strong> for outages, errors, or issues 
                caused by these external services. If AniList&apos;s API is down, certain features may not work.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">User Content</h2>
              <p className="text-muted-foreground">
                Any content you create using AniLens (such as Studio posters or shared match results) remains yours. 
                However, by sharing content publicly through AniLens, you grant us a non-exclusive license to display 
                and distribute that content as part of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Donations</h2>
              <p className="text-muted-foreground mb-3">
                Donations to support AniLens are:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Voluntary</strong> - No features are locked behind donations</li>
                <li><strong className="text-foreground">Non-refundable</strong> - All donations are final</li>
                <li><strong className="text-foreground">Not purchases</strong> - You are not buying a product or service</li>
                <li><strong className="text-foreground">Appreciated</strong> - They help cover hosting and database costs</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Donations do not entitle you to any special treatment, priority support, or guaranteed features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, AniLens and its creators shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Account Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your access to AniLens at any time for any reason, 
                including but not limited to violation of these terms or abusive behavior.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms at any time. Continued use of AniLens after changes constitutes acceptance 
                of the updated terms. Material changes will be indicated by updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Governing Law</h2>
              <p className="text-muted-foreground">
                These terms shall be governed by and construed in accordance with applicable laws. Any disputes shall 
                be resolved through good faith communication first.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about these terms, please visit our{' '}
                <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">
                  Contact page
                </Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
