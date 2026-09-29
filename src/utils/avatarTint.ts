import type { AvatarTint } from '../theme';

const TINTS: AvatarTint[] = ['blue', 'orange', 'green', 'purple'];

/** Cor estável do avatar a partir do nome (mesmo hash de `core/ui/avatar-color.ts`). */
export function avatarTint(seed: string): AvatarTint {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}
