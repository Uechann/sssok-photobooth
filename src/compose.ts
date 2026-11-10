import {encodeJpeg} from "./imageEncoding";
import sssokFrame from "./assets/sssok-frame.png";
export interface Frame {
  name: string;
  color: string;
  ink: string;
  logo?: string;
  template?: string;
}
export const SSSOK_TEMPLATE = sssokFrame;
const TEMPLATE_SIZE = { width: 1200, height: 1800 };
const TEMPLATE_SLOTS = [
  { x: 650, y: 126, w: 506, h: 614 },
  { x: 650, y: 767, w: 506, h: 614 },
  { x: 50, y: 424, w: 506, h: 614 },
  { x: 50, y: 1065, w: 506, h: 614 },
];
export const frames: Frame[] = [
  { name: "쏙, 네컷", color: "#fff9ef", ink: "#303329" },
  { name: "우아한테크코스", color: "#c5f467", ink: "#18391f" },
  { name: "sssOK", color: "#ff9654", ink: "#281a14", template: SSSOK_TEMPLATE },
];
export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("사진을 불러오지 못했어요."));
    image.src = src;
  });
export { encodeJpeg as canvasBlob } from "./imageEncoding";
const drawCover = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  const ratio = Math.max(w / image.width, h / image.height);
  const sw = w / ratio,
    sh = h / ratio;
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, w, h);
};
// 템플릿의 사진 자리(흰 사각형)만 투명하게 뚫어, 자리 위에 겹친 스티커는 사진 위에 남긴다.
const punchSlots = (template: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = TEMPLATE_SIZE.width;
  canvas.height = TEMPLATE_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없어요.");
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
  for (const slot of TEMPLATE_SLOTS) {
    const area = ctx.getImageData(slot.x, slot.y, slot.w, slot.h);
    const data = area.data;
    for (let i = 0; i < data.length; i += 4) {
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      data[i + 3] = min >= 250 ? 0 : min <= 235 ? 255 : Math.round(((250 - min) / 15) * 255);
    }
    ctx.putImageData(area, slot.x, slot.y);
  }
  return canvas;
};
async function composeTemplate(sources: string[], frame: Frame): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = TEMPLATE_SIZE.width;
  canvas.height = TEMPLATE_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없어요.");
  const [template, ...images] = await Promise.all([
    loadImage(frame.template!),
    ...sources.map(loadImage),
  ]);
  ctx.fillStyle = frame.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  images.forEach((image, i) => {
    const slot = TEMPLATE_SLOTS[i];
    drawCover(ctx, image, slot.x, slot.y, slot.w, slot.h);
  });
  ctx.drawImage(punchSlots(template), 0, 0);
  return encodeJpeg(canvas);
}
export async function compose(sources: string[], frame: Frame): Promise<Blob> {
  if (sources.length !== 4) throw new Error("네 장을 선택해 주세요.");
  if (frame.template) return composeTemplate(sources, frame);
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 2180;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없어요.");
  ctx.fillStyle = frame.color;
  ctx.fillRect(0, 0, 720, 2180);
  const images = await Promise.all(sources.map(loadImage));
  images.forEach((image, i) => {
    drawCover(ctx, image, 40, 40 + i * 480, 640, 460);
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
