import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Heart, Coffee, MessageSquare, Github, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Support AniLens',
  description: 'Support AniLens development and hosting costs',
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-background to-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="space-y-6">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Heart className="w-8 h-8 text-pink-500" />
                Support AniLens
              </CardTitle>
              <CardDescription className="text-base">
                This is a fan project. Donations help cover hosting + database costs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <p className="text-muted-foreground mb-4">
                  AniLens is completely free to use and always will be. However, running the service costs money:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground text-sm">
                  <li>Vercel hosting for the web application</li>
                  <li>Supabase database for user data and multiplayer</li>
                  <li>API costs and bandwidth</li>
                  <li>Development time and maintenance</li>
                </ul>
              </section>

              <section className="pt-4 border-t border-white/10">
                <h2 className="text-xl font-semibold mb-4">Ways to Support</h2>
                <div className="grid gap-4">
                  <a
                    href="https://ko-fi.com/anilens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 rounded-lg border border-white/10 hover:border-pink-500/50 bg-gradient-to-r from-pink-500/5 to-purple-500/5 hover:from-pink-500/10 hover:to-purple-500/10 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                      <Coffee className="w-6 h-6 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Buy me a coffee on Ko-fi</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        One-time donations to help cover hosting costs. Every bit helps!
                      </p>
                      <div className="flex items-center gap-2 text-pink-400 text-sm font-medium">
                        <span>Support on Ko-fi</span>
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </div>
                    </div>
                  </a>
                </div>
              </section>

              <section className="pt-4 border-t border-white/10">
                <h2 className="text-xl font-semibold mb-4">Help for Free</h2>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10">
                    <MessageSquare className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Share Feedback</h3>
                      <p className="text-sm text-muted-foreground">
                        Tell us what you love, what needs work, or what features you want to see
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10">
                    <Star className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Spread the Word</h3>
                      <p className="text-sm text-muted-foreground">
                        Share AniLens with friends, on social media, or in anime communities
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10">
                    <Github className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Contribute Code</h3>
                      <p className="text-sm text-muted-foreground">
                        AniLens is open source! Report bugs, suggest features, or submit pull requests
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="pt-4 border-t border-white/10">
                <h2 className="text-xl font-semibold mb-3">Transparency</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">100% of donations</strong> go toward covering hosting and infrastructure costs.
                  </p>
                  <p>
                    All features are and will remain <strong className="text-foreground">completely free</strong>. 
                    Donations are voluntary and do not unlock any special features or perks.
                  </p>
                  <p>
                    Donations are <strong className="text-foreground">non-refundable</strong> and are considered 
                    voluntary contributions, not purchases.
                  </p>
                </div>
              </section>

              <section className="pt-4 border-t border-white/10">
                <h2 className="text-xl font-semibold mb-3">Thank You!</h2>
                <p className="text-muted-foreground">
                  Whether you donate, share feedback, or just enjoy using AniLens - thank you for being part of this community. 
                  Your support makes this project possible! ❤️
                </p>
              </section>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="text-lg">Questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Have questions about donations or want to discuss other ways to support?
              </p>
              <Link href="/contact">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
