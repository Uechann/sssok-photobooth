# 쏙 포토부스

아이패드 촬영 → 네컷 합성 → 기존 쏙 서버에 원본과 네컷 저장 → QR로 쏙 사진방 공유.

- 서비스: https://sssok-photobooth-demo-uechann.cab0703607.chatgpt.site
- 운영 API: https://api.ssssok.com/api/v1
- QR 입장: https://www.ssssok.com/join/{방코드}

## 로컬 실행

Node.js 24 이상이 필요합니다.

```sh
git clone https://github.com/Uechann/sssok-photobooth.git
cd sssok-photobooth
npm ci
npm run dev
```

http://localhost:3003 에서 엽니다. **로컬 실행도 실제 운영 API에 사진을 저장합니다.**
카메라는 localhost 또는 HTTPS에서만 사용할 수 있습니다. 아이패드에서는 배포 주소를 사용하세요.

## 팀 작업

```sh
git switch -c feature/frame-picker
# 수정 후
npm run typecheck
npm test
npm run build
git add .
git commit -m "feat: 프레임 선택 개선"
git push -u origin feature/frame-picker
```

이 프로토타입 저장소는 main 직접 push를 허용합니다. PR은 선택이며, main push는 Vercel Git 연동 후 자동 배포됩니다. 원본 쏙 저장소의 PR 규칙은 변경하지 않습니다. 직접 push하려면 저장소 소유자가 팀원을 collaborator로 추가해야 합니다.
권한이 없으면 fork에서 PR을 보낼 수 있습니다. CI는 타입 검사·테스트·빌드와 배포 아티팩트를 생성합니다.

## Vercel 자동 배포

1. Vercel에서 기존 GitHub 저장소 `Uechann/sssok-photobooth`를 Import합니다 (새 저장소 복제 아님).
2. Framework는 Other, Root Directory는 루트, Node.js는 24.x를 선택합니다.
3. `vercel.json`의 설치·빌드·출력 설정을 사용하고 Production Branch를 `main`으로 설정합니다.
4. 최초 배포 후 main push/PR 병합마다 운영 배포, 작업 브랜치 push마다 Preview가 생성됩니다.

빌드 명령에 타입 검사와 테스트가 포함돼 실패 시 배포되지 않습니다. GitHub CI는 별도로 병렬 실행됩니다.
정적 화면은 CDN에서, `/api/*`와 `/storage`는 기존 허용 목록을 재사용하는 Node.js 함수에서 처리합니다.
Vercel의 요청 크기 제한에 맞춰 JPEG를 필요할 때만 압축하고 한 장당 4MB를 넘으면 전송 전에 안내합니다.
환경변수나 쏙 비밀키는 필요하지 않습니다. 인증 토큰은 방문자별로 발급됩니다.

현재 Sites 주소는 별도 배포이며 GitHub push만으로 업데이트되지 않습니다.
기존 Worker 배포도 `npm run build` 출력으로 유지할 수 있습니다.

## 구조

- `src/PhotoboothPage.tsx`: 촬영·선택·프레임·업로드·QR 화면
- `src/compose.ts`: Canvas 네컷 합성
- `src/api.ts`: 익명 인증·방 생성·발급/전송/등록·실패 재시도
- `worker/handler.mjs`: 고정 쏙 API와 서명된 R2 업로드 주소만 허용하는 서버 경유 요청
- `scripts/build-worker.mjs`: 정적 화면을 포함한 Cloudflare Worker 생성

사진은 브라우저에서 합성하며 공유 버튼을 누르면 쏙 서버와 R2에 저장합니다.
호스트 토큰은 브라우저 메모리에만 보관하며 QR에 넣지 않습니다. 다음 촬영 시 토큰과 로컬 사진을 초기화합니다.
새로고침하면 미완료 촬영과 호스트 인증이 사라지므로 완료된 방 링크와 사진을 먼저 저장하세요.
쏙 서버의 보관/삭제 정책이 그대로 적용되며 자동 삭제를 보장하지 않습니다.
사진 링크를 받은 사람은 사진방에 입장할 수 있으므로 촬영자의 동의를 받고 진행하세요.

## 현장 체크

- 아이패드 Safari에서 카메라 권한과 가로/세로 화면 확인
- 원본과 합성 사진 저장 완료 후 다른 휴대폰의 QR 입장·다운로드 확인
- 인터넷 끊김 후 같은 방에 업로드 재시도 확인
- 다음 방문자 시작 시 이전 사진이 남지 않는지 확인
- 팀별 공식 로고/캐릭터는 프레임 설정에서 등록 (기본 제공은 쏙·우테코 텍스트 프레임)
