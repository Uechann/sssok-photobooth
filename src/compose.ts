import {encodeJpeg} from "./imageEncoding";
export interface Frame {
  name: string;
  color: string;
  ink: string;
  logo?: string;
}
export const frames: Frame[] = [
  { name: "쏙, 네컷", color: "#fff9ef", ink: "#303329" },
  { name: "우아한테크코스", color: "#c5f467", ink: "#18391f" },
  { name: "sssOK", color: "#7763ee", ink: "#ffffff" },
];
export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("사진을 불러오지 못했어요."));
    image.src = src;
  });
export { encodeJpeg as canvasBlob } from "./imageEncoding";
export async function compose(sources: string[], frame: Frame): Promise<Blob> {
  if (sources.length !== 4) throw new Error("네 장을 선택해 주세요.");
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 2180;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없어요.");
  ctx.fillStyle = frame.color;
  ctx.fillRect(0, 0, 720, 2180);
  const images = await Promise.all(sources.map(loadImage));
  images.forEach((image, i) => {
    const ratio = Math.max(640 / image.width, 460 / image.height);
    const sw = 640 / ratio,
      sh = 460 / ratio;
    ctx.drawImage(
      image,
      (image.width - sw) / 2,
      (image.height - sh) / 2,
      sw,
      sh,
      40,
      40 + i * 480,
      640,
      460,
    );
  });
  ctx.fillStyle = frame.ink;
  ctx.textAlign = "center";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText(frame.name, 360, 2020, 600);
  ctx.font = "18px sans-serif";
  ctx.fillText("WOOWACOURSE 8TH · DEMO DAY", 360, 2060);
  ctx.fillText("우리의 오늘을, 쏙.  /  " + new Date().toLocaleDateString("ko-KR"), 360, 2100);
  if (frame.logo) {
    const logo = await loadImage(frame.logo);
    const r = Math.min(120 / logo.width, 48 / logo.height);
    ctx.drawImage(logo, (720 - logo.width * r) / 2, 2120, logo.width * r, logo.height * r);
  }
  return encodeJpeg(canvas);
}
