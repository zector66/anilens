// Friend profile comparison utilities

import { TasteSnapshot, FriendComparison } from '@/types/snapshot';

interface CompareInput {
  userSnapshot: TasteSnapshot;
  friendSnapshot: TasteSnapshot;
  userName: string;
  userAvatar?: string;
  friendName: string;
  friendAvatar?: string;
}

export function calculateFriendComparison(input: CompareInput): FriendComparison {
  const { userSnapshot, friendSnapshot, userName, userAvatar, friendName, friendAvatar } = input;

  // Calculate genre overlap
  const userGenres = new Set(userSnapshot.topGenres.map(g => g.name));
  const friendGenres = new Set(friendSnapshot.topGenres.map(g => g.name));
  const sharedGenres = [...userGenres].filter(g => friendGenres.has(g));
  const uniqueUserGenres = [...userGenres].filter(g => !friendGenres.has(g));
  const uniqueFriendGenres = [...friendGenres].filter(g => !userGenres.has(g));
  
  const genreMatch = Math.round(
    (sharedGenres.length / Math.max(userGenres.size, friendGenres.size)) * 100
  );

  // Calculate tag overlap
  const userTags = new Set(userSnapshot.topTags.map(t => t.name));
  const friendTags = new Set(friendSnapshot.topTags.map(t => t.name));
  const sharedTags = [...userTags].filter(t => friendTags.has(t));
  const uniqueUserTags = [...userTags].filter(t => !friendTags.has(t));
  const uniqueFriendTags = [...friendTags].filter(t => !userTags.has(t));
  
  const tagMatch = Math.round(
    (sharedTags.length / Math.max(userTags.size, friendTags.size)) * 100
  );

  // Calculate studio overlap
  const userStudios = new Set(userSnapshot.topStudios.map(s => s.name));
  const friendStudios = new Set(friendSnapshot.topStudios.map(s => s.name));
  const sharedStudios = [...userStudios].filter(s => friendStudios.has(s));
  
  const studioMatch = Math.round(
    (sharedStudios.length / Math.max(userStudios.size, friendStudios.size)) * 100
  );

  // Calculate score correlation (based on mean score similarity)
  const scoreDiff = Math.abs(userSnapshot.stats.meanScore - friendSnapshot.stats.meanScore);
  const scoreCorrelation = Math.round(Math.max(0, 100 - scoreDiff * 10));

  // Calculate overall similarity (weighted average)
  const overall = Math.round(
    genreMatch * 0.35 +
    tagMatch * 0.35 +
    studioMatch * 0.2 +
    scoreCorrelation * 0.1
  );

  return {
    user: {
      id: userSnapshot.userId,
      name: userName,
      avatar: userAvatar,
      snapshot: userSnapshot,
    },
    friend: {
      id: friendSnapshot.userId,
      name: friendName,
      avatar: friendAvatar,
      snapshot: friendSnapshot,
    },
    similarity: {
      overall,
      genreMatch,
      tagMatch,
      studioMatch,
      scoreCorrelation,
    },
    sharedGenres,
    sharedTags,
    sharedStudios,
    uniqueToUser: {
      genres: uniqueUserGenres,
      tags: uniqueUserTags.slice(0, 6),
    },
    uniqueToFriend: {
      genres: uniqueFriendGenres,
      tags: uniqueFriendTags.slice(0, 6),
    },
  };
}

// Create a snapshot from a StudioPosterProfile for comparison
import { StudioPosterProfile } from '@/types/studio';
import { TasteProfile } from '@/types/anilist';
import { generateFingerprint } from '@/lib/fingerprint-generator';
import { generateSnapshotId, generateSnapshotLabel } from '@/types/snapshot';

export function createSnapshotFromProfile(
  profile: StudioPosterProfile,
  tasteProfile: TasteProfile,
  userId: string
): TasteSnapshot {
  const fingerprint = generateFingerprint({
    profile: tasteProfile,
    totalEntries: profile.activityStats.totalTitles,
    completionRate: profile.activityStats.completionRate,
    meanScore: profile.activityStats.meanScore,
    topStudio: profile.topStudiosOrAuthors[0]?.name,
    topGenre: profile.topGenres[0]?.name,
    mode: profile.mode,
  });

  return {
    id: generateSnapshotId(),
    userId,
    createdAt: new Date().toISOString(),
    mode: profile.mode,
    label: generateSnapshotLabel(),
    stats: {
      totalTitles: profile.activityStats.totalTitles,
      meanScore: profile.activityStats.meanScore,
      completionRate: profile.activityStats.completionRate,
      episodesWatched: profile.activityStats.episodesWatched,
      chaptersRead: profile.activityStats.chaptersRead,
    },
    topGenres: profile.topGenres.slice(0, 10).map(g => ({
      name: g.name,
      strength: g.strength,
    })),
    topTags: profile.topTags.slice(0, 15).map(t => ({
      name: t.name,
      strength: t.strength,
    })),
    topStudios: profile.topStudiosOrAuthors.slice(0, 8).map(s => ({
      name: s.name,
      strength: s.strength,
    })),
    metrics: {
      diversityIndex: tasteProfile.behavioralMetrics?.diversityIndex || 0.5,
      nicheIndex: tasteProfile.behavioralMetrics?.nicheIndex || 0.5,
      mainstreamIndex: tasteProfile.behavioralMetrics?.mainstreamIndex || 0.5,
    },
    fingerprint: fingerprint.short,
    archetype: fingerprint.archetype,
  };
}

// Generate a shareable compare link
export function generateCompareLink(userId: string, snapshotId: string): string {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/compare?user=${userId}&snap=${snapshotId}`;
}
