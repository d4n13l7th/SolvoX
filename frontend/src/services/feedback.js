import {apiJson} from './api';

export async function sendFeedback(payload){return apiJson('/api/feedback',{method:'POST',body:JSON.stringify(payload)});}
