import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { getBossAsset } from '../data/bossAssets';
import { PLAYER_ASSETS } from '../data/playerAssets';
import BossMonster from './BossMonster';
import SpriteCharacter from './SpriteCharacter';

const MultiplayerFighter = forwardRef(function MultiplayerFighter(
  { characterId, levelId, size, mirrored = false, attackDirection = 1, onImpact },
  ref,
) {
  const rendererRef = useRef(null);
  const isPlayer = Boolean(PLAYER_ASSETS[characterId]);
  const isBoss = !isPlayer && Boolean(getBossAsset(characterId));
  const safeCharacterId = isPlayer || isBoss ? characterId : 'traveler';

  useImperativeHandle(ref, () => ({
    play(action, options) {
      return rendererRef.current?.play(action, options);
    },
    idle() {
      rendererRef.current?.idle();
    },
  }), []);

  const className = 'mp-fighter-art';
  return (
    <div className={className}>
      {isBoss ? (
        <BossMonster ref={rendererRef} levelId={levelId} spriteId={safeCharacterId} size={size} mirrored={mirrored} attackDirection={attackDirection} onImpact={onImpact}/>
      ) : (
        <SpriteCharacter ref={rendererRef} playerId={safeCharacterId} size={size} mirrored={mirrored} attackDirection={attackDirection} onImpact={onImpact}/>
      )}
    </div>
  );
});

export default MultiplayerFighter;
