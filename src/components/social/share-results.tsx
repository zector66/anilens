'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TasteProfile } from '@/types/anilist';
import { Share2, Download, Users, Trophy } from 'lucide-react';

interface ShareResultsProps {
  userScore: number;
  userRank: string;
  tasteProfile: TasteProfile;
  onShare?: () => void;
}

export function ShareResults({ userScore, userRank, tasteProfile }: ShareResultsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: 'My AniList Intelligence Results',
      text: `I scored ${userScore} points and ranked as "${userRank}" on the AniList Intelligence Platform! 🎮`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const text = `Check out my AniList results: ${userScore} points - ${userRank} rank! 🎮`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadResults = () => {
    const results = {
      score: userScore,
      rank: userRank,
      tasteProfile,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anilist-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Your Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Results Summary */}
        <div className="bg-linear-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-purple-900">{userScore}</h3>
              <p className="text-sm text-purple-700">Total Points</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-blue-900">{userRank}</div>
              <p className="text-sm text-blue-700">Your Rank</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-yellow-700">
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Top 10% of users this week!</span>
          </div>
        </div>

        {/* Share Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share Results'}
          </Button>
          
          <Button variant="outline" onClick={downloadResults} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Challenge Friends
          </Button>
        </div>

        {/* Share Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Share Preview</h4>
          <div className="bg-white p-4 rounded border text-center">
            <p className="font-medium text-lg mb-2">
              🎮 I scored {userScore} points on AniList Intelligence!
            </p>
            <p className="text-gray-600 text-sm">
              Ranked as {userRank} • Taste Analysis Complete
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">Share your results on:</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I scored ${userScore} points and ranked as "${userRank}" on AniList Intelligence Platform! 🎮`)}`)}
              className="text-blue-400 hover:text-blue-600"
            >
              Twitter
            </button>
            <button 
              onClick={() => window.open(`https://discord.com/`)}
              className="text-indigo-500 hover:text-indigo-700"
            >
              Discord
            </button>
            <button 
              onClick={() => window.open(`https://reddit.com/submit?url=${encodeURIComponent(window.location.href)}`)}
              className="text-orange-500 hover:text-orange-700"
            >
              Reddit
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
