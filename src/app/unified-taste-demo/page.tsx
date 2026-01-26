'use client';

import { UnifiedTraitDisplay } from '@/components/taste/unified-trait-display';

export default function UnifiedTasteDemo() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Unified Taste System Demo</h1>
          <p className="text-gray-400">
            This demonstrates the new ONE SYSTEM approach with TasteResult as the single source of truth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Anime Taste</h2>
            <UnifiedTraitDisplay userId={0} mediaType="ANIME" />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Manga Taste</h2>
            <UnifiedTraitDisplay userId={0} mediaType="MANGA" />
          </div>
        </div>

        <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold mb-3">Key Improvements</h3>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Single <code className="text-purple-400">computeTaste()</code> pipeline</li>
            <li>✅ One <code className="text-purple-400">TasteResult</code> output schema</li>
            <li>✅ Explicit views: Preference, Exposure, Signature</li>
            <li>✅ Clean separation: Compute → Cache → UI</li>
            <li>✅ No more confusion about which system to use</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
