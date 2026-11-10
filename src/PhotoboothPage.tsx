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
  const [focusedPhoto, setFocusedPhoto] = useState(0);
  const [activeSlot, setActiveSlot] = useState(0);
  const [choosing, setChoosing] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
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
    setCameraReady(false);
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
    setPreview("");
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
    if (
      !document.fullscreenElement &&
      document.documentElement.requestFullscreen
    ) {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
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
        setCameraReady(true);
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
    setSelected([]);
    setFocusedPhoto(0);
    setActiveSlot(0);
    setChoosing(true);
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
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
    <main
      className={`booth booth-${step}${step === "design" && choosing ? " is-choosing" : ""}`}
    >
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
        <section className="capture-screen" aria-label="사진 촬영">
          <div className="capture-topbar">
            <button
              className="capture-close"
              disabled={busy}
              onClick={() => {
                generation.current++;
                stop();
                setStep("welcome");
                setError("");
                if (document.fullscreenElement)
                  void document.exitFullscreen().catch(() => {});
              }}
            >
              닫기
            </button>
            <span aria-live="polite">{photos.length}장</span>
          </div>
          <div className="capture-viewfinder">
            <video ref={video} autoPlay muted playsInline />
            {!cameraReady && (
              <button disabled={busy} onClick={() => void start()}>
                카메라 켜기
              </button>
            )}
            {count > 0 && (
              <b className="booth-count" aria-live="assertive">
                {count}
              </b>
            )}
          </div>
          <div className="capture-bottom">
            <div className="capture-filmstrip" aria-label="촬영한 사진">
              {photos.map((p, i) => (
                <img key={p.url} src={p.url} alt={`촬영 사진 ${i + 1}`} />
              ))}
              {photos.length === 0 && <span>4장 이상 촬영해 주세요</span>}
            </div>
            <div className="capture-controls">
              <details className="capture-options">
                <summary>옵션</summary>
                <div>
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
                </div>
              </details>
              <button
                className="shutter"
                aria-label="사진 찍기"
                disabled={busy || !cameraReady}
                onClick={() => void shoot()}
              >
                <span />
              </button>
              <button
                className="primary"
                disabled={busy || photos.length < 4}
                onClick={finish}
              >
                사진 선택 →
              </button>
            </div>
          </div>
        </section>
      )}
      {step === "design" &&
        (choosing ? (
          <section className="photo-selection">
            <div className="selection-heading">
              <h1>네 장을 골라 주세요</h1>
              <span>{selected.length}/4</span>
            </div>
            <div className="single-photo">
              <img
                src={photos[focusedPhoto]?.url}
                alt={`사진 ${focusedPhoto + 1} 크게 보기`}
              />
            </div>
            <div className="photo-navigation">
              <button
                aria-label="이전 사진"
                disabled={focusedPhoto === 0}
                onClick={() => setFocusedPhoto((i) => i - 1)}
              >
                ←
              </button>
              <span>
                {focusedPhoto + 1} / {photos.length}
              </span>
              <button
                aria-label="다음 사진"
                disabled={focusedPhoto === photos.length - 1}
                onClick={() => setFocusedPhoto((i) => i + 1)}
              >
                →
              </button>
            </div>
            <div className="selected-slots" aria-label="네컷 사진 자리">
              {Array.from({ length: 4 }, (_, slot) => (
                <button
                  key={slot}
                  aria-label={`${slot + 1}번 자리${selected[slot] !== undefined ? ", 사진 바꾸기" : ""}`}
                  aria-pressed={activeSlot === slot}
                  disabled={slot > selected.length}
                  onClick={() => setActiveSlot(slot)}
                >
                  {selected[slot] !== undefined ? (
                    <img
                      src={photos[selected[slot]].url}
                      alt={`${slot + 1}번 선택 사진`}
                    />
                  ) : (
                    <span className="slot-empty">+</span>
                  )}
                  <span className="slot-number">{slot + 1}</span>
                </button>
              ))}
            </div>
            <button
              className="primary select-photo"
              disabled={selected.includes(focusedPhoto)}
              onClick={() => {
                const next = [...selected];
                next[activeSlot] = focusedPhoto;
                setSelected(next);
                setActiveSlot(Math.min(next.length, 3));
                const nextPhoto = photos.findIndex(
                  (_, i) => i > focusedPhoto && !next.includes(i),
                );
                if (nextPhoto !== -1) setFocusedPhoto(nextPhoto);
              }}
            >
              {selected.includes(focusedPhoto)
                ? "담은 사진이에요"
                : `${activeSlot + 1}번에 ${selected[activeSlot] !== undefined ? "바꾸기" : "담기"}`}
            </button>
            <div className="selection-footer">
              <button onClick={() => void start()}>더 촬영하기</button>
              <button
                className="primary"
                disabled={selected.length !== 4}
                onClick={() => setChoosing(false)}
              >
                프레임 선택 →
              </button>
            </div>
          </section>
        ) : (
          <section className="booth-work frame-screen">
            <div>
              <h2>프레임 선택</h2>
              <div className="booth-actions">
                {[...frames, custom].map((f, i) => (
                  <button
                    disabled={busy || uploadStarted}
                    key={i}
                    aria-pressed={frame === f}
                    className={
                      frame === f
                        ? "frame-option selected-frame"
                        : "frame-option"
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
                onClick={() => setChoosing(true)}
              >
                ← 사진 다시 고르기
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
        ))}
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
