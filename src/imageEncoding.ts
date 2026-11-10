// Vercel Functions reject requests above 4.5MB. Leave room for headers/overhead.
export const MAX_IMAGE_BYTES = 4_000_000;
export async function encodeJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  for (const quality of [0.92, 0.82, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      value => value ? resolve(value) : reject(new Error('사진 저장에 실패했어요.')),
      'image/jpeg', quality,
    ));
    if (blob.size <= MAX_IMAGE_BYTES) return blob;
  }
  throw new Error('사진 용량이 너무 커요. 카메라 해상도를 낮추거나 다른 사진을 선택해 주세요.');
}
