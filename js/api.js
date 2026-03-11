/**
 * ============================================
 * "내 이야기를 들어줘!" - Gemini API 연동 모듈
 * ============================================
 *
 * 이 파일은 Google Gemini API와 통신하는 기능을 담당합니다.
 * window.GeminiAPI 전역 객체로 어디서든 사용할 수 있습니다.
 *
 * 사용법:
 *   GeminiAPI.setApiKey("내_API_키");
 *   const isValid = await GeminiAPI.validateApiKey("내_API_키");
 *   const reply = await GeminiAPI.sendMessage("안녕하세요", []);
 */

// ── 즉시 실행 함수로 감싸서 내부 변수가 전역을 오염시키지 않도록 합니다 ──
(function () {
  "use strict";

  // ─────────────────────────────────────────
  // 1. 기본 설정값
  // ─────────────────────────────────────────

  /** 사용할 Gemini 모델 이름 */
  var MODEL = "gemini-2.0-flash";

  /** Gemini REST API 기본 주소 */
  var BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

  /** 콘텐츠 생성 엔드포인트 (API 키는 쿼리 파라미터로 붙입니다) */
  var ENDPOINT = BASE_URL + "/models/" + MODEL + ":generateContent";

  /** 사용자가 입력한 API 키를 저장해 두는 변수 (외부에서 직접 접근 불가) */
  var apiKey = "";

  /** 마음이(상담사)의 성격과 행동 규칙을 정의하는 시스템 프롬프트 */
  var SYSTEM_PROMPT =
    "당신은 따뜻하고 공감적인 24시간 심리 상담사입니다. 이름은 '마음이'입니다.\n\n" +
    "상담 규칙:\n" +
    "1. 항상 공감적이고 따뜻한 어조로 대화합니다.\n" +
    "2. 사용자의 감정을 먼저 인정하고 공감합니다.\n" +
    "3. 조언보다는 경청과 공감을 우선합니다.\n" +
    "4. 위험한 상황(자해, 자살 등)이 감지되면 반드시 전문 상담 기관" +
    "(자살예방상담전화 1393, 정신건강위기상담전화 1577-0199)을 안내합니다.\n" +
    "5. 의학적 진단이나 처방은 하지 않으며, 필요시 전문가 상담을 권유합니다.\n" +
    "6. 한국어로 대화합니다.\n" +
    "7. 답변은 200자 내외로 간결하되 따뜻하게 합니다.\n" +
    "8. 적절한 이모지를 사용하여 친근한 분위기를 만듭니다.";

  // ─────────────────────────────────────────
  // 2. 내부 헬퍼 함수
  // ─────────────────────────────────────────

  /**
   * 대화 기록 배열을 Gemini API가 요구하는 contents 형식으로 변환합니다.
   *
   * 입력 형식:  [{role: "user", text: "..."}, {role: "model", text: "..."}]
   * 출력 형식:  [{role: "user", parts: [{text: "..."}]}, ...]
   *
   * @param {Array} history - 대화 기록 배열
   * @returns {Array} Gemini API contents 형식 배열
   */
  function buildContents(history) {
    var contents = [];

    // 기존 대화 기록을 하나씩 변환합니다
    for (var i = 0; i < history.length; i++) {
      contents.push({
        role: history[i].role, // "user" 또는 "model"
        parts: [{ text: history[i].text }],
      });
    }

    return contents;
  }

  /**
   * API 응답의 HTTP 상태 코드를 보고 적절한 한국어 에러 메시지를 반환합니다.
   *
   * @param {number} status - HTTP 상태 코드
   * @returns {string} 사용자에게 보여줄 에러 메시지
   */
  function getErrorMessage(status) {
    // 400 : 잘못된 요청 (API 키 오류 포함)
    // 401 : 인증 실패
    // 403 : 권한 없음 (API 키가 잘못되었거나 비활성화됨)
    if (status === 400 || status === 401 || status === 403) {
      return "API 키가 올바르지 않습니다. 다시 확인해주세요.";
    }

    // 404 : 요청한 모델을 찾을 수 없음
    if (status === 404) {
      return "요청한 AI 모델을 찾을 수 없습니다. 관리자에게 문의해주세요.";
    }

    // 429 : 요청이 너무 많음 (속도 제한)
    if (status === 429) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    }

    // 그 외 서버 오류 등
    return "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  // ─────────────────────────────────────────
  // 3. 공개 API (window.GeminiAPI)
  // ─────────────────────────────────────────

  window.GeminiAPI = {
    /**
     * API 키를 저장합니다.
     * 다른 함수를 호출하기 전에 반드시 먼저 실행해야 합니다.
     *
     * @param {string} key - Google AI Studio에서 발급받은 API 키
     *
     * 사용 예시:
     *   GeminiAPI.setApiKey("AIzaSy...");
     */
    setApiKey: function (key) {
      apiKey = key;
    },

    /**
     * API 키가 유효한지 간단한 테스트 요청을 보내서 확인합니다.
     * 짧은 메시지를 보내보고, 정상 응답이 오면 true를 반환합니다.
     *
     * @param {string} key - 검증할 API 키
     * @returns {Promise<boolean>} 유효하면 true, 아니면 false
     *
     * 사용 예시:
     *   var isValid = await GeminiAPI.validateApiKey("AIzaSy...");
     *   if (isValid) { console.log("키가 유효합니다!"); }
     */
    validateApiKey: async function (key) {
      // API 키가 비어있으면 바로 실패 처리
      if (!key || key.trim() === "") {
        return false;
      }

      try {
        // 모델 목록 조회 API로 키 유효성을 확인합니다.
        // 이 방식은 특정 모델에 의존하지 않아 더 안정적입니다.
        var response = await fetch(
          BASE_URL + "/models?key=" + key
        );

        // HTTP 200이면 키가 유효한 것입니다
        return response.ok;
      } catch (error) {
        // 네트워크 오류 등이 발생하면 false 반환
        console.error("API 키 검증 중 오류:", error);
        return false;
      }
    },

    /**
     * 사용자 메시지를 Gemini API에 보내고 상담사(마음이)의 답변을 받아옵니다.
     *
     * @param {string} userMessage - 사용자가 입력한 메시지
     * @param {Array} conversationHistory - 이전 대화 기록
     *   형식: [{role: "user", text: "..."}, {role: "model", text: "..."}, ...]
     * @returns {Promise<string>} 마음이의 답변 텍스트
     *
     * 사용 예시:
     *   var history = [
     *     {role: "user", text: "요즘 힘들어요"},
     *     {role: "model", text: "많이 힘드셨군요..."}
     *   ];
     *   var reply = await GeminiAPI.sendMessage("회사 스트레스가 심해요", history);
     *   console.log(reply); // 마음이의 답변
     */
    sendMessage: async function (userMessage, conversationHistory) {
      // API 키가 설정되어 있는지 먼저 확인합니다
      if (!apiKey) {
        return "API 키가 설정되지 않았습니다. 먼저 API 키를 입력해주세요.";
      }

      try {
        // ── 요청 본문(body) 구성 ──

        // 1) 이전 대화 기록을 API 형식으로 변환합니다
        var contents = buildContents(conversationHistory || []);

        // 2) 현재 사용자 메시지를 대화 끝에 추가합니다
        contents.push({
          role: "user",
          parts: [{ text: userMessage }],
        });

        // 3) 전체 요청 객체를 조립합니다
        var requestBody = {
          // 시스템 프롬프트: 마음이의 성격과 규칙을 설정합니다
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },

          // 대화 내용: 이전 기록 + 현재 메시지
          contents: contents,

          // 생성 설정: 답변의 창의성과 길이를 조절합니다
          generationConfig: {
            temperature: 0.8, // 0~1 사이, 높을수록 창의적 (0.8은 자연스러운 대화용)
            topP: 0.95, // 상위 95% 확률의 단어 중에서 선택
            maxOutputTokens: 1024, // 최대 출력 토큰 수
          },
        };

        // ── API 호출 ──
        var response = await fetch(ENDPOINT + "?key=" + apiKey, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        // ── 응답 처리 ──

        // HTTP 상태가 200이 아니면 에러 처리
        if (!response.ok) {
          return getErrorMessage(response.status);
        }

        // JSON으로 파싱합니다
        var data = await response.json();

        // 응답에서 텍스트를 추출합니다
        // 구조: data.candidates[0].content.parts[0].text
        if (
          data.candidates &&
          data.candidates.length > 0 &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts.length > 0
        ) {
          return data.candidates[0].content.parts[0].text;
        }

        // 응답 구조가 예상과 다르면 기본 에러 메시지 반환
        return "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      } catch (error) {
        // fetch 자체가 실패한 경우 (인터넷 끊김 등)
        console.error("메시지 전송 중 오류:", error);

        // TypeError는 보통 네트워크 문제일 때 발생합니다
        if (error instanceof TypeError) {
          return "네트워크 연결을 확인해주세요.";
        }

        // 그 외 예상치 못한 오류
        return "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      }
    },
  };
})();
