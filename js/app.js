// ============================================
// 🌿 "내 이야기를 들어줘!" - 메인 앱 로직
// ============================================
// 이 파일은 채팅 앱의 핵심 로직을 담당합니다.
// API 키 처리, 메시지 전송, UI 업데이트 등을 관리합니다.

// ── 페이지가 완전히 로드된 후 앱을 시작합니다 ──
document.addEventListener('DOMContentLoaded', function () {

  // ============================================
  // 1. DOM 요소 참조 가져오기
  // ============================================
  // HTML에서 자주 사용할 요소들을 미리 변수에 저장해둡니다.
  // 매번 document.getElementById를 호출하지 않아도 됩니다.

  const apiKeySection = document.getElementById('api-key-section');   // API 키 입력 화면
  const apiKeyInput = document.getElementById('api-key-input');       // API 키 입력 필드
  const startBtn = document.getElementById('start-btn');              // 시작하기 버튼
  const chatSection = document.getElementById('chat-section');        // 채팅 화면
  const chatMessages = document.getElementById('chat-messages');      // 채팅 메시지 목록
  const userInput = document.getElementById('user-input');            // 사용자 메시지 입력 필드
  const sendBtn = document.getElementById('send-btn');                // 전송 버튼
  const loading = document.getElementById('loading');                 // 로딩 인디케이터

  // ============================================
  // 2. 상태 변수 초기화
  // ============================================

  // 대화 기록을 저장하는 배열입니다.
  // GeminiAPI에 보낼 때 이전 대화 맥락을 함께 전달합니다.
  // 형식: [{role: "user", text: "..."}, {role: "model", text: "..."}, ...]
  var conversationHistory = [];

  // 메시지 전송 중인지 나타내는 플래그입니다.
  // true이면 중복 전송을 방지합니다.
  var isLoading = false;

  // ============================================
  // 3. localStorage에서 저장된 API 키 불러오기
  // ============================================
  // 이전에 저장한 API 키가 있으면 입력 필드에 자동으로 채워줍니다.
  // 사용자가 매번 다시 입력하지 않아도 됩니다.

  var savedApiKey = localStorage.getItem('gemini-api-key');
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
  }

  // ============================================
  // 4. 이벤트 리스너 등록
  // ============================================

  // 시작하기 버튼 클릭 → API 키 처리
  startBtn.addEventListener('click', handleApiKey);

  // API 키 입력 필드에서 Enter 키 → 시작하기 버튼 클릭과 동일
  apiKeyInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      handleApiKey();
    }
  });

  // 전송 버튼 클릭 → 메시지 전송
  sendBtn.addEventListener('click', handleSendMessage);

  // 입력 필드에서 키 입력 처리
  userInput.addEventListener('keydown', function (event) {
    // Enter 키를 누르면 메시지를 전송합니다.
    // 단, Shift+Enter는 줄바꿈으로 사용합니다.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // 기본 줄바꿈 동작을 막습니다
      handleSendMessage();
    }
  });

  // 입력 필드 자동 높이 조절 (textarea인 경우)
  // 사용자가 여러 줄을 입력하면 입력 필드가 자동으로 늘어납니다.
  userInput.addEventListener('input', function () {
    // textarea일 때만 자동 높이 조절을 적용합니다
    if (userInput.tagName.toLowerCase() === 'textarea') {
      userInput.style.height = 'auto';                   // 높이를 초기화합니다
      userInput.style.height = userInput.scrollHeight + 'px'; // 내용에 맞게 높이를 조절합니다
    }
  });

  // ============================================
  // 5. API 키 처리 함수
  // ============================================
  // 시작하기 버튼을 클릭하면 실행됩니다.
  // API 키를 검증하고, 성공하면 채팅 화면으로 전환합니다.

  async function handleApiKey() {
    // 입력된 API 키를 가져옵니다 (앞뒤 공백 제거)
    var apiKey = apiKeyInput.value.trim();

    // 빈 값 체크: 아무것도 입력하지 않은 경우
    if (!apiKey) {
      alert('API 키를 입력해주세요.');
      apiKeyInput.focus();
      return;
    }

    // 버튼을 "확인 중..." 상태로 변경합니다.
    // 사용자에게 처리 중임을 알려줍니다.
    startBtn.textContent = '확인 중...';
    startBtn.disabled = true;

    try {
      // GeminiAPI를 사용하여 API 키가 유효한지 검증합니다.
      var isValid = await window.GeminiAPI.validateApiKey(apiKey);

      if (isValid) {
        // ── 검증 성공 ──

        // API 키를 설정합니다
        window.GeminiAPI.setApiKey(apiKey);

        // 다음 방문 시 자동으로 채우기 위해 localStorage에 저장합니다
        localStorage.setItem('gemini-api-key', apiKey);

        // API 키 입력 화면을 숨기고 채팅 화면을 표시합니다
        apiKeySection.style.display = 'none';
        chatSection.style.display = '';  // display를 기본값으로 복원합니다

        // 상담사의 환영 메시지를 표시합니다
        addMessage(
          '안녕하세요! 저는 마음이예요 🌿\n' +
          '24시간 당신의 이야기를 들어드리는 심리 상담사입니다.\n' +
          '오늘 어떤 이야기를 나누고 싶으신가요?\n' +
          '편하게 말씀해주세요 😊',
          'counselor'
        );

        // 사용자가 바로 메시지를 입력할 수 있도록 포커스를 이동합니다
        userInput.focus();
      } else {
        // ── 검증 실패 ──
        alert('API 키가 올바르지 않습니다. 다시 확인해주세요.');
        // 버튼을 원래 상태로 복원합니다
        startBtn.textContent = '시작하기';
        startBtn.disabled = false;
      }
    } catch (error) {
      // ── 네트워크 오류 등 예외 발생 ──
      console.error('API 키 검증 중 오류 발생:', error);
      alert('API 키 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
      // 버튼을 원래 상태로 복원합니다
      startBtn.textContent = '시작하기';
      startBtn.disabled = false;
    }
  }

  // ============================================
  // 6. 메시지 전송 처리 함수
  // ============================================
  // 전송 버튼을 클릭하거나 Enter 키를 누르면 실행됩니다.

  async function handleSendMessage() {
    // 입력된 메시지를 가져옵니다 (앞뒤 공백 제거)
    var messageText = userInput.value.trim();

    // 빈 메시지는 전송하지 않습니다
    if (!messageText) {
      return;
    }

    // 로딩 중에는 중복 전송을 방지합니다
    if (isLoading) {
      return;
    }

    // ── 1단계: 사용자 메시지를 화면에 표시합니다 ──
    addMessage(messageText, 'user');

    // ── 2단계: 입력 필드를 비웁니다 ──
    userInput.value = '';
    // textarea인 경우 높이도 초기화합니다
    if (userInput.tagName.toLowerCase() === 'textarea') {
      userInput.style.height = 'auto';
    }

    // ── 3단계: 로딩 상태를 표시합니다 ──
    showLoading();
    sendBtn.disabled = true;

    try {
      // ── 4단계: API를 호출하여 상담사 응답을 받습니다 ──
      var response = await window.GeminiAPI.sendMessage(messageText, conversationHistory);

      // ── 5단계: 대화 기록에 이번 대화를 추가합니다 ──
      // 사용자 메시지와 상담사 응답을 순서대로 기록합니다.
      // 다음 메시지 전송 시 이전 맥락으로 활용됩니다.
      conversationHistory.push({ role: 'user', text: messageText });
      conversationHistory.push({ role: 'model', text: response });

      // ── 6단계: 상담사 응답을 화면에 표시합니다 ──
      addMessage(response, 'counselor');

    } catch (error) {
      // ── 오류 발생 시 에러 메시지를 상담사 메시지로 표시합니다 ──
      console.error('메시지 전송 중 오류 발생:', error);
      addMessage(
        '죄송합니다. 메시지 처리 중 문제가 발생했어요.\n잠시 후 다시 시도해주세요. 🙏',
        'counselor'
      );
    } finally {
      // ── 7단계: 로딩 상태를 해제합니다 ──
      // try가 성공하든 실패하든 항상 실행됩니다.
      hideLoading();
      sendBtn.disabled = false;

      // ── 8단계: 스크롤을 맨 아래로 이동합니다 ──
      scrollToBottom();
    }
  }

  // ============================================
  // 7. UI 헬퍼 함수들
  // ============================================

  /**
   * 채팅 메시지를 화면에 추가하는 함수입니다.
   *
   * @param {string} text - 표시할 메시지 내용
   * @param {string} sender - 메시지 발신자 ("user" 또는 "counselor")
   */
  function addMessage(text, sender) {
    // 메시지를 담을 div 요소를 생성합니다
    var messageDiv = document.createElement('div');

    // 발신자에 따라 다른 CSS 클래스를 적용합니다.
    // CSS에서 이 클래스를 기반으로 스타일을 지정합니다.
    // (예: 사용자 메시지는 오른쪽, 상담사 메시지는 왼쪽)
    messageDiv.className = 'message message--' + sender;

    // 상담사 메시지일 경우 "🌿 마음이" 라벨을 추가합니다
    if (sender === 'counselor') {
      var labelDiv = document.createElement('div');
      labelDiv.className = 'message__label';
      labelDiv.textContent = '🌿 마음이';
      messageDiv.appendChild(labelDiv);
    }

    // 메시지 텍스트를 담을 요소를 생성합니다
    var textDiv = document.createElement('div');
    textDiv.className = 'message-text';

    // 텍스트에서 줄바꿈(\n)을 HTML의 <br> 태그로 변환합니다.
    // 이렇게 하면 여러 줄의 메시지가 화면에서도 줄바꿈됩니다.
    textDiv.innerHTML = text.replace(/\n/g, '<br>');

    messageDiv.appendChild(textDiv);

    // 생성한 메시지 요소를 채팅 메시지 목록에 추가합니다
    chatMessages.appendChild(messageDiv);

    // 새 메시지가 보이도록 자동으로 스크롤합니다
    scrollToBottom();
  }

  /**
   * 로딩 인디케이터를 표시하는 함수입니다.
   * 상담사가 응답을 생성하는 동안 사용자에게 대기 중임을 알려줍니다.
   */
  function showLoading() {
    isLoading = true;                    // 로딩 상태 플래그를 켭니다
    loading.hidden = false;              // 로딩 인디케이터를 보여줍니다
    scrollToBottom();                    // 로딩 인디케이터가 보이도록 스크롤합니다
  }

  /**
   * 로딩 인디케이터를 숨기는 함수입니다.
   * 상담사 응답이 도착하면 호출됩니다.
   */
  function hideLoading() {
    isLoading = false;                   // 로딩 상태 플래그를 끕니다
    loading.hidden = true;               // 로딩 인디케이터를 숨깁니다
  }

  /**
   * 채팅 메시지 영역을 부드럽게 맨 아래로 스크롤하는 함수입니다.
   * 새 메시지가 추가될 때마다 호출되어 최신 메시지가 항상 보이게 합니다.
   */
  function scrollToBottom() {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,    // 스크롤 가능한 최대 높이로 이동
      behavior: 'smooth'                 // 부드러운 스크롤 애니메이션 적용
    });
  }

}); // DOMContentLoaded 끝
