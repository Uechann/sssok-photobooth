import { coverCrop } from "./photoFit";
import { encodeJpeg } from "./imageEncoding";
import oldTemplate from "./assets/sssok-frame.png";
import template from "./assets/wooteco-frame.png";
export const TEMPLATE_SIZE = { width: 1200, height: 1800 };
// Printed order on the supplied frame: right top, right bottom, left top, left bottom.
export const TEMPLATE_SLOTS = [
  { x: 650, y: 126, w: 506, h: 614 },
  { x: 650, y: 767, w: 506, h: 614 },
  { x: 50, y: 424, w: 506, h: 614 },
  { x: 50, y: 1065, w: 506, h: 614 },
];
export type FrameCategory = "basic" | "wooteco" | "characters" | "teams";
export const frameCategories: { id: FrameCategory; name: string }[] = [
  { id: "basic", name: "기본 검흰" },
  { id: "wooteco", name: "우테코" },
  { id: "characters", name: "쏙지/깜지" },
  { id: "teams", name: "우테코 각 팀" },
];
export interface Frame {
  category: FrameCategory;
  name: string;
  color: string;
  ink: string;
  template?: string;
  logo?: string;
}
// Add each supplied frame here with its category. Empty categories stay empty.
export const frames: Frame[] = [
  { category: "basic", name: "화이트", color: "#fff", ink: "#1a1a1a" },
  { category: "basic", name: "블랙", color: "#1a1a1a", ink: "#fff" },
  {
    category: "wooteco",
    name: "우테코 8기",
    template,
    color: "#fff",
    ink: "#1a1a1a",
  },
  {
    category: "characters",
    name: "쏙지",
    template: oldTemplate,
    color: "#ff9654",
    ink: "#281a14",
  },
];
export function frameLayout(frame: Frame) {
  return frame.template
    ? { size: TEMPLATE_SIZE, slots: TEMPLATE_SLOTS }
    : {
        size: { width: 720, height: 2180 },
        slots: Array.from({ length: 4 }, (_, i) => ({
          x: 40,
          y: 40 + i * 480,
          w: 640,
          h: 460,
        })),
      };
}
export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("사진을 불러오지 못했어요."));
    image.src = src;
  });
export { encodeJpeg as canvasBlob } from "./imageEncoding";
const overlays = new Map<string, Promise<HTMLCanvasElement>>();
function frameOverlay(source: string) {
  const cached = overlays.get(source);
  if (cached) return cached;
  const result = loadImage(source)
    .then((image) => {
      const canvas = document.createElement("canvas");
      Object.assign(canvas, TEMPLATE_SIZE);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      // Only remove the connected white photo area. Closed doodles retain their white fill.
      for (const slot of TEMPLATE_SLOTS) {
        const area = ctx.getImageData(slot.x, slot.y, slot.w, slot.h),
          data = area.data;
        const visited = new Uint8Array(slot.w * slot.h);
        const queue = [
          Math.floor(slot.h / 2) * slot.w + Math.floor(slot.w / 2),
        ];
        for (let head = 0; head < queue.length; head++) {
          const pixel = queue[head];
          if (visited[pixel]) continue;
          visited[pixel] = 1;
          const at = pixel * 4;
          if (Math.min(data[at], data[at + 1], data[at + 2]) < 235) continue;
          data[at + 3] = 0;
          const x = pixel % slot.w,
            y = Math.floor(pixel / slot.w);
          if (x > 0) queue.push(pixel - 1);
          if (x < slot.w - 1) queue.push(pixel + 1);
          if (y > 0) queue.push(pixel - slot.w);
          if (y < slot.h - 1) queue.push(pixel + slot.w);
        }
        ctx.putImageData(area, slot.x, slot.y);
      }
      return canvas;
    })
    .catch((error) => {
      overlays.delete(source);
      throw error;
    });
  overlays.set(source, result);
  return result;
}
export async function compose(
  sources: (string | undefined)[],
  frame: Frame = frames[0],
): Promise<Blob> {
  if (sources.length !== 4) throw new Error("네 장을 선택해 주세요.");
  const canvas = document.createElement("canvas");
  const layout = frameLayout(frame);
  Object.assign(canvas, layout.size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없어요.");
  ctx.fillStyle = frame.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const images = await Promise.all(
    sources.map((src) => (src ? loadImage(src) : undefined)),
  );
  images.forEach((image, i) => {
    if (!image) return;
    const slot = layout.slots[i];
    const crop = coverCrop(image.width, image.height, slot.w, slot.h);
    ctx.drawImage(
      image,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      slot.x,
      slot.y,
      slot.w,
      slot.h,
    );
  });
  if (frame.template) ctx.drawImage(await frameOverlay(frame.template), 0, 0);
  else {
    ctx.fillStyle = frame.ink;
    ctx.textAlign = "center";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(frame.name, 360, 2020, 600);
    ctx.font = "18px sans-serif";
    ctx.fillText("WOOWACOURSE 8TH · DEMO DAY", 360, 2060);
    if (frame.logo) {
      const logo = await loadImage(frame.logo);
      const ratio = Math.min(160 / logo.width, 70 / logo.height);
      ctx.drawImage(
        logo,
        (720 - logo.width * ratio) / 2,
        2090,
        logo.width * ratio,
        logo.height * ratio,
      );
    }
  }
  return encodeJpeg(canvas);
}
