import { encodeJpeg } from "./imageEncoding";
import template from "./assets/wooteco-frame.png";
export const TEMPLATE_SIZE = { width: 1200, height: 1800 };
// Printed order on the supplied frame: right top, right bottom, left top, left bottom.
export const TEMPLATE_SLOTS = [
  { x: 650, y: 126, w: 506, h: 614 },
  { x: 650, y: 767, w: 506, h: 614 },
  { x: 50, y: 424, w: 506, h: 614 },
  { x: 50, y: 1065, w: 506, h: 614 },
];
export const frames = [{ name: "우테코 8기", template }];
export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("사진을 불러오지 못했어요."));
    image.src = src;
  });
export { encodeJpeg as canvasBlob } from "./imageEncoding";
let overlay: Promise<HTMLCanvasElement> | undefined;
function frameOverlay() {
  return (overlay ??= loadImage(template)
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
      overlay = undefined;
      throw error;
    }));
}
export async function compose(
  sources: (string | undefined)[],
  _frame = frames[0],
): Promise<Blob> {
  if (sources.length !== 4) throw new Error("네 장을 선택해 주세요.");
  const canvas = document.createElement("canvas");
  Object.assign(canvas, TEMPLATE_SIZE);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없어요.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const images = await Promise.all(
    sources.map((src) => (src ? loadImage(src) : undefined)),
  );
  images.forEach((image, i) => {
    if (!image) return;
    const slot = TEMPLATE_SLOTS[i];
    // Contain preserves the whole face/photo; the white frame fills any spare space.
    const ratio = Math.min(slot.w / image.width, slot.h / image.height);
    const w = image.width * ratio,
      h = image.height * ratio;
    ctx.drawImage(
      image,
      slot.x + (slot.w - w) / 2,
      slot.y + (slot.h - h) / 2,
      w,
      h,
    );
  });
  ctx.drawImage(await frameOverlay(), 0, 0);
  return encodeJpeg(canvas);
}
