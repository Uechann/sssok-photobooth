export const MOCK_MODE = 'full';
export const ROUTES = { roomInvite: (_code: string) => '/?view=sample-gallery' };
export const createAnonymous = async (_request: unknown) => ({accessToken:'demo-only', userId:1, nickname:'포토부스', expiresAt:''});
export const saveRoomSession = (_code: string, _session: unknown) => {};
export const createRoom = async (_request: unknown, _token: string) => ({roomId:1,code:'DEMO',name:'데모데이 네컷'});
export const joinRoom = async (_id: number, _token: string, _request: unknown) => {};
export const uploadFiles = async ({files}: {files:File[];roomId:number;token:string}) => {
  await new Promise(resolve => setTimeout(resolve, 900));
  return {registered:files.map(f=>({fileName:f.name})), failed:[] as {file:File}[], rejected:[] as {fileName:string}[]};
};
