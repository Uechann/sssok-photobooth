import { useEffect, useRef, useState } from "react";
import emptyCar from "./assets/subway-empty.png";
import poses from "./assets/subway-poses.png";
import poster from "./assets/subway-01.png";

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
export function SubwayScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  pauseRef.current = paused;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let canceled = false,
      raf = 0,
      last = 0,
      elapsed = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    Promise.all([load(emptyCar), load(poses)])
      .then(([plate, sprites]) => {
        if (canceled) return;
        const W = 1672,
          H = 941;
        const scenery = document.createElement("canvas");
        scenery.width = 1000;
        scenery.height = 340;
        scenery
          .getContext("2d")!
          .drawImage(
            plate,
            (plate.width * 265) / W,
            (plate.height * 95) / H,
            (plate.width * 930) / W,
            (plate.height * 295) / H,
            0,
            0,
            1000,
            340,
          );
        const paint = (now: number) => {
          if (canceled) return;
          const delta = last ? Math.min(now - last, 50) : 0;
          last = now;
          if (!pauseRef.current && !reduced.matches && !document.hidden)
            elapsed += delta / 1000;
          const t = elapsed;
          ctx.clearRect(0, 0, W, H);
          ctx.save();
          // A paired rail-joint impulse, with damped settling between joints.
          const phase = t % 2.8;
          const bump =
            (Math.exp(-phase * 15) * Math.sin(phase * 38) +
              Math.exp(-Math.max(0, phase - 0.2) * 18) *
                Math.sin(Math.max(0, phase - 0.2) * 42)) *
            3;
          ctx.translate(W / 2, H / 2 + Math.sin(t * 3.1) * 1.4 + bump);
          ctx.rotate(Math.sin(t * 2.7) * 0.0015);
          ctx.scale(1.018, 1.018);
          ctx.translate(-W / 2, -H / 2);
          ctx.drawImage(plate, 0, 0, W, H);
          // Scenery moves independently behind each stationary window opening.
          for (const [x, y, w, h] of [
            [242, 73, 987, 337],
            [-45, 74, 191, 336],
            [1534, 117, 180, 328],
          ]) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 22);
            ctx.clip();
            const offset = (t * 92 + x) % 2000;
            for (let k = -2; k < 3; k++) {
              const left = x + k * 1000 - offset;
              ctx.save();
              ctx.translate(left, y);
              if (k % 2 !== 0) {
                ctx.translate(1000, 0);
                ctx.scale(-1, 1);
              }
              ctx.drawImage(scenery, 0, 0, 1000, h);
              ctx.restore();
            }
            const pole = x + w - ((t * 240 + x) % (w + 160));
            ctx.fillStyle = "#30261c38";
            ctx.fillRect(pole, y, 22, h);
            ctx.restore();
          }
          // The straps swing around fixed ceiling anchors instead of moving with the backdrop.
          [78, 460, 800, 1151].forEach((x, i) => {
            ctx.save();
            ctx.translate(x, 0);
            ctx.rotate(
              Math.sin(t * 2.7 + i * 0.35) * 0.065 +
                Math.sin(t * 5 + i) * 0.012,
            );
            ctx.strokeStyle = "#3c291c";
            ctx.lineWidth = 12;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 57);
            ctx.stroke();
            ctx.lineWidth = 9;
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(0, 43);
            ctx.lineTo(-32, 105);
            ctx.quadraticCurveTo(-34, 111, -25, 111);
            ctx.lineTo(27, 111);
            ctx.quadraticCurveTo(35, 111, 31, 103);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
          });
          // Registered character poses plus secondary body movement, not full-screen image slides.
          const sequence = [0, 1, 2, 1, 3, 4, 5, 5, 1];
          const cycle = t / 2.5,
            index = Math.floor(cycle) % sequence.length;
          const cellW = sprites.width / 3,
            cellH = sprites.height / 2;
          const drawPose = (pose: number, alpha: number) => {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(800, 700 + Math.sin(t * 2.7 + 0.7) * 3 + bump * 0.65);
            ctx.rotate(Math.sin(t * 2.7 + 0.5) * 0.006);
            ctx.drawImage(
              sprites,
              (pose % 3) * cellW,
              Math.floor(pose / 3) * cellH,
              cellW,
              cellH,
              -450,
              -677,
              900,
              900,
            );
            ctx.restore();
          };
          const blend = Math.min(1, (cycle % 1) * 12);
          if (index > 0 && blend < 1) drawPose(sequence[index - 1], 1 - blend);
          drawPose(sequence[index], index === 0 ? 1 : blend);
          // Passing light across the carriage, independent of both skyline and train motion.
          const light = ctx.createLinearGradient(
            -400 + ((t * 140) % 2400),
            0,
            200 + ((t * 140) % 2400),
            H,
          );
          light.addColorStop(0, "#ffc46c00");
          light.addColorStop(0.5, "#ffd79115");
          light.addColorStop(1, "#ffc46c00");
          ctx.fillStyle = light;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
          raf = requestAnimationFrame(paint);
        };
        setReady(true);
        raf = requestAnimationFrame(paint);
      })
      .catch(() => {
        if (!canceled) setFailed(true);
      });
    return () => {
      canceled = true;
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <>
      <div className="subway-scene">
        <img
          className="subway-poster"
          src={poster}
          alt="달리는 지하철에서 사진을 나누는 쏙과 친구들"
          style={{ opacity: ready ? 0 : 1 }}
        />
        <canvas
          ref={canvas}
          width={1672}
          height={941}
          role="img"
          aria-label="창밖 풍경이 흐르고 손잡이와 캐릭터가 흔들리는 지하철 애니메이션"
          style={{ opacity: ready ? 1 : 0 }}
        />
      </div>
      {!failed && (
        <button
          className="subway-pause"
          onClick={() => setPaused((v) => !v)}
          aria-pressed={paused}
        >
          {paused ? "움직임 재생" : "움직임 멈춤"}
        </button>
      )}
    </>
  );
}
