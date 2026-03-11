# 내 이야기를 들어줘! 🌿

> 24시간 당신의 이야기를 들어드리는 AI 심리 상담 웹페이지

## 소개

**"내 이야기를 들어줘!"** 는 Google Gemini API를 활용한 24시간 AI 심리 상담 서비스입니다.
따뜻하고 공감적인 상담사 '마음이'가 당신의 이야기를 경청합니다.

## 주요 기능

- 🤖 Gemini 2.0 Flash 기반 AI 심리 상담
- 💬 실시간 채팅 인터페이스
- 🔑 사용자 직접 API 키 입력 (안전한 클라이언트 사이드)
- 💾 API 키 자동 저장 (localStorage)
- 📱 모바일 반응형 디자인
- 🎨 따뜻한 라벤더/크림 색상 테마
- ⚠️ 위기 상황 시 전문 상담 기관 안내

## 실행 방법

### 방법 1: 브라우저에서 직접 열기
`index.html` 파일을 브라우저에서 열면 바로 사용할 수 있습니다.

### 방법 2: 로컬 서버 실행
```bash
# Windows
serve.bat

# Mac/Linux
bash serve.sh
```

## API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey)에 접속
2. 무료 API 키 발급
3. 웹페이지에서 API 키 입력 후 시작

## 사용 기술

- HTML5
- CSS3 (CSS Variables, Flexbox, Animations)
- Vanilla JavaScript (ES5+)
- Google Gemini API (REST)

## 프로젝트 구조

```
├── index.html      # 메인 HTML 페이지
├── css/
│   └── style.css   # 스타일시트
├── js/
│   ├── api.js      # Gemini API 연동 모듈
│   └── app.js      # 메인 앱 로직
├── favicon.svg     # 파비콘
├── serve.bat       # Windows 로컬 서버
└── serve.sh        # Mac/Linux 로컬 서버
```

## 참고

- 이 서비스는 AI 기반 상담으로, 전문적인 심리 상담을 대체하지 않습니다.
- 긴급 상황 시: 자살예방상담전화 **1393**, 정신건강위기상담전화 **1577-0199**

---

당신은 혼자가 아닙니다 💛
