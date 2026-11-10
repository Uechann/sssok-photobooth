export function coverCrop(
  width: number,
  height: number,
  slotWidth: number,
  slotHeight: number,
) {
  const scale = Math.max(slotWidth / width, slotHeight / height);
  const sw = slotWidth / scale,
    sh = slotHeight / scale;
  return {
    sx: (width - sw) * 0.5,
    sy: (height - sh) * 0.5,
    sw,
    sh,
  };
}
