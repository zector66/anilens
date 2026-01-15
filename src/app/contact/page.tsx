import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Github, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Contact - AniLens',
  description: 'Get in touch with the AniLens team',
};

export default function ContactPage() {
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
            <CardTitle className="text-3xl">Contact Us</CardTitle>
            <p className="text-sm text-muted-foreground">
              Have questions, feedback, or need help? We&apos;d love to hear from you!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
              <div className="grid gap-4">
                <a
                  href="https://anilist.co/user/criminalize"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-lg border border-white/10 hover:border-purple-500/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">AniList</h3>
                    <p className="text-sm text-muted-foreground">
                      Message me on AniList for questions, feedback, or support
                    </p>
                    <p className="text-sm text-purple-400 mt-2">@criminalize</p>
                  </div>
                </a>

                <a
                  href="https://ko-fi.com/anilens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-lg border border-white/10 hover:border-pink-500/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                    <Heart className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Support AniLens</h3>
                    <p className="text-sm text-muted-foreground">
                      Help keep AniLens running by supporting hosting and development costs
                    </p>
                    <p className="text-sm text-pink-400 mt-2">ko-fi.com/anilens</p>
                  </div>
                </a>
              </div>
            </section>

            <section className="pt-4 border-t border-white/10">
              <h2 className="text-xl font-semibold mb-3">What to Include</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-medium mb-1">Bug Reports</h3>
                  <p className="text-muted-foreground">
                    Include your browser, device, and steps to reproduce the issue. Screenshots help!
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Feature Requests</h3>
                  <p className="text-muted-foreground">
                    Share your ideas and suggestions for improving AniLens
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Data Deletion</h3>
                  <p className="text-muted-foreground">
                    Provide your AniList username and I&apos;ll process your request within 30 days
                  </p>
                </div>
              </div>
            </section>

            <section className="pt-4 border-t border-white/10">
              <p className="text-sm text-muted-foreground">
                AniLens is a solo project. I typically respond within a few days, but please be patient during busy periods.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
