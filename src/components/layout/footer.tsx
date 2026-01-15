import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-3">AniLens</h3>
            <p className="text-sm text-muted-foreground">
              A fan-made project for exploring your anime and manga preferences through games and analytics.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  Support AniLens
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/zector66/anilens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-purple-400 transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-muted-foreground">
          <p>
            Not affiliated with AniList. Made with{' '}
            <Heart className="w-3.5 h-3.5 inline text-pink-500" />{' '}
            by the anime community.
          </p>
        </div>
      </div>
    </footer>
  );
}
