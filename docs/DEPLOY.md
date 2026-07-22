# 배포 가이드 — 사람↔사람 채팅방(room)

web(Vercel) + 소켓 서버(Render)를 나눠 배포한다.
**Vercel엔 소켓 서버를 못 올린다**(서버리스라 연결을 계속 유지 못 함) → 그래서 둘을 가른다.

```
web (Next.js)  → Vercel   ─ NEXT_PUBLIC_ROOM_URL ─▶  소켓 서버 → Render
```

코드는 이미 env로 주소를 받게 준비됨. 남은 건 대시보드 클릭뿐이다.

---

## 순서

소켓 서버를 **먼저** 띄운다(그 주소를 web env에 넣어야 하므로).

### 1. 소켓 서버 — Render

1. GitHub에 push → [render.com](https://render.com) 로그인 → **New → Web Service** → 이 레포 선택
2. 설정
   - **Root Directory**: (비움 — 레포 루트. pnpm 워크스페이스라 루트에서 설치해야 함)
   - **Build Command**: `corepack enable && pnpm install --frozen-lockfile`
   - **Start Command**: `pnpm --filter @socketty/server start:room`
   - **Instance Type**: Free
3. **Environment**에 `WEB_ORIGIN` 추가 → 값은 2단계(Vercel) 주소. 아직 모르면 일단 비우고 나중에 채운다.
4. 배포되면 공개 주소가 나온다. 예) `https://socketty-room.onrender.com` → **복사**

> ⚠️ 무료는 15분 미사용 시 잠듦 → 첫 접속 30초~1분 느림. 깨어나면 정상.

### 2. web — Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → 이 레포 선택
2. 설정
   - **Root Directory**: `apps/web`
   - Framework: Next.js (자동 감지)
3. **Environment Variables** 추가
   - `NEXT_PUBLIC_ROOM_URL` = 1단계 Render 주소(`https://...onrender.com`)
4. Deploy → web 공개 주소가 나온다. 예) `https://socketty.vercel.app`

### 3. CORS 마무리

Render로 돌아가 `WEB_ORIGIN` = 2단계 Vercel 주소(`https://socketty.vercel.app`)로 설정 → 재배포.

---

## 확인

- 친구와 각자 `https://socketty.vercel.app/room` 접속 → 서로 메시지 오가면 성공.
- 안 되면 브라우저 콘솔 확인:
  - `CORS` 에러 → Render `WEB_ORIGIN`이 Vercel 주소와 정확히 일치하는지(끝 슬래시 없이)
  - `ERR_CONNECTION` → Render가 잠들었을 수 있음, 잠깐 기다렸다 새로고침
  - `Mixed content` → web은 https인데 `NEXT_PUBLIC_ROOM_URL`이 http면 차단. https로.

## 로컬 실행 (배포와 별개, 그대로 됨)

```bash
pnpm --filter @socketty/server room   # 소켓 서버 (4003)
pnpm --filter @socketty/web dev        # web (3000)
```
env를 안 넣으면 코드 기본값(localhost)으로 동작한다.
