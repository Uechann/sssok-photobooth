import { coverCrop } from "./photoFit";
import { encodeJpeg } from "./imageEncoding";
import whiteFrame from "./assets/White · 4×6in@2x.png";
import blackFrame from "./assets/Black · 4×6in@2x.png";
import wootecoFrame from "./assets/wooteco-frame.png";
import sssokFrame from "./assets/sssok-frame.webp";
import kamjiFrame from "./assets/sssok_frame_kamji.webp";
import luckyFrame from "./assets/image (5).webp";
import friendsFrame from "./assets/image (6).webp";
import devikaFrame from "./assets/01_devika_frame.webp";
import noteFrame from "./assets/02_wave_logo_frame.webp";
import deinomiFrame from "./assets/03_bluecat_frame.webp";
import yesulinFrame from "./assets/04_yesul_in_frame.webp";
import chalkakFrame from "./assets/05_chalkak_frame.webp";
import jarihanaFrame from "./assets/06_chair_frame.webp";
import careerformFrame from "./assets/07_capybara_frame.webp";
import shoutoutFrame from "./assets/08_megaphone_frame.webp";
import chaekchekFrame from "./assets/09_bird_frame.webp";
import gachigachaFrame from "./assets/10_bubble_frame.webp";
import salmonFrame from "./assets/11_salmonbus_frame.webp";

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Size {
  width: number;
  height: number;
}
// 판형을 따로 적지 않은 프레임이 쓰는 기본값.
export const TEMPLATE_SIZE: Size = { width: 1200, height: 1800 };
// Printed order on the supplied frame: right top, right bottom, left top, left bottom.
export const TEMPLATE_SLOTS: Slot[] = [
  { x: 650, y: 126, w: 506, h: 614 },
  { x: 650, y: 767, w: 506, h: 614 },
  { x: 50, y: 424, w: 506, h: 614 },
  { x: 50, y: 1065, w: 506, h: 614 },
];
const BASIC_SIZE: Size = { width: 768, height: 1152 };
const BASIC_SLOTS: Slot[] = [
  { x: 396, y: 32, w: 340, h: 400 },
  { x: 396, y: 456, w: 340, h: 400 },
  { x: 32, y: 240, w: 340, h: 400 },
  { x: 32, y: 664, w: 340, h: 400 },
];
const SQUARE_SIZE: Size = { width: 1024, height: 1536 };
export type FrameCategory = "basic" | "wooteco" | "characters" | "teams";
export const frameCategories: { id: FrameCategory; name: string }[] = [
  { id: "basic", name: "기본 프레임" },
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
  /** 프레임 이미지 판형. 없으면 TEMPLATE_SIZE. */
  size?: Size;
  /** 사진이 들어갈 네 칸. 없으면 TEMPLATE_SLOTS. */
  slots?: Slot[];
  /** 사진 자리를 채운 색. 이 색인 부분만 뚫는다. 없으면 흰색. */
  hole?: [number, number, number];
  logo?: string;
}
// Add each supplied frame here with its category. Empty categories stay empty.
export const frames: Frame[] = [
  {
    category: "basic",
    name: "화이트",
    template: whiteFrame,
    size: BASIC_SIZE,
    slots: BASIC_SLOTS,
    hole: [217, 217, 217],
    color: "#fff",
    ink: "#1a1a1a",
  },
  {
    category: "basic",
    name: "블랙",
    template: blackFrame,
    size: BASIC_SIZE,
    slots: BASIC_SLOTS,
    color: "#1a1a1a",
    ink: "#fff",
  },
  {
    category: "wooteco",
    name: "우테코 8기",
    template: wootecoFrame,
    color: "#fff",
    ink: "#1a1a1a",
  },
  {
    category: "characters",
    name: "쏙지",
    template: sssokFrame,
    color: "#ff9654",
    ink: "#281a14",
  },
  {
    category: "characters",
    name: "깜지",
    template: kamjiFrame,
    color: "#2f2d36",
    ink: "#f6f3ea",
  },
  {
    category: "characters",
    name: "행운을 쏙쏙",
    template: luckyFrame,
    size: SQUARE_SIZE,
    slots: [
      { x: 47, y: 120, w: 454, h: 535 },
      { x: 523, y: 118, w: 450, h: 533 },
      { x: 48, y: 826, w: 453, h: 577 },
      { x: 523, y: 827, w: 452, h: 575 },
    ],
    color: "#eff6b0",
    ink: "#2f4a16",
  },
  {
    category: "characters",
    name: "쏙지와 친구들",
    template: friendsFrame,
    size: SQUARE_SIZE,
    slots: [
      { x: 529, y: 122, w: 421, h: 490 },
      { x: 529, y: 644, w: 421, h: 493 },
      { x: 58, y: 379, w: 436, h: 494 },
      { x: 58, y: 904, w: 436, h: 494 },
    ],
    color: "#fde171",
    ink: "#3a2a06",
  },
  {
    category: "teams",
    name: "데비카",
    template: devikaFrame,
    color: "#e4dfd5",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "노트",
    template: noteFrame,
    color: "#1d2223",
    ink: "#ffffff",
  },
  {
    category: "teams",
    name: "데이노미",
    template: deinomiFrame,
    color: "#fbf3ea",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "예술인",
    template: yesulinFrame,
    color: "#0c2c56",
    ink: "#ffffff",
  },
  {
    category: "teams",
    name: "찰캌",
    template: chalkakFrame,
    color: "#faf8f4",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "자리하나?",
    template: jarihanaFrame,
    color: "#e2f7f2",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "커리어폼",
    template: careerformFrame,
    color: "#a6e0fa",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "샤라웆",
    template: shoutoutFrame,
    color: "#2677f9",
    ink: "#ffffff",
  },
  {
    category: "teams",
    name: "책췍",
    template: chaekchekFrame,
    color: "#ff8000",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "가치가챠",
    template: gachigachaFrame,
    color: "#95ccf5",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "연어",
    template: salmonFrame,
    color: "#d75c4a",
    ink: "#ffffff",
  },
];
export function frameLayout(frame: Frame) {
  return frame.template
    ? { size: frame.size ?? TEMPLATE_SIZE, slots: frame.slots ?? TEMPLATE_SLOTS }
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
function frameOverlay(frame: Frame) {
  const source = frame.template!;
  const cached = overlays.get(source);
  if (cached) return cached;
  const { size, slots } = frameLayout(frame);
  const [holeR, holeG, holeB] = frame.hole ?? [255, 255, 255];
  const result = loadImage(source)
    .then((image) => {
      const canvas = document.createElement("canvas");
      Object.assign(canvas, size);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0, size.width, size.height);
      // Only remove the connected photo area. Closed doodles retain their fill.
      for (const slot of slots) {
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
          const gap = Math.max(
            Math.abs(data[at] - holeR),
            Math.abs(data[at + 1] - holeG),
            Math.abs(data[at + 2] - holeB),
          );
          if (gap > 20) continue;
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
  if (frame.template) ctx.drawImage(await frameOverlay(frame), 0, 0);
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
