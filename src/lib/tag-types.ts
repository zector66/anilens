/**
 * TAG TYPES - Shared type definitions for tag mappings
 * Separated to avoid circular imports
 */

export type TagType = 'primary' | 'structural' | 'flavor' | 'content';

export interface TraitMapping {
  traitId: string;
  weight: number;
}

export interface TagDefinition {
  tagName: string;
  type: TagType;
  mappings: TraitMapping[];
}
