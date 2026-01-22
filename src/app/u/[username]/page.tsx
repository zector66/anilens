'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Trophy, Target, Flame, Star, Calendar, TrendingUp, 
  BarChart3, Award, Gamepad2, Clock, ArrowLeft, Share2,
  Medal, Zap, Crown
} from 'lucide-react';
import { FullAniLensProfile, getUserByUsername, getFullProfile } from '@/lib/anilens-profile';
import { anilistClient } from '@/lib/anilist-client';
import { AniListUser } from '@/types/anilist';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<FullAniLensProfile | null>(null);
  const [anilistUser, setAnilistUser] = useState<AniListUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // First try to get from AniLens DB
        const anilensUser = await getUserByUsername(username);
        
        if (anilensUser) {
          const fullProfile = await getFullProfile(anilensUser.anilist_id);
          setProfile(fullProfile);
        }
        
        // Also fetch AniList data for latest stats
        try {
          const anilist = await anilistClient.getUserByUsername(username);
          setAnilistUser(anilist);
        } catch {
          // AniList user not found - that's okay if we have AniLens data
          if (!anilensUser) {
            setError('User not found');
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || (!profile && !anilistUser)) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
          <p className="text-gray-400 mb-6">
            We couldn&apos;t find a user named &quot;{username}&quot;. They may not have logged into AniLens yet.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const user = profile?.user;
  const gameStats = profile?.gameStats;
  const achievements = profile?.achievements || [];
  
  // Use AniList data for display, fall back to cached AniLens data
  const displayName = anilistUser?.name || user?.username || username;
  const avatarUrl = anilistUser?.avatar?.large || user?.avatar_url;
  const bannerUrl = anilistUser?.bannerImage || user?.banner_url;
  const totalAnime = anilistUser?.statistics?.anime?.count || user?.total_anime || 0;
  const totalManga = anilistUser?.statistics?.manga?.count || user?.total_manga || 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${displayName}'s AniLens Profile`,
        text: `Check out ${displayName}'s anime taste profile on AniLens!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Banner + Avatar Section */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 relative overflow-hidden">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt="Profile banner"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
        </div>
        
        {/* Avatar + Name */}
        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#0a0a0f] bg-white/10 shadow-xl">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {user?.taste_title && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-xs font-bold text-white whitespace-nowrap">
                  {user.taste_title}
                </div>
              )}
            </div>
            
            {/* Name + Stats */}
            <div className="flex-1 text-center sm:text-left pb-2">
              <h1 className="text-3xl font-bold text-white mb-2">{displayName}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <span className="text-purple-400 font-bold">{totalAnime}</span>
                  <span className="text-gray-400">anime</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="text-blue-400 font-bold">{totalManga}</span>
                  <span className="text-gray-400">manga</span>
                </div>
                {user?.created_at && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="Share profile"
              >
                <Share2 className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Archetype Cards */}
        {(user?.anime_archetype || user?.manga_archetype) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.anime_archetype && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Star className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-400">Anime Archetype</span>
                </div>
                <h3 className="text-xl font-bold text-white">{user.anime_archetype}</h3>
              </div>
            )}
            {user?.manga_archetype && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Star className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-400">Manga Archetype</span>
                </div>
                <h3 className="text-xl font-bold text-white">{user.manga_archetype}</h3>
              </div>
            )}
          </div>
        )}
        
        {/* Game Stats */}
        {gameStats && gameStats.total_games_played > 0 && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Gamepad2 className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Game Stats</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Games Played</span>
                </div>
                <div className="text-2xl font-bold text-white">{gameStats.total_games_played}</div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Accuracy</span>
                </div>
                <div className="text-2xl font-bold text-white">{gameStats.accuracy_rate.toFixed(1)}%</div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-400">Best Streak</span>
                </div>
                <div className="text-2xl font-bold text-white">{gameStats.longest_streak}</div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">MMR</span>
                </div>
                <div className="text-2xl font-bold text-white">{gameStats.mmr}</div>
                {gameStats.peak_mmr > gameStats.mmr && (
                  <div className="text-xs text-gray-500">Peak: {gameStats.peak_mmr}</div>
                )}
              </div>
            </div>
            
            {/* Daily Challenge Stats */}
            {gameStats.daily_challenges_completed > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Daily Challenges</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Completed:</span>
                    <span className="ml-1 text-white font-bold">{gameStats.daily_challenges_completed}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Current Streak:</span>
                    <span className="ml-1 text-yellow-400 font-bold">{gameStats.daily_current_streak} 🔥</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Best Streak:</span>
                    <span className="ml-1 text-white font-bold">{gameStats.daily_longest_streak}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Multiplayer Stats */}
            {(gameStats.multiplayer_wins + gameStats.multiplayer_losses) > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-white">Multiplayer</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-green-400 font-bold">{gameStats.multiplayer_wins}W</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold">{gameStats.multiplayer_losses}L</span>
                  </div>
                  {gameStats.multiplayer_draws > 0 && (
                    <div>
                      <span className="text-gray-400 font-bold">{gameStats.multiplayer_draws}D</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Achievements</h2>
              <span className="text-sm text-gray-500">({achievements.length})</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {achievements.slice(0, 9).map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`p-3 rounded-xl border ${
                    achievement.achievement_tier === 'platinum' ? 'bg-gradient-to-br from-cyan-500/10 to-white/10 border-cyan-500/30' :
                    achievement.achievement_tier === 'gold' ? 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30' :
                    achievement.achievement_tier === 'silver' ? 'bg-gradient-to-br from-gray-400/10 to-gray-500/10 border-gray-400/30' :
                    'bg-gradient-to-br from-orange-700/10 to-orange-800/10 border-orange-700/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {achievement.achievement_tier === 'platinum' ? <Crown className="w-4 h-4 text-cyan-400" /> :
                     achievement.achievement_tier === 'gold' ? <Medal className="w-4 h-4 text-amber-400" /> :
                     achievement.achievement_tier === 'silver' ? <Medal className="w-4 h-4 text-gray-400" /> :
                     <Zap className="w-4 h-4 text-orange-600" />}
                    <span className="text-sm font-medium text-white truncate">{achievement.achievement_name}</span>
                  </div>
                  {achievement.achievement_description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{achievement.achievement_description}</p>
                  )}
                </div>
              ))}
            </div>
            
            {achievements.length > 9 && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">+{achievements.length - 9} more achievements</span>
              </div>
            )}
          </div>
        )}
        
        {/* CTA for non-users */}
        {!profile && anilistUser && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
            <h3 className="text-lg font-bold text-white mb-2">
              {displayName} hasn&apos;t explored AniLens yet!
            </h3>
            <p className="text-gray-400 mb-4">
              AniLens offers taste analysis, fun games, and personalized recommendations.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Try AniLens Free
            </Link>
          </div>
        )}
        
        {/* Back link */}
        <div className="text-center pt-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to AniLens
          </Link>
        </div>
      </div>
    </div>
  );
}
