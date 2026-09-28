export async function sendFeedback(payload){
  const r=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok) throw new Error('Feedback gagal disimpan');
  return r.json();
}
