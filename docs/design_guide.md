# 디자인 가이드

## 디자인 철학

**미니멀 클린 (Minimal Clean) - 감각적이고 세련된**

- 불필요한 장식 제거, 핵심에 집중
- 깔끔한 레이아웃과 넉넉한 여백
- 부드러운 전환 효과와 미묘한 그림자
- 세련된 색상 팔레트와 타이포그래피
- 일관된 디자인 언어로 사용자 경험 향상

## 색상 시스템

### Neutral 팔레트 (주요 색상)

브랜드 컬러 없이 Neutral 팔레트 중심으로 구성합니다.

- **Neutral 900** (`#111111`) - 주요 텍스트, 강조 요소
- **Neutral 800** (`#1a1a1a`) - 보조 텍스트
- **Neutral 700** (`#333333`) - 부제목, 보조 정보
- **Neutral 500** (`#666666`) - 비활성 텍스트
- **Neutral 400** (`#999999`) - 경계선, 구분선
- **Neutral 300** (`#cccccc`) - 얇은 경계선
- **Neutral 200** (`#e5e5e5`) - 배경 구분
- **Neutral 100** (`#f5f5f5`) - 연한 배경
- **Neutral 50** (`#fafafa`) - 매우 연한 배경
- **White** (`#ffffff`) - 기본 배경

### Semantic 색상 (최소한의 사용)

- **Success** (`#2e7d32`) - 성공 메시지, 확인 상태
- **Error** (`#c0392b`) - 오류 메시지, 경고
- **Warning** (`#f57c00`) - 경고 (필요시)

## 타이포그래피

### 폰트 패밀리

- **Primary**: "Noto Sans KR" - 한글 본문
- **Secondary**: "Montserrat" - 영문, 브랜드명, 제목

### 폰트 크기

- **Heading 1**: 32px / 1.2 - 페이지 제목
- **Heading 2**: 24px / 1.3 - 섹션 제목
- **Heading 3**: 20px / 1.4 - 하위 섹션
- **Body Large**: 18px / 1.5 - 중요 본문
- **Body**: 16px / 1.5 - 기본 본문
- **Body Small**: 14px / 1.5 - 보조 본문
- **Caption**: 12px / 1.4 - 캡션, 힌트

### 폰트 굵기

- **Bold**: 700 - 제목, 강조
- **Semi-bold**: 600 - 부제목, 중요 텍스트
- **Medium**: 500 - 보통 텍스트
- **Regular**: 400 - 기본 텍스트

## 간격 시스템

4px 기준 그리드 시스템을 사용합니다.

- **spacing-1**: 4px
- **spacing-2**: 8px
- **spacing-3**: 12px
- **spacing-4**: 16px
- **spacing-5**: 20px
- **spacing-6**: 24px
- **spacing-7**: 28px
- **spacing-8**: 32px
- **spacing-10**: 40px
- **spacing-12**: 48px
- **spacing-16**: 64px

## 보더 반경

더 부드러운 곡선을 사용합니다.

- **radius-sm**: 6px - 작은 요소
- **radius-md**: 8px - 기본 요소 (버튼, 입력)
- **radius-lg**: 12px - 카드
- **radius-xl**: 16px - 모달
- **radius-full**: 999px - 완전한 원형 (배지, 토글)

## 그림자

부드럽고 미묘한 그림자를 사용합니다 (레이어드 그림자).

- **shadow-sm**: `0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)` - 작은 요소
- **shadow-md**: `0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)` - 카드
- **shadow-lg**: `0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)` - 모달
- **shadow-xl**: `0 20px 48px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06)` - 큰 모달

## 전환 효과

부드러운 cubic-bezier 곡선을 사용합니다.

- **transition-fast**: 120ms cubic-bezier(0.4, 0, 0.2, 1) - 빠른 상호작용
- **transition-base**: 200ms cubic-bezier(0.4, 0, 0.2, 1) - 기본 전환
- **transition-slow**: 300ms cubic-bezier(0.4, 0, 0.2, 1) - 느린 전환
- **transition-smooth**: 400ms cubic-bezier(0.4, 0, 0.2, 1) - 매우 부드러운 전환

## 컴포넌트 스타일 가이드

### 버튼

**Primary Button**
- 배경: Neutral 900
- 텍스트: White
- 패딩: 12px 32px
- 보더 반경: 8px
- Hover: 배경색 약간 밝게, 그림자 추가, 약간 위로 이동
- Active: 그림자 축소

**Secondary Button**
- 배경: Transparent
- 텍스트: Neutral 900
- 보더: 1px solid Neutral 300
- 패딩: 10px 28px

**Ghost Button**
- 배경: Transparent
- 텍스트: Neutral 900
- 패딩: 0 10px
- 보더: 없음

**Disabled State**
- 투명도: 0.5
- 커서: not-allowed

### 입력 필드

- 보더: 1px solid rgba(0, 0, 0, 0.08)
- 보더 반경: 8px
- 패딩: 0 16px
- 높이: 44px (기본)
- Focus: 보더 색상 강조 + 부드러운 그림자 링 (rgba(0, 0, 0, 0.04))
- 배경: White

### 카드

- 배경: White
- 보더: 1px solid rgba(0, 0, 0, 0.08)
- 보더 반경: 12px
- 패딩: 24px 24px
- 그림자: shadow-sm
- Hover: 그림자 강화, 보더 색상 약간 진하게, 약간 위로 이동

### 모달

- 배경: White
- 보더: 1px solid rgba(0, 0, 0, 0.08)
- 보더 반경: 16px
- 그림자: shadow-xl (레이어드 그림자)
- 패딩: 24px 24px
- 최대 너비: 980px (반응형)
- Backdrop: rgba(0, 0, 0, 0.35) + blur(2px)

### 배지

- 배경: Neutral 900 (기본) 또는 Semantic 색상
- 텍스트: White
- 패딩: 4px 10px
- 보더 반경: 999px
- 폰트 크기: 12px

### 상태 표시 (Status Pills)

- **대기**: Neutral 500
- **진행 중**: Neutral 700
- **일시정지**: Neutral 600
- **완료**: Success 색상

## 레이아웃 원칙

1. **넉넉한 여백**: 요소 간 충분한 간격 유지
2. **일관된 정렬**: 그리드 시스템 준수
3. **명확한 계층**: 시각적 중요도에 따른 크기/색상 차별화
4. **반응형**: 모바일과 데스크톱 모두 고려

## 접근성

- 텍스트 대비율: 최소 4.5:1 (WCAG AA 기준)
- 포커스 표시: 명확한 포커스 링 또는 아웃라인
- 인터랙티브 요소: 최소 터치 영역 44x44px
