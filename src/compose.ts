import { coverCrop } from "./photoFit";
import { encodeJpeg } from "./imageEncoding";
import whiteFrame from "./assets/white-frame.png";
import blackFrame from "./assets/black-frame.png";
import wootecoFrame from "./assets/wooteco-frame.png";
import sssokFrame from "./assets/sssok-frame.png";
import kamjiFrame from "./assets/sssok_frame_kamji.png";
import luckyFrame from "./assets/lucky-frame.png";
import friendsFrame from "./assets/friends-frame.png";
import devikaFrame from "./assets/01_devika_frame.png";
import noteFrame from "./assets/02_wave_logo_frame.png";
import deinomiFrame from "./assets/03_bluecat_frame.png";
import yesulinFrame from "./assets/04_yesul_in_frame.png";
import chalkakFrame from "./assets/05_chalkak_frame.png";
import jarihanaFrame from "./assets/06_chair_frame.png";
import careerformFrame from "./assets/07_capybara_frame.png";
import shoutoutFrame from "./assets/08_megaphone_frame.png";
import chaekchekFrame from "./assets/09_bird_frame.png";
import gachigachaFrame from "./assets/10_bubble_frame.png";
import salmonFrame from "./assets/11_salmonbus_frame.png";
import harudleFrame from "./assets/12_harudle_frame.png";
import bibbidiFrame from "./assets/14_wedding_frame.png";
import chongchongFrame from "./assets/15_chongchong_frame.png";
import chongchong2Frame from "./assets/15b_chongchong2_frame.png";
import jachwiFrame from "./assets/16_jachwi_frame.png";
import parkingFrame from "./assets/17_parking_frame.png";
import mapmoryFrame from "./assets/18_mapmory_frame.png";
import rilogFrame from "./assets/19_rilog_frame.png";
import hiyuFrame from "./assets/20_hiyu_frame.png";
import settyFrame from "./assets/21_setty_frame.png";
import dukkeobiFrame from "./assets/22_bokdeokbang_frame.png";

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
    color: "#f2efe6",
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
  {
    category: "teams",
    name: "하루들",
    template: harudleFrame,
    color: "#c9b3f7",
    ink: "#2b1b4d",
  },
  {
    category: "teams",
    name: "비비디",
    template: bibbidiFrame,
    color: "#fbe6a2",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "총총1",
    template: chongchongFrame,
    color: "#2fb968",
    ink: "#ffffff",
  },
  {
    category: "teams",
    name: "총총2",
    template: chongchong2Frame,
    // 1024x1536 판형이고 칸 크기도 제각각이라 전용 좌표를 쓴다.
    size: { width: 1024, height: 1536 },
    slots: [
      { x: 552, y: 110, w: 432, h: 524 },
      { x: 552, y: 655, w: 432, h: 524 },
      { x: 44, y: 362, w: 433, h: 526 },
      { x: 44, y: 912, w: 433, h: 522 },
    ],
    color: "#c2f58c",
    ink: "#1a4d2e",
  },
  {
    category: "teams",
    name: "자취선배",
    template: jachwiFrame,
    color: "#74a9f7",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "주차의민족",
    template: parkingFrame,
    color: "#4553d6",
    ink: "#ffffff",
  },
  {
    category: "teams",
    name: "맵모리",
    template: mapmoryFrame,
    color: "#dff0e7",
    ink: "#2f6b45",
  },
  {
    category: "teams",
    name: "리로그",
    template: rilogFrame,
    color: "#fbfaf2",
    ink: "#141c52",
  },
  {
    category: "teams",
    name: "히유",
    template: hiyuFrame,
    // 다른 프레임보다 칸이 작고 위쪽에 붙어 있어 전용 좌표를 쓴다.
    slots: [
      { x: 653, y: 265, w: 500, h: 585 },
      { x: 653, y: 883, w: 500, h: 585 },
      { x: 53, y: 501, w: 500, h: 585 },
      { x: 53, y: 1119, w: 500, h: 585 },
    ],
    color: "#f2f3f5",
    ink: "#1a1a1a",
  },
  {
    category: "teams",
    name: "세티",
    template: settyFrame,
    color: "#e7f0ff",
    ink: "#1f5fe0",
  },
  {
    category: "teams",
    name: "두꺼비집",
    template: dukkeobiFrame,
    // 지붕을 남기려고 사진 칸만 따로 잡는다.
    slots: [
      { x: 650, y: 250, w: 506, h: 556 },
      { x: 650, y: 850, w: 506, h: 556 },
      { x: 50, y: 530, w: 506, h: 556 },
      { x: 50, y: 1130, w: 506, h: 556 },
    ],
    color: "#f0fbf3",
    ink: "#12a150",
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
// 캔버스를 다 쓰면 0×0으로 줄여 메모리를 돌려준다.
// iPadOS 사파리는 탭마다 캔버스 메모리 한도가 낮아, 프레임을 넘겨볼 때마다
// 1200×1800 캔버스가 쌓이면 프레임이 비거나 탭이 통째로 새로고침된다.
export function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}
const OVERLAY_CACHE = 2;
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
  // 최근 프레임만 남기고 나머지 오버레이 캔버스는 바로 반납한다.
  for (const key of [...overlays.keys()]) {
    if (overlays.size <= OVERLAY_CACHE) break;
    const evicted = overlays.get(key)!;
    overlays.delete(key);
    void evicted.then(releaseCanvas, () => {});
  }
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
  const blob = await encodeJpeg(canvas);
  releaseCanvas(canvas);
  return blob;
}
