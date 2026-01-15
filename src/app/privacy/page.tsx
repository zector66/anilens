import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Privacy Policy - AniLens',
  description: 'Privacy policy for AniLens - how we handle your data',
};

export default function PrivacyPage() {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 14, 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">Introduction</h2>
              <p className="text-muted-foreground">
                AniLens is a fan-made project that helps you explore your anime and manga preferences through games and analytics. 
                We take your privacy seriously and are committed to being transparent about how we handle your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data We Collect</h2>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-1">AniList Profile Information</h3>
                  <p>When you connect your AniList account, we access:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>User ID, username, avatar, and banner (public profile info)</li>
                    <li>Your anime and manga lists (titles, scores, status)</li>
                    <li>Your favorites and statistics</li>
                  </ul>
                  <p className="mt-2">We only access public information that you've made available on AniList.</p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Game & Activity Data</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Game statistics (MMR, wins, losses, match history)</li>
                    <li>Multiplayer room participation</li>
                    <li>Taste profile results</li>
                    <li>Studio creations and exports</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Settings & Preferences</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Theme preferences (dark/light mode)</li>
                    <li>Sound settings</li>
                    <li>Other UI customizations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Authentication</h3>
                  <p>
                    Your AniList OAuth token is stored securely in your browser's local storage. 
                    We never store your password or share your token with third parties.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">How We Use Your Data</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li>To provide game functionality and personalized experiences</li>
                <li>To calculate taste profiles and compatibility scores</li>
                <li>To maintain leaderboards and match history</li>
                <li>To enable multiplayer features</li>
                <li>To improve the service and fix bugs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">What We Don't Do</h2>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li>We <strong className="text-foreground">never sell</strong> your data</li>
                <li>We <strong className="text-foreground">never share</strong> your data with advertisers</li>
                <li>We <strong className="text-foreground">never access</strong> private AniList information beyond what you authorize</li>
                <li>We <strong className="text-foreground">never send</strong> spam or unwanted communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
              <p className="text-muted-foreground mb-2">AniLens uses the following third-party services:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">AniList API</strong> - For fetching your anime/manga data
                </li>
                <li>
                  <strong className="text-foreground">Supabase</strong> - For storing game data and user statistics
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong> - For hosting the application
                </li>
                <li>
                  <strong className="text-foreground">Ko-fi</strong> - For processing donations (optional)
                </li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Each service has its own privacy policy. We recommend reviewing them if you have concerns.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                We implement reasonable security measures to protect your data. However, no method of transmission 
                over the internet is 100% secure. We cannot guarantee absolute security but we do our best to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Deletion</h2>
              <p className="text-muted-foreground">
                You have the right to request deletion of your data at any time. To delete your data:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                <li>Contact us via the <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">Contact page</Link></li>
                <li>We will process your request within 30 days</li>
                <li>This will remove all your game data, statistics, and stored preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify users of any material changes 
                by updating the "Last updated" date at the top of this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this privacy policy, please visit our{' '}
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
