// Main exports - the only things you should import
export { computeTaste } from './compute/computeTaste';
export { useTaste, useTasteProfile } from '../../hooks/useTaste';
export type { TasteResult, ComputeTasteOptions, TraitView } from './types/TasteResult';

// For advanced usage
export { saveSnapshot, loadSnapshot, deleteSnapshot } from './cache/snapshotStore';
export { adaptToLegacy } from './adapters/legacyAdapter';
