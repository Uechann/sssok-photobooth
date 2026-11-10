const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp'};
export const assetType=name=>{const type=types[name.slice(name.lastIndexOf('.'))];if(!type)throw new Error('지원하지 않는 정적 파일 형식입니다: '+name);return type;};
