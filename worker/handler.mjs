const API = 'https://api.ssssok.com/api/v1';
const MAX_IMAGE = 20 * 1024 * 1024;
const routes = [
  ['POST', /^\/auth\/anonymous$/], ['POST', /^\/auth\/refresh$/],
  ['POST', /^\/rooms$/], ['GET', /^\/rooms\/[23456789A-HJ-NP-Z]{8}$/],
  ['POST', /^\/rooms\/\d+\/members$/],
  ['POST', /^\/rooms\/\d+\/media\/upload-urls$/],
  ['POST', /^\/rooms\/\d+\/media\/\d+\/upload-url$/],
  ['POST', /^\/rooms\/\d+\/media$/],
];
const jsonError = (message, status) => Response.json({message}, {status, headers:{'Cache-Control':'no-store'}});
export function allowedStorageUrl(value) {
  try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password && !u.port && /^[a-z0-9-]+\.r2\.cloudflarestorage\.com$/.test(u.hostname) && u.searchParams.has('X-Amz-Signature') && u.searchParams.has('X-Amz-Credential');} catch {return false;}
}
export function createHandler(assets = {}, upstreamFetch = fetch) {
 return {async fetch(request) {
  const url = new URL(request.url);
  const secure = response => {
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff'); headers.set('Referrer-Policy','no-referrer');
    headers.set('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
    headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'");
    return new Response(response.body,{status:response.status,headers});
  };
  try {
   if (url.pathname === '/health') return Response.json({status:'ok',service:'sssok-photobooth'});
   if (url.pathname.startsWith('/api/') || url.pathname === '/storage') {
    if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return jsonError('허용되지 않은 출처입니다.',403);
    if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return jsonError('허용되지 않은 요청입니다.',403);
    if (url.pathname === '/storage') {
      const target = request.headers.get('X-Upload-URL');
      if (request.method !== 'PUT' || !target || !allowedStorageUrl(target)) return jsonError('업로드 주소가 올바르지 않습니다.',400);
      if (!request.headers.get('Content-Type')?.startsWith('image/')) return jsonError('이미지만 업로드할 수 있습니다.',415);
      if (Number(request.headers.get('Content-Length')) > MAX_IMAGE) return jsonError('사진은 20MB 이하여야 합니다.',413);
      const bytes = await request.arrayBuffer(); if (bytes.byteLength>MAX_IMAGE) return jsonError('사진은 20MB 이하여야 합니다.',413);
      const headers = new Headers({'Content-Type':request.headers.get('Content-Type')});
      const result = await upstreamFetch(target,{method:'PUT',headers,body:bytes,redirect:'manual',signal:AbortSignal.timeout(60000)});
      return new Response(null,{status:result.status,headers:{'Cache-Control':'no-store'}});
    }
    const path = url.pathname.slice(4);
    if (!routes.some(([method,pattern])=>request.method===method && pattern.test(path))) return jsonError('지원하지 않는 API입니다.',404);
    const headers = new Headers({'Content-Type':'application/json'});
    const auth=request.headers.get('Authorization'); if(auth) headers.set('Authorization',auth);
    let body;
    if(request.method==='POST') {body=await request.text();if(body.length>65536)return jsonError('요청이 너무 큽니다.',413);
      if(path==='/auth/anonymous'){const parsed=JSON.parse(body);parsed.refreshTokenDelivery='BODY';body=JSON.stringify(parsed);}
    }
    const result=await upstreamFetch(API+path,{method:request.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(30000)});
    return new Response(result.body,{status:result.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
   }
   if (!['GET','HEAD'].includes(request.method)) return jsonError('지원하지 않는 요청입니다.',405);
   const key = url.pathname==='/' || url.pathname==='/photobooth' ? '/index.html':url.pathname;
   const asset=assets[key]; if(!asset)return jsonError('페이지를 찾을 수 없습니다.',404);
   const bytes=Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));
   return secure(new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'Cache-Control':key==='/index.html'?'no-cache':'public, max-age=31536000, immutable'}}));
  } catch {return jsonError('서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.',502);}
 }};
}
