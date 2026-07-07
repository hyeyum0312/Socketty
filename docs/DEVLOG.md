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
