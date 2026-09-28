import React from 'react';
import PixelIcon from './PixelIcon';

export const MULTIPLAYER_CHARACTERS = [
  {id:'mage', name:'Arcane Mage', icon:'pixelMage', roleKey:'roleBurstControl', accent:'#9a7cff'},
  {id:'ninja', name:'Shadow Ninja', icon:'pixelNinja', roleKey:'roleSpeedPrecision', accent:'#5e718c'},
  {id:'robot', name:'Byte Robot', icon:'pixelRobot', roleKey:'roleTankUtility', accent:'#45ddff'},
  {id:'elf', name:'Forest Elf', icon:'pixelElf', roleKey:'roleBalanceSupport', accent:'#5fe391'},
  {id:'hero', name:'Sky Hero', icon:'pixelHero', roleKey:'roleBalancedBrave', accent:'#5ca7ff'},
  {id:'dragon', name:'Dragon Knight', icon:'pixelDragon', roleKey:'rolePowerPressure', accent:'#ff6d7e'},
];

export default function CharacterPicker({value,onChange,compact=false,t}){
  return <div className={`character-picker-v26 ${compact?'compact':''}`}>
    {MULTIPLAYER_CHARACTERS.map(char=><button
      key={char.id}
      type="button"
      className={`character-choice-v26 ${value===char.id?'selected':''}`}
      style={{'--character-accent':char.accent}}
      onClick={()=>onChange?.(char.id)}
      aria-pressed={value===char.id}
    >
      <span className="character-choice-icon-v26"><PixelIcon name={char.icon} size={22}/></span>
      <span className="character-choice-copy-v26">
        <strong>{char.name}</strong>
        <small>{t ? t(char.roleKey) : char.roleKey}</small>
      </span>
      {value===char.id&&<span className="character-check-v26"><PixelIcon name="check" size={10}/></span>}
    </button>)}
  </div>;
}
