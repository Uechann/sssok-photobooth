import mascotWave from "./assets/mascot-wave.png";
import {
  joinRoom,
  createAnonymous,
  clearSession,
  createRoom,
  uploadFiles,
  SERVICE_ORIGIN,
  ROUTES,
} from "./api";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { canvasBlob, compose, frames, type Frame } from "./compose";
import "./photobooth.css";

type Photo = { url: string; file: File };
export const PhotoboothPage = () => {
  const [step, setStep] = useState<"welcome" | "capture" | "design" | "done">(
    "welcome",
  );
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [frame, setFrame] = useState<Frame>(frames[0]);
  const [custom, setCustom] = useState<Frame>({
    name: "우리 팀",
    color: "#ffd4df",
    ink: "#29232c",
  });
  const [preview, setPreview] = useState("");
  const [uploadStarted, setUploadStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const shareOrigin = SERVICE_ORIGIN;
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const urls = useRef<string[]>([]);
  const generation = useRef(0);
  const lock = useRef(false);
  const room = useRef<{ roomId: number; code: string; token: string } | null>(
    null,
  );
  const pending = useRef<File[] | null>(null);
  const objectUrl = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    return url;
  };
  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(
    () => () => {
      generation.current++;
      stream.current?.getTracks().forEach((t) => t.stop());
      urls.current.forEach(URL.revokeObjectURL);
    },
    [],
  );
  useEffect(() => {
    if (step !== "design" || selected.length !== 4) {
      return;
    }
    let canceled = false;
    let url = "";
    compose(
      selected.map((i) => photos[i].url),
      frame,
    )
      .then((blob) => {
        if (!canceled) {
          url = URL.createObjectURL(blob);
          setPreview(url);
        }
      })
      .catch((e) => {
        if (!canceled) setError(String(e.message));
      });
    return () => {
      canceled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [selected, frame, photos, step]);
  const start = async () => {
    setStep("capture");
    setError("");
    const current = ++generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "카메라는 localhost 또는 HTTPS에서 열어 주세요. 사진 불러오기도 사용할 수 있어요.",
        );
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
        audio: false,
      });
      if (current !== generation.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stop();
      stream.current = media;
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "카메라 권한을 허용해 주세요.");
    }
  };
  const addBlob = (blob: Blob, name: string) =>
    setPhotos((p) => [
      ...p,
      {
        url: objectUrl(blob),
        file: new File([blob], name, { type: blob.type }),
      },
    ]);
  const shoot = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      for (let i = 3; i > 0; i--) {
        setCount(i);
        await new Promise((r) => setTimeout(r, 700));
      }
      const v = video.current;
      if (!v?.videoWidth)
        throw new Error(
          "카메라가 준비되지 않았어요. 사진을 불러오거나 카메라를 다시 켜 주세요.",
        );
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d")!;
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0);
      addBlob(await canvasBlob(c), `booth-${crypto.randomUUID()}.jpg`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCount(0);
      setBusy(false);
      lock.current = false;
    }
  };
  const sample = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      for (let i = 0; i < 4; i++) {
        const c = document.createElement("canvas");
        c.width = 1000;
        c.height = 750;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = ["#d5e5fd", "#ffe1cc", "#d9edc2", "#e6d9fa"][i];
        ctx.fillRect(0, 0, 1000, 750);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(500, 360, 210, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#34372f";
        ctx.font = "bold 100px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(["HELLO!", "우리의", "오늘을", "쏙!"][i], 500, 400);
        ctx.font = "24px sans-serif";
        ctx.fillText("DEMO DAY · SAMPLE PHOTO", 500, 670);
        addBlob(await canvasBlob(c), `sample-${Date.now()}-${i}.jpg`);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const finish = () => {
    generation.current++;
    stop();
    setSelected(photos.slice(0, 4).map((_, i) => i));
    setStep("design");
    setError("");
  };
  const publish = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const origin = new URL(shareOrigin);
      if (!["http:", "https:"].includes(origin.protocol))
        throw new Error("공유 주소는 http 또는 https 주소여야 해요.");
      if (!pending.current)
        pending.current = [
          ...photos.map((p) => p.file),
          new File(
            [
              await compose(
                selected.map((i) => photos[i].url),
                frame,
              ),
            ],
            "sssok-four-cuts.jpg",
            { type: "image/jpeg" },
          ),
        ];
      setUploadStarted(true);
      if (!room.current) {
        setStatus("사진을 담을 방을 만들고 있어요");
        const session = await createAnonymous({ nickname: "포토부스" });
        const created = await createRoom(
          {
            nickname: "포토부스",
            name: photos.every((p) => p.file.name.startsWith("sample-"))
              ? "[테스트] 포토부스"
              : "데모데이 네컷",
            uploadPolicy: "host",
          },
          session.accessToken,
        );
        room.current = { ...created, token: session.accessToken };
      }
      await joinRoom(room.current.roomId, room.current.token, {
        code: room.current.code,
        nickname: "포토부스",
      });
      setStatus(`${pending.current.length}장의 사진을 업로드하고 있어요`);
      const result = await uploadFiles({
        roomId: room.current.roomId,
        token: room.current.token,
        files: pending.current,
        onProgress: (done, total) => setStatus(`${done}/${total}장 저장 완료`),
      });
      const rejectedNames = new Set(result.rejected.map((f) => f.fileName));
      pending.current = [
        ...result.failed.map((f) => f.file),
        ...pending.current.filter((f) => rejectedNames.has(f.name)),
      ];
      if (pending.current.length)
        throw new Error(
          `${pending.current.length}장을 올리지 못했어요. 같은 방에 다시 시도해 주세요.`,
        );
      setShareUrl(
        new URL(ROUTES.roomInvite(room.current.code), origin.origin).href,
      );
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  const reset = () => {
    generation.current++;
    stop();
    urls.current.forEach(URL.revokeObjectURL);
    urls.current = [];
    setUploadStarted(false);
    setPhotos([]);
    setSelected([]);
    setPreview("");
    setError("");
    setShareUrl("");
    clearSession();
    room.current = null;
    pending.current = null;
    setStep("welcome");
  };
  return (
    <main className="booth">
      <header className="booth-header">
        <a href="/" className="booth-logo">
          쏙<span>포토부스</span>
        </a>
        <span className="booth-badge">우테코 8기 · 데모데이</span>
      </header>
      <div className="booth-steps">
        {["사진 촬영", "네컷 만들기", "QR 공유"].map((s, i) => (
          <span
            key={s}
            className={
              (step === "welcome" || step === "capture"
                ? 0
                : step === "design"
                  ? 1
                  : 2) === i
                ? "active"
                : ""
            }
          >
            0{i + 1} {s}
          </span>
        ))}
      </div>
      {error && (
        <div className="booth-error" role="alert">
          {error}
        </div>
      )}
      {step === "welcome" ? (
        <section className="booth-welcome">
          <div>
            <p className="booth-eyebrow">데모데이 포토부스</p>
            <h1>
              함께한 오늘,
              <br />
              <em>네컷에 쏙</em>
            </h1>
            <p>
              사진을 찍고, 좋아하는 네 장을 골라요.
              <br />
              완성한 사진은 QR로 함께 가져가세요.
            </p>
            <button className="primary" onClick={() => void start()}>
              촬영 시작하기
            </button>
            <small>카메라 권한을 허용해 주세요</small>
          </div>
          <div className="booth-poster" aria-hidden="true">
            <img src={mascotWave} alt="" />
          </div>
        </section>
      ) : null}
      {step === "capture" && (
        <section className="booth-work">
          <div>
            <div className="booth-section-title">
              <h1>사진을 찍어 주세요</h1>
              <span>{photos.length}장 촬영</span>
            </div>
            <div className="booth-camera">
              <video ref={video} autoPlay muted playsInline />
              <span className="booth-live">카메라</span>
              {count > 0 && <b className="booth-count">{count}</b>}
            </div>
            <div className="booth-actions">
              <button disabled={busy} onClick={() => void start()}>
                카메라 켜기
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => void shoot()}
              >
                {count ? `${count}…` : "● 사진 찍기"}
              </button>
              <button disabled={busy || photos.length < 4} onClick={finish}>
                네컷 만들기 →
              </button>
            </div>
            <p className="booth-hint">
              4장 이상 촬영하면 네컷을 만들 수 있어요.
            </p>
          </div>
          <aside>
            <h2>
              촬영한 사진 <span>{photos.length}</span>
            </h2>
            <div className="booth-thumbnails">
              {photos.length === 0 && (
                <p className="booth-empty">촬영한 사진이 여기에 모여요.</p>
              )}
              {photos.map((p, i) => (
                <img key={p.url} src={p.url} alt={`촬영 사진 ${i + 1}`} />
              ))}
            </div>
            <label className="booth-file">
              사진 불러오기
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={busy}
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  setBusy(true);
                  try {
                    for (const f of files) {
                      const image = new Image();
                      image.src = objectUrl(f);
                      await image.decode();
                      const c = document.createElement("canvas");
                      const r = Math.min(
                        1,
                        1600 / Math.max(image.width, image.height),
                      );
                      c.width = image.width * r;
                      c.height = image.height * r;
                      c.getContext("2d")!.drawImage(
                        image,
                        0,
                        0,
                        c.width,
                        c.height,
                      );
                      addBlob(
                        await canvasBlob(c),
                        `import-${crypto.randomUUID()}.jpg`,
                      );
                    }
                  } catch {
                    setError(
                      "읽을 수 없는 사진이 있어요. JPEG 또는 PNG로 다시 선택해 주세요.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            <button disabled={busy} onClick={() => void sample()}>
              샘플로 체험하기
            </button>
          </aside>
        </section>
      )}
      {step === "design" && (
        <section className="booth-work">
          <div>
            <h1>네컷을 만들어 주세요</h1>
            <p className="booth-hint">
              담을 순서대로 4장을 선택해 주세요.{" "}
              <strong>{selected.length}/4</strong>
            </p>
            <div className="booth-picker">
              {photos.map((p, i) => (
                <button
                  disabled={busy || uploadStarted}
                  aria-pressed={selected.includes(i)}
                  aria-label={`사진 ${i + 1}${selected.includes(i) ? `, ${selected.indexOf(i) + 1}번째 선택` : " 선택"}`}
                  className={selected.includes(i) ? "chosen" : ""}
                  key={p.url}
                  onClick={() =>
                    setSelected((s) =>
                      s.includes(i)
                        ? s.filter((n) => n !== i)
                        : s.length < 4
                          ? [...s, i]
                          : s,
                    )
                  }
                >
                  <img src={p.url} alt={`사진 ${i + 1}`} />
                  <span>
                    {selected.includes(i) ? selected.indexOf(i) + 1 : "+"}
                  </span>
                </button>
              ))}
            </div>
            <h2>프레임 선택</h2>
            <div className="booth-actions">
              {[...frames, custom].map((f, i) => (
                <button
                  disabled={busy || uploadStarted}
                  key={i}
                  aria-pressed={frame === f}
                  className={
                    frame === f ? "frame-option selected-frame" : "frame-option"
                  }

                  onClick={() => setFrame(f)}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <details>
              <summary>팀 프레임 꾸미기</summary>
              <fieldset disabled={busy || uploadStarted}>
                <label>
                  팀 이름
                  <input
                    maxLength={20}
                    value={custom.name}
                    onChange={(e) => {
                      const f = { ...custom, name: e.target.value };
                      setCustom(f);
                      setFrame(f);
                    }}
                  />
                </label>
                <label>
                  프레임 색
                  <input
                    type="color"
                    value={custom.color}
                    onChange={(e) => {
                      const f = { ...custom, color: e.target.value };
                      setCustom(f);
                      setFrame(f);
                    }}
                  />
                </label>
                <label>
                  글자 색
                  <input
                    type="color"
                    value={custom.ink}
                    onChange={(e) => {
                      const f = { ...custom, ink: e.target.value };
                      setCustom(f);
                      setFrame(f);
                    }}
                  />
                </label>
                <label>
                  로고 / 캐릭터
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const f = { ...custom, logo: objectUrl(file) };
                        setCustom(f);
                        setFrame(f);
                      }
                    }}
                  />
                </label>
              </fieldset>
            </details>

            <button
              disabled={busy || uploadStarted}
              onClick={() => void start()}
            >
              ← 더 촬영하기
            </button>
          </div>
          <aside className="booth-preview">
            <h2>미리보기</h2>
            {preview && selected.length === 4 ? (
              <img src={preview} alt="합성된 인생네컷 미리보기" />
            ) : (
              <p>사진 네 장을 선택해 주세요.</p>
            )}
            {preview && selected.length === 4 && (
              <a
                className="booth-download"
                download="sssok-four-cuts.jpg"
                href={preview}
              >
                네컷 다운로드
              </a>
            )}
            <button
              className="primary"
              disabled={busy || selected.length !== 4 || !preview}
              onClick={() => void publish()}
            >
              {busy
                ? status
                : uploadStarted
                  ? "업로드 다시 시도"
                  : "사진 저장하고 QR 받기"}
            </button>
            <small>
              원본과 네컷이 함께 저장돼요. 링크를 받은 사람은 사진을 볼 수
              있어요.
            </small>
          </aside>
        </section>
      )}
      {step === "done" && (
        <section className="booth-done">
          <p className="booth-eyebrow">저장 완료</p>
          <h1>QR로 사진을 가져가세요</h1>
          <div className="booth-qr">
            <QRCodeSVG value={shareUrl} size={230} marginSize={2} />
          </div>
          <p>
            휴대폰 카메라로 QR을 스캔해 주세요.
            <br />
            원본과 네컷을 모두 저장할 수 있어요.
          </p>
          <a href={shareUrl} target="_blank" rel="noreferrer">
            사진방 열기 ↗
          </a>
          <button className="primary" onClick={reset}>
            다음 촬영 시작
          </button>
        </section>
      )}
      <footer>쏙 · 데모데이 포토부스</footer>
    </main>
  );
};
