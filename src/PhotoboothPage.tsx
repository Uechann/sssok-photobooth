import shot1 from "./assets/ssok-shot-01.png";
import shot2 from "./assets/ssok-shot-02.png";
import shot3 from "./assets/ssok-shot-03.png";
import shot4 from "./assets/ssok-shot-04.png";
import shot5 from "./assets/ssok-shot-05.png";
import shot6 from "./assets/ssok-shot-06.png";
import shot7 from "./assets/ssok-shot-07.png";
import shot8 from "./assets/ssok-shot-08.png";
import shot9 from "./assets/ssok-shot-09.png";
import shot10 from "./assets/ssok-shot-10.png";
import shot11 from "./assets/ssok-shot-11.png";
import shot12 from "./assets/ssok-shot-12.png";
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
import {
  canvasBlob,
  compose,
  frames,
  loadImage,
  TEMPLATE_SLOTS,
  TEMPLATE_SIZE,
} from "./compose";
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
  const frame = frames[0];
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
    if (step !== "design") {
      return;
    }
    setPreview("");
    let canceled = false;
    let url = "";
    compose(
      Array.from({ length: 4 }, (_, i) => photos[selected[i]]?.url),
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
      for (const [i, src] of [
        shot1,
        shot2,
        shot3,
        shot4,
        shot5,
        shot6,
        shot7,
        shot8,
        shot9,
        shot10,
        shot11,
        shot12,
      ].entries()) {
        const image = await loadImage(src);
        const c = document.createElement("canvas");
        c.width = image.width;
        c.height = image.height;
        c.getContext("2d")!.drawImage(image, 0, 0);
        addBlob(await canvasBlob(c), `sample-${Date.now()}-${i}.jpg`);
      }
    } catch {
      setError("샘플 사진을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const finish = () => {
    generation.current++;
    stop();
    setFocusedPhoto(0);
    setActiveSlot(Math.min(selected.length, 3));
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
        {["사진 촬영", "사진 선택", "QR 공유"].map((s, i) => (
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
        <section className="welcome-scene">
          <div className="welcome-art">
            <img src={shot1} alt="사진을 나누는 쏙과 친구들" />
            <span>WOOWACOURSE 8TH · PHOTO BOOTH</span>
          </div>
          <div className="welcome-copy">
            <p className="booth-eyebrow">함께한 오늘을</p>
            <h1>
              네컷에 <em>쏙.</em>
            </h1>
            <p>마음껏 찍고, 네 장을 골라 함께 가져가요.</p>
            <button className="primary" onClick={() => void start()}>
              사진 찍기
            </button>
            <button
              className="welcome-demo"
              disabled={busy}
              onClick={async () => {
                await sample();
                setChoosing(true);
                setSelected([]);
                setFocusedPhoto(0);
                setActiveSlot(0);
                setStep("design");
              }}
            >
              샘플로 둘러보기
            </button>
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
          <section className="photo-selection gallery-selection">
            <div className="selection-heading">
              <h1>네컷에 담을 사진</h1>
              <span>{selected.length} / 4</span>
            </div>
            <p className="selection-guide">
              바꿀 자리를 누른 뒤, 아래에서 사진을 골라 주세요.
            </p>
            <div className="selection-stage">
              <div className="live-frame">
                <img
                  src={preview || frame.template}
                  alt="선택한 사진이 담긴 우테코 네컷"
                />
                {TEMPLATE_SLOTS.map((slot, i) => (
                  <button
                    key={i}
                    className={`frame-slot ${activeSlot === i ? "active-slot" : ""}`}
                    aria-label={`${i + 1}번 자리${selected[i] !== undefined ? ", 사진 바꾸기" : ""}`}
                    aria-pressed={activeSlot === i}
                    disabled={i > selected.length}
                    onClick={() => {
                      setActiveSlot(i);
                      if (selected[i] !== undefined)
                        setFocusedPhoto(selected[i]);
                    }}
                    style={{
                      left: `${(slot.x / TEMPLATE_SIZE.width) * 100}%`,
                      top: `${(slot.y / TEMPLATE_SIZE.height) * 100}%`,
                      width: `${(slot.w / TEMPLATE_SIZE.width) * 100}%`,
                      height: `${(slot.h / TEMPLATE_SIZE.height) * 100}%`,
                    }}
                  >
                    <span>
                      {i + 1}
                      {activeSlot === i ? " · 선택 중" : ""}
                    </span>
                  </button>
                ))}
              </div>
              <div className="focused-photo">
                <img
                  src={photos[focusedPhoto]?.url}
                  alt={`사진 ${focusedPhoto + 1} 크게 보기`}
                />
                <span>
                  사진 {focusedPhoto + 1}
                  {selected.includes(focusedPhoto)
                    ? ` · ${selected.indexOf(focusedPhoto) + 1}번에 담았어요`
                    : ""}
                </span>
              </div>
            </div>
            <div className="gallery-label">
              <h2>
                촬영한 사진 <span>{photos.length}</span>
              </h2>
              <span>{activeSlot + 1}번 자리에 담기</span>
            </div>
            <div className="photo-library" aria-label="촬영한 모든 사진">
              {photos.map((photo, i) => (
                <button
                  key={photo.url}
                  className={selected.includes(i) ? "in-frame" : ""}
                  aria-label={`사진 ${i + 1}${selected.includes(i) ? `, ${selected.indexOf(i) + 1}번에 선택됨` : `, ${activeSlot + 1}번에 담기`}`}
                  aria-pressed={selected.includes(i)}
                  onClick={() => {
                    setFocusedPhoto(i);
                    const existing = selected.indexOf(i);
                    if (existing !== -1) {
                      setActiveSlot(existing);
                      return;
                    }
                    const next = [...selected];
                    next[activeSlot] = i;
                    setSelected(next);
                    if (next.length < 4) setActiveSlot(next.length);
                  }}
                >
                  <img src={photo.url} alt={`촬영 사진 ${i + 1}`} />
                  <span className="library-number">{i + 1}</span>
                  {selected.includes(i) && (
                    <span className="library-selected">
                      ✓ {selected.indexOf(i) + 1}번
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="selection-footer">
              <button onClick={() => void start()}>더 촬영하기</button>
              <button
                className="primary"
                disabled={selected.length !== 4}
                onClick={() => setChoosing(false)}
              >
                완성 사진 확인 →
              </button>
            </div>
          </section>
        ) : (
          <section className="review-screen">
            <div className="selection-heading">
              <h1>오늘의 네컷</h1>
              <button
                disabled={busy || uploadStarted}
                onClick={() => setChoosing(true)}
              >
                사진 바꾸기
              </button>
            </div>
            <aside className="booth-preview">
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
