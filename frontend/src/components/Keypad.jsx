import React from 'react';

const KEYS = [
  ['7','8','9','x','+'],
  ['4','5','6','y','−'],
  ['1','2','3','/','='],
  ['0','(',')','^','²'],
  ['a','b','c','z','·'],
];

const labelKeys = { x:'variableX', y:'variableY', a:'variableA', b:'variableB', c:'variableC', z:'variableZ', '/':'fraction', '−':'minus', '^':'power', '²':'square', '·':'multiplication' };

export default function Keypad({ value, onChange, onEnter, disabled = false, t, visible = true }) {
  if (!visible) return null;
  const push = (key) => {
    if (disabled) return;
    if (key === 'backspace') return onChange(value.slice(0, -1));
    if (key === 'clear') return onChange('');
    if (key === 'enter') return onEnter();
    onChange(value + key);
  };
  const label = (key) => key === 'backspace' ? '⌫' : key === 'clear' ? t('clearInput') : key === 'enter' ? '↵' : key;
  return (
    <div className="keypad-panel-v24 keypad-panel-v34" aria-label={t('keyboardLabel')}>
      <div className="keypad-grid-v24">
        {KEYS.flat().map((key) => (
          <button key={key} type="button" disabled={disabled} onClick={() => push(key)}
            className={`keypad-key-v24 keypad-key-v64 ${/^\d$/.test(key) ? 'is-number-v64' : ''} ${['+','−','/','·'].includes(key) ? 'is-operator-v64' : ''} ${key==='x'||key==='y'||key==='a'||key==='b'||key==='c'||key==='z'?'is-variable-v34 is-variable-v64':''} ${key==='^'||key==='²'?'is-power is-power-v64':''} ${key==='/'?'is-fraction-v34':''} ${key==='−'?'is-minus-v34':''}`}
            aria-label={labelKeys[key] ? t(labelKeys[key]) : label(key)} title={labelKeys[key] ? t(labelKeys[key]) : label(key)}>
            <span>{label(key)}</span>
          </button>
        ))}
      </div>
      <div className="keypad-footer-v34">
        <button type="button" disabled={disabled} onClick={()=>push('backspace')} className="keypad-key-v24 is-backspace" aria-label={t('backspace')} title={t('backspace')}>⌫</button>
        <button type="button" disabled={disabled} onClick={()=>push('clear')} className="keypad-key-v24 is-clear">{t('clearInput')}</button>
        <button type="button" disabled={disabled} onClick={()=>push('enter')} className="keypad-key-v24 is-enter">↵</button>
      </div>
    </div>
  );
}
