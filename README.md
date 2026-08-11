# SwapClass Frontend

> 숙대생들의 수강신청을 구조하는 간편하고 안전한 강의 교환 플랫폼.
> 직관적인 UI/UX로 교환 매칭, 실시간 채팅 및 강의 보유 자동 인증 환경을 제공합니다.

---

## 프로젝트 소개

SwapClass는 수강신청 기간에 원하는 강의를 얻기 위해 서로 강의를 교환할 수 있는 서비스입니다.  
게시글 등록 → 교환 추천 매칭 → 실시간 교환 채팅 → 화면 공유를 통한 QR 자동 인증 → 교환 완료의 흐름으로 모바일과 웹 환경 모두에서 매끄럽고 안전한 거래 경험을 지원합니다.  
> [프로젝트 설명 바로가기](https://github.com/SongWalks)

---

## 🛠 Tech Stack
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)![NodeJS](https://img.shields.io/badge/node.js-6DA55F.svg?style=for-the-badge&logo=node.js&logoColor=white)

| 분류 | 기술 |
| --- | --- |
| Language | TypeScript |
| Library | React |
| State | TanStack Query |
| Styling | Tailwind CSS |
| Build | Vite |
| Runtime | Node.js |
| HTTP | Axios |

---

## 📁 프로젝트 구조

```text
src/
├── api/                 # 백엔드 API 통신 함수 및 Axios 인스턴스 설정
├── assets/              # 정적 리소스 (이미지, 아이콘, 폰트 등)
├── components/          # 공통 컴포넌트
│   ├── common/          # 재사용 가능한 기본 UI (Button, Input, Modal 등)
│   └── layout/          # 레이아웃 컴포넌트
│       ├── RootLayout.tsx       # 모바일 화면 비율 유지 및 최상위 레이아웃
│       ├── DefaultLayout.tsx    # 하단 네비게이션 포함 기본 레이아웃
│       ├── FullScreenLayout.tsx # 하단 네비게이션 제외 전체 화면 레이아웃
│       ├── Header.tsx           # 동적 렌더링 공통 상단바
│       └── BottomNav.tsx        # 하단 탭 바 (GNB)
├── hooks/               # 커스텀 훅 (TanStack Query, 도메인 비즈니스 로직)
├── pages/               # 도메인 및 화면 단위별 페이지 컴포넌트
│   ├── auth/            # 회원가입, 로그인 등 인증 화면
│   ├── chat/            # 1:1 교환 채팅방 및 화면 공유 화면
│   ├── home/            # 메인 홈 및 배너 화면
│   ├── lounge/          # 라운지 커뮤니티 화면
│   └── ...              # (기타 도메인별 폴더)
├── routes/              # React Router 기반 페이지 라우팅 설정
├── store/               # Zustand 전역 상태 관리 스토어
├── types/               # TypeScript 전역 타입 및 인터페이스 정의
├── utils/               # 공통 헬퍼 함수 (날짜 포맷팅, 유효성 검사 등)
├── App.tsx
└── main.tsx

```

---

## 주요 기능

* **맞춤형 자동 매칭**<br>
  희망 과목과 버릴 과목을 설정하면, 시스템이 조건에 딱 맞는 교환 상대를 자동으로 추천합니다.
* **실시간 채팅 및 조율**<br>
  매칭된 상대와 1:1 채팅으로 교환 시간을 정하고, 조건이 맞지 않으면 즉시 '거래 파기'가 가능합니다.
* **QR 화면 공유 인증**<br>
  교환 5분 전, PC 수강 내역 창과 QR 코드를 화면 공유로 인증하여 허위 매물을 완벽하게 차단합니다.
* **동기화 카운트다운**<br>
  양측 인증 완료 시 10초 카운트다운이 시작되어, 완벽한 타이밍에 안전한 교환(취소 및 신청)을 지원합니다.
* **교환 일정 & 라운지**<br>
  홈 화면의 D-Day 배너로 다가오는 교환 일정을 직관적으로 확인하고, 라운지에서 유용한 수강 꿀팁을 나눌 수 있습니다.

---

## 환경 변수 (env)

```env
# Server
VITE_API_BASE_URL=https://swapclass.duckdns.org

# Firebase Config & Push Notification
VITE_VAPID_PUBLIC_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=

```

*(기타 환경 설정 및 서드파티 키의 실제 값은 보안을 위해 로컬 .env 파일에 분리하여 관리합니다.)*

---

## 배포

* **서비스 링크:** [https://soo-frontend-brown.vercel.app/](https://soo-frontend-brown.vercel.app/)
* **호스팅 플랫폼:** Vercel (CI/CD 자동 배포 적용)

---

## Role

| 이름 | 역할 |
| --- | --- |
| **강유나** | 마이페이지, 게시글, 교환요청함, 교환 추천 매칭함 |
| **박지아** | 계정 관련, 교환채팅방, 알림함 |
| **송유진** | 라운지, 홈화면, 신고 화면 |
