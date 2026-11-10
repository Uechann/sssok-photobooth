import {createHandler} from '../worker/handler.mjs';
const handler = createHandler();
export default {
  fetch(request) {
    const url = new URL(request.url);
    const route = url.searchParams.get('__route');
    if (route) {
      if (!route.startsWith('/api/') && !['/storage','/health'].includes(route)) {
        return Response.json({message:'지원하지 않는 경로입니다.'},{status:404});
      }
      url.pathname = route;
      url.search = '';
      request = new Request(url, request);
    }
    return handler.fetch(request);
  },
};
