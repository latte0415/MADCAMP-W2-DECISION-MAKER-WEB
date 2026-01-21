# 의사결정 플랫폼 프론트엔드

UI 스펙과 API 스펙을 기반으로 구현한 React 프론트엔드 애플리케이션입니다.

## 기술 스택

- React 19
- TypeScript
- Vite
- React Router v7

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 빌드

```bash
npm run build
```

### 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```
VITE_API_BASE_URL=http://localhost:8000
```

## 주요 기능

### 인증
- 로그인
- 회원가입
- 비밀번호 재설정

### 홈 화면
- 이벤트 목록 조회
- 코드로 이벤트 참가
- 이벤트 생성
- 이벤트 개요 확인

### 이벤트 상세
- 전제/기준 제안 및 투표
- 코멘트 작성
- 결론 제안
- 최종 투표
- 이벤트 설정 (관리자)

## 프로젝트 구조

```
src/
├── api/           # API 클라이언트
├── components/    # 재사용 가능한 컴포넌트
├── hooks/         # 커스텀 훅
├── pages/         # 페이지 컴포넌트
├── utils/         # 유틸리티 함수
└── App.tsx        # 메인 앱 컴포넌트
```

## 디자인 시스템

디자인 가이드에 따라 Neutral 팔레트를 중심으로 한 미니멀 클린 디자인을 적용했습니다.

- 색상: Neutral 900-50, Semantic 색상 (Success, Error)
- 타이포그래피: Noto Sans KR, Montserrat
- 간격: 4px 기준 그리드 시스템
- 보더 반경: 6px-16px
- 그림자: 레이어드 그림자 시스템
