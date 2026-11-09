import React from 'react';
import { createRoot } from 'react-dom/client';
import { PhotoboothPage } from './PhotoboothPage';
import './reset.css';
function SampleGallery() {
 return <main className="booth"><header className="booth-header"><a href="/" className="booth-logo">쏙 <span>PHOTO CLUB</span></a><span className="booth-badge">SHARED ALBUM · DEMO</span></header><section style={{maxWidth:1000,margin:'60px auto'}}><p className="booth-eyebrow">QR로 만나는 우리의 사진방</p><h1>데모데이의 순간들</h1><p>공유 흐름을 보여주는 샘플 방이에요. 촬영한 개인 사진은 서버로 전송되지 않습니다.<br/>실제 서비스에서는 이곳에서 원본과 네컷을 함께 가져갈 수 있어요.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20,margin:'30px 0'}}>{['HELLO!','우리의','오늘을','쏙!'].map((text,i)=><div key={text} style={{aspectRatio:'4/3',background:['#d5e5fd','#ffe1cc','#d9edc2','#e6d9fa'][i],borderRadius:16,display:'grid',placeItems:'center',fontSize:42,fontWeight:800}}>{text}</div>)}</div><a className="booth-download" href="/">나도 포토부스 체험하기 →</a></section></main>;
}
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('view')==='sample-gallery'?<SampleGallery/>:<PhotoboothPage/>);
