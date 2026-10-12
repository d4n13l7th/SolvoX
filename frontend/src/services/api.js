import { apiUrl } from '../config';

export async function apiFetch(url,options={}){
  const headers=new Headers(options.headers||{});
  if(!headers.has('Content-Type') && options.body!==undefined) headers.set('Content-Type','application/json');
  return fetch(apiUrl(url),{...options,headers});
}
export async function apiJson(url,options={}){
  const response=await apiFetch(url,options);
  let data=null;
  try{data=await response.json();}catch{}
  if(!response.ok) throw Object.assign(new Error(data?.message||`Request failed (${response.status})`),{status:response.status,code:data?.code||'REQUEST_FAILED',data});
  return data;
}
