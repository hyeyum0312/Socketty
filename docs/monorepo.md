# 모노레포 구조 가이드 (pnpm workspace)

socketty 저장소를 pnpm 워크스페이스 기반 모노레포로 셋팅한 이유와 동작 방식을 정리한 문서.

## 1. 전체 그림

```
socketty/                    ← 워크스페이스 루트 (여기서 명령 실행)
├─ pnpm-workspace.yaml       ← "어디가 패키지인지" 정의
├─ package.json              ← 루트: 공통 스크립트 + 패키지매니저 고정
├─ pnpm-lock.yaml            ← 전체 의존성 잠금 (하나로 통합)
├─ apps/
│  ├─ web/                   ← Next.js 앱 (@socketty/web) — 실행/배포 단위
│  └─ server/                ← 서버 앱 (아직 폴더만, package.json 없음)
└─ packages/
   └─ shared/                ← 공유 코드 (아직 폴더만) — 배포 안 됨, import만
```

**핵심 이유**: web / server가 `packages/shared`의 타입·유틸을 **npm 배포 없이 소스 그대로**
공유하기 위함. `apps` = 실행 대상, `packages` = 재사용 코드 라는 관례를 따름.

## 2. 결정별 이유

| 항목 | 이유 |
|---|---|
| **npm → pnpm** | workspace 지원이 강력하고, 의존성을 심볼릭 링크로 공유해 디스크·설치 속도 이득. `package-lock.json` 삭제 → `pnpm-lock.yaml` 하나로 통합 |
| **패키지 이름 `@socketty/web`** | 워크스페이스 내부 참조용 고유 이름. 나중에 `"@socketty/shared": "workspace:*"`로 의존성 걸 때 이 이름을 사용 |
| **루트 `package.json`의 `--filter`** | 루트에서 `pnpm dev` → 내부적으로 `pnpm --filter @socketty/web dev` 실행. 앱이 어느 폴더에 있든 루트에서 조작 가능 |
| **`packageManager: pnpm@9.12.3`** | 팀원/CI가 같은 pnpm 버전 쓰도록 고정 (Corepack이 자동 강제) |
| **`.gitignore` 앵커 제거** (`/node_modules` → `node_modules/`) | 이제 `apps/web/node_modules` 등 하위에도 생기므로, 앵커(`/`) 없이 모든 깊이에서 무시하도록 변경. `.next/`, `out/`도 동일하게 변경 |
| **`outputFileTracingRoot` 설정** | Next는 기본적으로 자기 폴더(`apps/web`)만 추적 → 모노레포 빌드 시 루트의 공유 파일 누락 가능. 루트를 추적 기준으로 지정해 방지 (Next 공식 문서 권장) |
| **server / shared는 폴더만** | web 먼저 개발하는 계획. `package.json`이 없어 아직 워크스페이스에 **안 잡힘**. `.gitkeep`은 빈 폴더를 git이 추적하게 하는 자리표시 |

## 3. 동작 메커니즘

- **워크스페이스 인식**: `pnpm-workspace.yaml`의 `apps/*`, `packages/*` 글롭에
  **`package.json`이 있는 폴더만** 패키지로 등록됨. → 그래서 지금 server/shared는 제외
  (`pnpm install` 로그의 "2 workspace projects"가 그 증거).
- **shared import (나중)**: Next 16은 Turbopack이 **워크스페이스 패키지를 자동 트랜스파일**함.
  `packages/shared`를 import하면 별도 빌드 없이 소스가 바로 컴파일됨
  (`transpilePackages` 설정 불필요).
- **명령 실행 위치**: 항상 **루트에서** 실행. 특정 패키지만 조작하려면
  `pnpm --filter @socketty/web <cmd>`.

## 4. 사용법

```bash
pnpm install          # 루트에서 전체 설치
pnpm dev              # web 개발 서버
pnpm build            # web 빌드
pnpm lint             # web 린트
```

## 5. 다음 단계: server / shared 채우기

각 폴더에 **`package.json` 추가** → `pnpm install` 하면 자동으로 워크스페이스에 편입.

```jsonc
// packages/shared/package.json
{
  "name": "@socketty/shared",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts"
}
```

web에서 shared를 쓰려면:

```jsonc
// apps/web/package.json → dependencies에 추가
"@socketty/shared": "workspace:*"
```

그 뒤 루트에서 `pnpm install` 한 번 실행하면 심볼릭 링크로 연결됨.
