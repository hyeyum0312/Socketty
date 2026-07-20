# socketty

실시간 소켓 통신을 밑단부터 학습하며 만드는 웹 애플리케이션. **pnpm 워크스페이스 모노레포**로
프론트엔드·서버·공유 코드를 한 저장소에서 관리합니다.

네이티브 WebSocket(`ws`)으로 에코 서버를 먼저 만들어 프로토콜을 이해한 뒤,
Socket.IO로 LLM 스타일 스트리밍 채팅(글자 단위 청크 + 중단)을 구현하는 순서로 진행합니다.
설계 판단과 배운 점은 [DEVLOG](./docs/DEVLOG.md)에 기록합니다.

## 기술 스택

- **Language** — TypeScript / JavaScript(ESM)
- **Frontend** — Next.js 16 (App Router, Turbopack), React 19
- **Realtime** — WebSocket(`ws`), Socket.IO 4
- **Styling** — Tailwind CSS 4
- **Runtime / PM** — Node 20+, pnpm (workspace)

## 프로젝트 구조

```
socketty/
├─ apps/
│  ├─ web/        # Next.js 앱 (@socketty/web) — 소켓 클라이언트
│  └─ server/     # Node 소켓 서버 (@socketty/server) — 에코(ws) + 채팅(Socket.IO)
├─ packages/
│  └─ shared/     # 클라이언트·서버 공유 코드 (@socketty/shared) — 소켓 이벤트 이름
└─ docs/          # 설계 문서 & 개발 로그
```

## 시작하기

```bash
pnpm install     # 의존성 설치 (루트에서)
```

서버와 web은 별도 터미널에서 실행합니다.

**① Socket.IO mock 채팅** — `/chat` 페이지의 스트리밍 채팅

```bash
pnpm --filter @socketty/server chat   # 채팅 서버   → localhost:4002
pnpm dev                              # web 개발 서버 → localhost:3000
```

[http://localhost:3000/chat](http://localhost:3000/chat) 접속. (mock 응답이라 API 키 불필요)

**② WebSocket 에코** — 초기 학습용 에코 서버

```bash
pnpm --filter @socketty/server dev    # 에코 서버 → ws://localhost:4001
pnpm dev                              # web 개발 서버 → localhost:3000
```

## 명령

| 명령 | 설명 |
|---|---|
| `pnpm dev` | web 개발 서버 |
| `pnpm build` | web 프로덕션 빌드 |
| `pnpm lint` | 린트 |
| `pnpm --filter @socketty/server dev` | WebSocket 에코 서버 (4001) |
| `pnpm --filter @socketty/server chat` | Socket.IO 채팅 서버 (4002) |

특정 패키지만 조작하려면: `pnpm --filter @socketty/web <command>`

## 문서

- 📓 **[개발 로그 & 기술 의사결정 기록 (DEVLOG)](./docs/DEVLOG.md)** — 왜 이렇게 만들었는가
- 🏗️ **[모노레포 구조 가이드](./docs/monorepo.md)** — 구조와 동작 방식 상세
