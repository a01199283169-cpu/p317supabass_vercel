# Notion Clone

Notion 스타일 워크스페이스 클론 — 페이지/블록 CRUD, Google OAuth 인증, Supabase Postgres 영속 저장을 지원합니다.

## 기술 스택

- **Next.js 16** (App Router + `proxy.ts` 세션 갱신)
- **Supabase** — Postgres + Auth (Google OAuth) + RLS
- **@supabase/ssr** — 서버/클라이언트 Supabase 클라이언트
- **React 19** + Tailwind CSS 4

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env` 파일을 만듭니다.

```bash
cp .env.example .env
```

`.env` 내용:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ewgrazlkiumtnckbkwxw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Publishable Key는 [Supabase Dashboard](https://supabase.com/dashboard) → **Settings → API Keys**에서 확인합니다.

### 3. Google OAuth 설정 (필수)

로그인을 사용하려면 Google Cloud Console과 Supabase Dashboard 설정이 필요합니다.

#### A. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 생성
2. **APIs & Services → OAuth consent screen** — External, 앱 이름/이메일 설정
3. **Credentials → Create OAuth Client ID** — 유형: **Web application**
4. **Authorized redirect URIs** 추가:
   - `https://ewgrazlkiumtnckbkwxw.supabase.co/auth/v1/callback`
5. Client ID / Client Secret 복사

#### B. Supabase Dashboard (P293_supabase)

1. **Authentication → Providers → Google** — Enable, Client ID/Secret 입력
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 → `/login`에서 **Google로 로그인**합니다.

첫 로그인 시 **「시작하기」** welcome 페이지가 자동 생성됩니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| Google OAuth 로그인/로그아웃 | Supabase Auth — 가입+로그인 통합 |
| 페이지 CRUD | 생성, 트리 조회, 제목 수정, 소프트 삭제 |
| 블록 CRUD | 10종 블록 타입, 500ms debounce 자동 저장 |
| 휴지통 | 복원 / 영구 삭제 |
| 데이터 영속화 | Supabase Postgres + RLS |

## 프로젝트 구조

```
notion-clone-design/
├── app/
│   ├── auth/callback/            # OAuth 콜백
│   ├── auth/signout/             # 로그아웃
│   ├── login/                    # Google 로그인
│   └── page.tsx                  # Server Component → NotionClone
├── components/notion/            # Notion UI (sidebar, editor)
├── components/auth/              # GoogleLoginButton, UserMenu
├── lib/
│   ├── supabase/                 # client, server, proxy
│   ├── auth/session.ts           # getCurrentUser / requireUser
│   └── actions/pages.ts          # Server Actions (Supabase CRUD)
├── proxy.ts                      # 세션 갱신 + 라우트 보호
└── types/                        # notion.ts, database.ts
```

## DB 스키마

Supabase Postgres에 `pages`, `blocks` 테이블이 있습니다. `user_id`는 별도 User 테이블 없이 `auth.users.id` (UUID)를 직접 사용합니다.

RLS 정책으로 본인 데이터만 CRUD 가능합니다.

## npm scripts

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |

## 주의사항

- **service_role key는 코드에 넣지 않음** — publishable key + 사용자 세션만 사용
- Google OAuth **Redirect URI 오타**가 가장 흔한 실패 원인 — Supabase callback URL과 Google Console URL 일치 확인
- 로컬 SQLite 데이터는 이전하지 않음 — Supabase에서 새로 시작
