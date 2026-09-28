import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import SpriteCharacter from './SpriteCharacter';
import BossMonster from './BossMonster';

const CombatStage = forwardRef(function CombatStage({ levelId, onHit }, ref) {
  const playerRef = useRef(null);
  const bossRef = useRef(null);
  const rootRef = useRef(null);

  const getDistance = () => {
    const root = rootRef.current;
    const player = root?.querySelector('.fighter-player-v43 .sprite-wrap');
    const bossEl = root?.querySelector(
      '.fighter-boss-v43 .asset-boss-sprite-v40',
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
    <div ref={rootRef} className="combat-stage-v43" data-level={levelId}>
      <div className="fighter-slot-v62 fighter-player-slot-v62">
        <div className="fighter-player-v43 player-lane-shift">
          <div className="fighter-shadow-anchor" aria-hidden="true" />
          <SpriteCharacter
            ref={playerRef}
            size={278}
            className="player-sprite"
            onImpact={onHit}
          />
        </div>
      </div>


      <div className="fighter-slot-v62 fighter-boss-slot-v62">
        <div className="fighter-boss-v43">
          <div className="fighter-shadow-anchor" aria-hidden="true" />
          <BossMonster ref={bossRef} levelId={levelId} size={310} />
        </div>
      </div>
    </div>
  );
});

export default CombatStage;
