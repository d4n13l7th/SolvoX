import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import SpriteCharacter from './SpriteCharacter';
import BossMonster from './BossMonster';

const CombatStage = forwardRef(function CombatStage({ levelId, playerId, onHit }, ref) {
  const playerRef = useRef(null);
  const bossRef = useRef(null);
  const rootRef = useRef(null);

  const getDistance = () => {
    const root = rootRef.current;
    const player = root?.querySelector('.fighter-player .sprite-wrap');
    const bossEl = root?.querySelector(
      '.fighter-boss .asset-boss-sprite',
    );

    if (!player || !bossEl) {
      return Math.min(420, Math.max(150, window.innerWidth * 0.18));
    }

    const playerRect = player.getBoundingClientRect();
    const bossRect = bossEl.getBoundingClientRect();
    const gap = Math.max(0, bossRect.left - playerRect.right);
    return Math.max(48, gap + Math.min(10, Math.max(6, gap * 0.015))); 
  };

  useImperativeHandle(ref, () => ({
    playerAttack: () => playerRef.current?.play('attack', { distance: getDistance() }),
    playerHurt: () => playerRef.current?.play('hurt'),
    playerDie: () => playerRef.current?.play('die'),
    bossAttack: () => bossRef.current?.play('attack', { distance: getDistance() }),
    bossHurt: () => bossRef.current?.play('hurt'),
    bossDie: () => bossRef.current?.play('die'),
    idle: () => {
      playerRef.current?.idle();
      bossRef.current?.idle();
    },
  }), []);

  return (
    <div ref={rootRef} className="combat-stage" data-level={levelId}>
      <div className="fighter-slot fighter-player-slot">
        <div className="fighter-player player-lane-shift">
          <div className="fighter-shadow-anchor" aria-hidden="true" />
          <SpriteCharacter
            ref={playerRef}
            size={278}
            className="player-sprite"
            playerId={playerId}
            onImpact={onHit}
          />
        </div>
      </div>


      <div className="fighter-slot fighter-boss-slot">
        <div className="fighter-boss">
          <div className="fighter-shadow-anchor" aria-hidden="true" />
          <BossMonster ref={bossRef} levelId={levelId} size={310} />
        </div>
      </div>
    </div>
  );
});

export default CombatStage;
