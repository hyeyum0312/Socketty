# 📓 DEVLOG — 개발 학습 로그 & 기술 의사결정 기록

> socketty 프로젝트를 만들며 **"무엇을 했는가"보다 "왜 그렇게 결정했는가"**를 남기는 문서입니다.
> 학습용으로 계속 추가하며, 각 결정의 배경·대안·트레이드오프를 기록합니다.

---

## 📑 목차
- [이 문서를 읽는 법](#이-문서를-읽는-법)
- [기술 스택](#기술-스택)
- [의사결정 기록 (ADR)](#의사결정-기록-adr)
  - [ADR-001. 모노레포 + pnpm workspace 채택](#adr-001-모노레포--pnpm-workspace-채택)
- [학습 로그](#학습-로그)
  - [2026-07-08 — 클라이언트 소켓 연결과 생명주기](#2026-07-08--클라이언트-소켓-연결과-생명주기)
  - [2026-07-08 — WebSocket 기초: ws / wss 구분 (라이브러리 vs 프로토콜)](#2026-07-08--websocket-기초-ws--wss-구분-라이브러리-vs-프로토콜)
  - [2026-07-07 — 단일 앱 → pnpm 모노레포 전환](#2026-07-07--단일-앱--pnpm-모노레포-전환)
- [자주 하는 실수 모음](#자주-하는-실수-모음)
- [앞으로 추가할 것](#앞으로-추가할-것)
- [부록: 새 기록 작성 템플릿](#부록-새-기록-작성-템플릿)

---

## 이 문서를 읽는 법

이 문서는 두 종류의 기록으로 구성됩니다.

- **의사결정 기록 (ADR, Architecture Decision Record)** — 구조·도구처럼 되돌리기 어려운 선택.
  "상황 → 결정 → 이유 → 대안 → 트레이드오프" 형식으로 남깁니다.
- **학습 로그 (Devlog)** — 날짜별로 그날 한 작업, 마주친 문제, 배운 점을 남깁니다.

> 💡 새로 배운 게 있으면 [학습 로그](#학습-로그)에, 되돌리기 어려운 구조적 선택을 하면
> [ADR](#의사결정-기록-adr)에 추가합니다. 템플릿은 문서 맨 아래에 있습니다.

---

## 기술 스택

| 구분 | 선택 | 버전 |
|---|---|---|
| 언어 | TypeScript | ^5 |
| 프론트엔드 | Next.js (App Router, Turbopack) | 16.2.10 |
| UI | React | 19.2.4 |
| 스타일 | Tailwind CSS | ^4 |
| 패키지 매니저 | pnpm | 9.12.3 |
| 저장소 구조 | 모노레포 (pnpm workspace) | — |

```
socketty/
├─ apps/
│  ├─ web/        # Next.js 앱 (@socketty/web)
│  └─ server/     # 서버 앱 (예정)
└─ packages/
   └─ shared/     # 공유 코드 (예정)
```

---

## 의사결정 기록 (ADR)

### ADR-001. 모노레포 + pnpm workspace 채택

- **날짜**: 2026-07-07
- **상태**: ✅ 채택

**상황(Context)**
단일 Next.js 앱으로 시작했으나, 이후 실시간 서버(`server`)와 클라이언트/서버가
공유할 타입·유틸(`shared`)이 필요해질 것으로 예상됨. 특히 소켓 통신에서
메시지 타입을 양쪽이 **똑같이** 알아야 하는데, 이를 복붙하면 반드시 어긋남.

**결정(Decision)**
`apps/*`(실행 단위) + `packages/*`(공유 코드) 구조의 모노레포로 전환하고,
패키지 매니저는 pnpm workspace를 사용한다.

**이유(Why)**
- 공유 코드를 **npm 배포 없이 소스 그대로** 참조 → 타입 불일치를 컴파일 단계에서 차단
- pnpm은 의존성을 심볼릭 링크로 공유 → 디스크·설치 속도 이득
- Next 16(Turbopack)은 워크스페이스 패키지를 **자동 트랜스파일**하므로 추가 빌드 설정 불필요

**대안(Alternatives)**
| 대안 | 안 쓴 이유 |
|---|---|
| 폴리레포(저장소 3개) | 공유 타입 동기화가 번거롭고, 버전 관리 오버헤드 |
| npm/yarn workspace | pnpm 대비 링크 방식·속도·엄격한 의존성 격리에서 열세 |
| Turborepo/Nx 즉시 도입 | 아직 규모가 작아 오버엔지니어링. 필요해지면 나중에 추가 가능 |

**트레이드오프(Trade-offs)**
- ➕ 공유·확장에 유리, 명령을 루트에서 일괄 관리
- ➖ 초기 구조·설정 학습 비용, 배포 시 빌드 추적(`outputFileTracingRoot`) 등 신경 쓸 지점 증가

---

## 학습 로그

### 2026-07-08 — 클라이언트 소켓 연결과 생명주기

**한 일**
- `apps/web`에 에코 클라이언트 구현. 서버 컴포넌트(`page.tsx`)가 클라이언트 컴포넌트
  (`EchoChat.tsx`, `"use client"`)를 품는 구조. 소켓 연결은 `useEffect`에서.

**서버 API ≠ 클라이언트 API**
같은 "WebSocket"이지만 서버(`ws` 라이브러리)와 브라우저의 API 모양이 다르다.

| | 서버 (`ws`, server.js) | 클라이언트 (브라우저) |
|---|---|---|
| 연결됨 | `wsServer.on("connection", (socket) => …)` | `socket.onopen = () => …` |
| 메시지 | `socket.on("message", (data) => …)` | `socket.onmessage = (event) => …` |
| 끊김 | `socket.on("close", () => …)` | `socket.onclose = () => …` |
| 방식 | `.on("이벤트", fn)` — **메서드 호출** | `.onX = fn` — **속성 대입** |
| 데이터 | `data` (Buffer → `toString()`) | `event.data` (문자열) |

- 실수 기록: 클라이언트에 서버 방식(`socket.on("connection", …)`)을 써서 틀렸음.
  클라이언트엔 "connection" 이벤트가 없다 — 내가 곧 그 연결 본인이라 "내가 열렸다(`onopen`)"뿐.

**등록(register) vs 실행(execute)**
- `.on(…)` / `.onX =` 은 콜백을 **지금 실행하는 게 아니라 "이벤트 터지면 실행해"라고 예약**하는 것.
- 그래서 접속 순간엔 핸들러 등록만 되고, 몸통은 이벤트 발생 시(나중에, 여러 번) 실행됨 = 이벤트 기반.

**Next.js 흐름**
- 서버가 HTML을 SSR로 렌더 → 브라우저 표시 → 하이드레이션 → **끝난 뒤 `useEffect`에서 소켓 연결**.
- 소켓 코드는 브라우저 API라 반드시 **클라이언트 컴포넌트**(`"use client"`)에 있어야 함.

**소켓 생명주기**
- `useEffect(() => {...}, [])` 의 빈 배열 → **마운트 때 1번만** 연결 생성. 리렌더로는 새로 안 만듦.
- `return () => socket.close()` (cleanup) → **언마운트**(페이지 이동/탭 닫기 등) 때 정리.
- ⚠️ 개발 모드(Strict Mode)는 일부러 mount→unmount→mount → 연결·끊김·연결이 한 번 겹쳐 보임.
  버그 아님. 프로덕션에선 1번.
- 소켓 객체는 `useRef`에 보관 → `useEffect` 밖(`handleSend`)에서도 접근, 리렌더에도 유지.

---

### 2026-07-08 — WebSocket 기초: ws / wss 구분 (라이브러리 vs 프로토콜)

**배경**
에코 서버를 만들며 코드에 `ws`라는 글자가 여러 번 등장 → 헷갈려서 개념 정리.
결론: `ws`/`wss`는 **문맥에 따라 완전히 다른 두 가지**(npm 라이브러리 vs URL 프로토콜)를 가리킨다.

**WebSocket이 필요한 이유**
- HTTP는 "요청 → 응답" 후 연결이 끊김. 클라이언트가 물어봐야만 서버가 답함.
  → 서버가 먼저 말 거는 실시간 통신(채팅/알림)이 불가능.
- WebSocket은 연결을 한 번 맺고 유지하며 **양쪽이 아무 때나** 메시지를 보냄(full-duplex).

| | HTTP | WebSocket |
|---|---|---|
| 연결 | 요청마다 열고 닫음 | 한 번 열고 계속 유지 |
| 방향 | 클라이언트가 물어봐야 응답 | 양쪽 다 먼저 말 걸 수 있음 |
| 용도 | 페이지 로딩, API | 채팅, 알림, 실시간 게임 |

- 첫 연결은 **HTTP로 시작**함. 클라이언트가 `Upgrade: websocket` 헤더로 요청 →
  서버가 `101 Switching Protocols`로 응답하며 연결을 승격. 이걸 **핸드셰이크**라 부름.

**`ws`가 가리키는 두 가지 (핵심)**

```
import { WebSocketServer } from "ws";        // ① 라이브러리 이름
new WebSocket("ws://localhost:4001")          // ② 주소 프로토콜
```

| | 정체 | 설명 |
|---|---|---|
| ① `ws` | npm 라이브러리 | Node용 WebSocket 도구. 브라우저엔 `WebSocket`이 내장이라 불필요하지만, Node엔 없어서 설치 |
| ② `ws://` / `wss://` | URL 프로토콜 | `http://` / `https://`의 WebSocket 버전 |

**서버의 두 객체: `wsServer`(서버) vs `socket`(연결)**

| 변수 | 의미 | 비유 |
|---|---|---|
| `wsServer` (WebSocketServer) | 서버 전체 (손님 받는 가게) | 식당 그 자체 |
| `socket` (connection) | 접속한 클라이언트 **한 명**과의 연결 | 손님이 앉은 테이블 |

```js
wsServer.on("connection", (socket) => {  // 새 손님이 올 때마다
  socket.on("message", ...)               // "그 손님"이 하는 말
  socket.send(...)                        // "그 손님"에게만 답함
});
```
- 손님이 100명이면 `socket`도 100개(서로 다른 사람).
- 특정 손님 → 그 `socket.send()`, 전체 뿌리기(broadcast) → `wsServer.clients` 순회.

**`ws://` vs `wss://` (= http vs https)**

| | `ws://` | `wss://` |
|---|---|---|
| 명칭 | WebSocket | WebSocket **Secure** |
| 암호화 | ❌ 평문 | ✅ TLS 암호화 |
| 대응 HTTP | `http://` | `https://` |
| 기본 포트 | 80 | 443 |
| 용도 | localhost 개발 | 실제 배포 |

- ⚠️ `https://` 사이트에선 `ws://` 연결이 **브라우저에 의해 차단됨**(mixed content). → `wss` 필수.
- localhost 개발은 `ws://`로 충분. (그래서 연습 코드는 `ws://localhost:4001`)
- `wss`는 `ws` 라이브러리를 **HTTPS 서버 위에 얹으면** 자동으로 됨 = "ws + TLS 인증서".
  배포 단계에서 다룰 것.

**배운 점 한 줄 요약**
> `ws`는 문맥이 둘: **npm 라이브러리 이름** vs **URL 프로토콜(`ws://`/`wss://`)**.
> `wss://`는 `ws://`의 보안 버전(= https 관계).

---

### 2026-07-07 — 단일 앱 → pnpm 모노레포 전환

**한 일**
- 기존 Next.js 파일 전체를 `apps/web/`으로 이동 (`git mv`로 히스토리 보존)
- `pnpm-workspace.yaml` + 루트 `package.json`(위임 스크립트) 작성
- `apps/server`, `packages/shared`는 폴더만 선(先)생성 (`.gitkeep`)
- npm → pnpm 전환: `package-lock.json` 삭제, `pnpm install` 재설치
- `pnpm build`로 검증 → 컴파일 + 타입체크 통과 ✅

**처리 순서 (재현용)**
1. 도구 확정 (`pnpm -v`)
2. 폴더 골격 생성 (`mkdir -p apps/web apps/server packages/shared`)
3. web 파일 이사 (`git mv ...`, next-env.d.ts만 일반 `mv`)
4. npm 잔재 정리 (`rm -rf node_modules .next`, `rm package-lock.json`)
5. `pnpm-workspace.yaml` 생성
6. 루트 `package.json` 새로 작성 (`--filter`로 web에 위임)
7. web `package.json` 이름 → `@socketty/web`
8. 모노레포 대응 설정: `.gitignore` 앵커 제거, `next.config.ts`에 `outputFileTracingRoot`
9. `pnpm install` → `pnpm build` 검증
10. 커밋

**배운 점 / 왜**
- `pnpm-workspace.yaml`의 글롭에 걸려도 **`package.json`이 있어야** 패키지로 인식됨.
  → 설치 로그의 `2 workspace projects`가 그 증거 (server/shared는 아직 제외).
- 루트 `package.json`은 앱이 아니라 **오케스트레이터**. `pnpm --filter <name> <cmd>`로 위임.
- `.gitignore`의 `/node_modules`는 루트만 무시 → 하위 폴더도 생기므로 `node_modules/`로 변경.
- Next는 기본적으로 자기 폴더만 빌드 추적 → 모노레포에선 `outputFileTracingRoot`를
  루트로 지정해 공유 파일 누락 방지 (공식 문서 권장).

**참고**
- 상세 구조 설명: [monorepo.md](./monorepo.md)

---

## 자주 하는 실수 모음

- ❌ `git mv` 대신 `mv`만 사용 → 커밋 히스토리가 끊김 (rename 추적 안 됨)
- ❌ `package-lock.json`을 안 지우고 pnpm 사용 → 락파일 충돌·혼선
- ❌ `apps/web/package.json`의 name을 안 바꿈 → `--filter @socketty/web`가 매칭 실패
- ❌ `.gitignore` 앵커(`/`) 그대로 둠 → 하위 `node_modules`/`.next`가 git에 추적됨

---

## 앞으로 추가할 것

- [ ] `packages/shared`에 `package.json` 추가하고 web에서 `workspace:*`로 참조해 보기
- [ ] `apps/server` 기술 선택 (프레임워크·소켓 라이브러리) → ADR-002로 기록
- [ ] 소켓 메시지 타입을 `shared`에 정의하고 web/server가 공유하는 구조 검증
- [ ] 규모 커지면 Turborepo 도입 검토 (빌드 캐시)
- [ ] 배포 파이프라인 (앱별 독립 배포 vs 통합)

---

## 부록: 새 기록 작성 템플릿

**학습 로그 엔트리** (날짜 역순으로 위쪽에 추가):
```markdown
### YYYY-MM-DD — <제목>

**한 일**
-

**배운 점 / 왜**
-

**참고**
-
```

**ADR 엔트리**:
```markdown
### ADR-00N. <결정 제목>

- **날짜**: YYYY-MM-DD
- **상태**: ✅ 채택 / ⏳ 검토 중 / ❌ 폐기

**상황(Context)**

**결정(Decision)**

**이유(Why)**

**대안(Alternatives)**

**트레이드오프(Trade-offs)**
```
