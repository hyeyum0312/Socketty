# socketty

실시간 소켓 통신 기반 웹 애플리케이션. **pnpm 워크스페이스 모노레포**로 구성되어
프론트엔드·서버·공유 코드를 한 저장소에서 관리합니다.

## 기술 스택

- **Language** — TypeScript
- **Frontend** — Next.js 16 (App Router, Turbopack), React 19
- **Styling** — Tailwind CSS 4
- **Package Manager** — pnpm (workspace)

## 프로젝트 구조

```
socketty/
├─ apps/
│  ├─ web/        # Next.js 앱 (@socketty/web)
│  └─ server/     # 서버 앱 (예정)
├─ packages/
│  └─ shared/     # 클라이언트·서버 공유 코드 (예정)
└─ docs/          # 설계 문서 & 개발 로그
```

## 시작하기

```bash
pnpm install     # 의존성 설치 (루트에서)
pnpm dev         # web 개발 서버 실행
```

[http://localhost:3000](http://localhost:3000) 접속.

| 명령 | 설명 |
|---|---|
| `pnpm dev` | web 개발 서버 |
| `pnpm build` | web 프로덕션 빌드 |
| `pnpm lint` | 린트 |

특정 패키지만 조작하려면: `pnpm --filter @socketty/web <command>`

## 문서

- 📓 **[개발 로그 & 기술 의사결정 기록 (DEVLOG)](./docs/DEVLOG.md)** — 왜 이렇게 만들었는가
- 🏗️ **[모노레포 구조 가이드](./docs/monorepo.md)** — 구조와 동작 방식 상세
