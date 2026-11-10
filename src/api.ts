import {MAX_IMAGE_BYTES} from "./imageEncoding.ts";
type Session = {accessToken:string;refreshToken:string;expiresAt:string};
let session: Session | null = null;
export function clearSession() { session=null; }
export const ROUTES={roomInvite:(code:string)=>`/join/${code}`};
export const SERVICE_ORIGIN='https://www.ssssok.com';
async function request<T>(path:string,body:unknown,token?:string):Promise<T> {
 const response=await fetch('/api'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
 const data=await response.json(); if(!response.ok)throw new Error(data.message||'요청에 실패했어요. 다시 시도해 주세요.');return data.data;
}
export async function createAnonymous(body:{nickname:string}) {session=await request<Session>('/auth/anonymous',{...body,refreshTokenDelivery:'BODY'});return session;}
async function token(fallback:string) {
 if(session && Date.parse(session.expiresAt)<Date.now()+60000) session=await request<Session>('/auth/refresh',{refreshToken:session.refreshToken});
 return session?.accessToken??fallback;
}
export const createRoom=async(body:unknown,access:string)=>request<{roomId:number;code:string}>('/rooms',body,await token(access));
export const joinRoom=async(id:number,access:string,body:unknown)=>request(`/rooms/${id}/members`,body,await token(access));
type Issued={mediaId:number;fileName:string;uploadUrl:string;headers:Record<string,string>;method:string};
type Entry={issued?:Issued;stored:boolean;registered:boolean};
const entries=new WeakMap<File,Entry>();
export async function uploadFiles({roomId,token:access,files,onProgress}:{roomId:number;token:string;files:File[];onProgress?:(done:number,total:number)=>void}) {
 const failed:{file:File;message:string}[]=[]; const registered:{fileName:string}[]=[];
 for(const file of files) {
  let entry=entries.get(file);if(!entry){entry={stored:false,registered:false};entries.set(file,entry);}
  try {
   if (file.size > MAX_IMAGE_BYTES) throw new Error("사진은 4MB 이하여야 합니다.");
   const auth=await token(access);
   if(!entry.issued){
    const result=await request<{issued:Issued[];rejected:{message:string}[]}>(`/rooms/${roomId}/media/upload-urls`,{files:[{fileName:file.name,mimeType:file.type,size:file.size}]},auth);
    if(!result.issued[0])throw new Error(result.rejected[0]?.message||'사진 업로드가 거절됐어요.');entry.issued=result.issued[0];
   }
   if(!entry.stored){
    let upload=entry.issued;
    let response=await fetch('/storage',{method:'PUT',headers:{...upload.headers,'X-Upload-URL':upload.uploadUrl},body:file,signal:AbortSignal.timeout(65000)});
    if(response.status===403){upload=await request<Issued>(`/rooms/${roomId}/media/${upload.mediaId}/upload-url`,{size:file.size},auth);entry.issued=upload;response=await fetch('/storage',{method:'PUT',headers:{...upload.headers,'X-Upload-URL':upload.uploadUrl},body:file,signal:AbortSignal.timeout(65000)});}
    if(!response.ok)throw new Error('사진 전송에 실패했어요.');entry.stored=true;
   }
   if(!entry.registered){
    const result=await request<{registered:{mediaId:number}[];failed:{mediaId:number;code:string;message:string}[]}>(`/rooms/${roomId}/media`,{mediaIds:[entry.issued.mediaId]},auth);
    if(!result.registered.some(m=>m.mediaId===entry.issued!.mediaId)&&!result.failed.some(m=>m.mediaId===entry.issued!.mediaId&&m.code==='UPLOAD_ALREADY_COMPLETED'))throw new Error(result.failed[0]?.message||'사진 등록 확인에 실패했어요.');entry.registered=true;
   }
   registered.push({fileName:file.name});onProgress?.(registered.length,files.length);
  }catch(e){failed.push({file,message:e instanceof Error?e.message:'업로드 실패'});}
 }
 return {registered,failed,rejected:[] as {fileName:string}[]};
}
