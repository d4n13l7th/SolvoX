import {apiUrl} from '../config';

export async function sendFeedback(payload){
  const r=await fetch(apiUrl('/api/feedback'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok) throw new Error('Feedback gagal disimpan');
  return r.json();
}
