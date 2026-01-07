'use client'

import React, { createContext, useContext, useState } from 'react'

export type MediaType = 'ANIME' | 'MANGA'

interface MediaContextType {
  activeType: MediaType
  isAnime: boolean
  isManga: boolean
  setActiveType: (type: MediaType) => void
  // Helper functions for dynamic terminology
  getMediaTerm: (animeTerm: string, mangaTerm: string) => string
  getWatchReadTerm: (capitalize?: boolean) => string
  getEpisodeChapterTerm: () => string
  getStudioAuthorTerm: () => string
  getSeriesTerm: () => string
}

const MediaContext = createContext<MediaContextType | undefined>(undefined)

export function MediaProvider({ 
  children, 
  activeType: initialActiveType = 'ANIME' 
}: { 
  children: React.ReactNode
  activeType?: MediaType 
}) {
  const [activeType, setActiveType] = useState<MediaType>(initialActiveType)
  const isAnime = activeType === 'ANIME'
  const isManga = activeType === 'MANGA'

  const getMediaTerm = (animeTerm: string, mangaTerm: string) => 
    isAnime ? animeTerm : mangaTerm

  const getWatchReadTerm = (capitalize = false) => {
  const term = getMediaTerm('watch', 'read');
  return capitalize ? term.charAt(0).toUpperCase() + term.slice(1) : term;
}
  const getEpisodeChapterTerm = () => getMediaTerm('episodes', 'chapters')
  const getStudioAuthorTerm = () => getMediaTerm('Favorite Studios', 'Top Authors')
  const getSeriesTerm = () => getMediaTerm('anime', 'manga')

  const value: MediaContextType = {
    activeType,
    isAnime,
    isManga,
    setActiveType,
    getMediaTerm,
    getWatchReadTerm,
    getEpisodeChapterTerm,
    getStudioAuthorTerm,
    getSeriesTerm,
  }

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  const context = useContext(MediaContext)
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider')
  }
  return context
}

// Hook for components that need media-aware terminology
export function useMediaTerms() {
  const { getMediaTerm, getWatchReadTerm, getEpisodeChapterTerm, getStudioAuthorTerm, getSeriesTerm } = useMedia()
  
  return {
    getMediaTerm,
    getWatchReadTerm,
    getEpisodeChapterTerm,
    getStudioAuthorTerm,
    getSeriesTerm,
  }
}
