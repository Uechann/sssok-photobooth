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

main 대상 PR로 리뷰합니다. 직접 push하려면 저장소 소유자가 팀원을 collaborator로 추가해야 합니다.
권한이 없으면 fork에서 PR을 보낼 수 있습니다. CI는 타입 검사·테스트·빌드와 배포 아티팩트를 생성합니다.

## 배포

현재 운영 호스팅은 Sites이며 `.openai/hosting.json`에 기존 프로젝트 ID가 있습니다.
Sites 도구로 기존 프로젝트 소스를 열고, 리뷰된 GitHub main 커밋을 적용한 뒤 빌드·버전 저장·배포합니다.
**GitHub push만으로 현재 Sites 배포가 자동 변경되지는 않습니다.** CI의 `photobooth-worker` 아티팩트에는 Worker 배포 파일이 있습니다.

Cloudflare 계정에서 별도 운영하려면 `wrangler.jsonc` 설정으로 `npx wrangler deploy`를 실행할 수도 있습니다.
이 경우 Cloudflare 계정 인증과 별도 도메인 설정이 필요하며 현재 Sites 주소와는 별개입니다.

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
