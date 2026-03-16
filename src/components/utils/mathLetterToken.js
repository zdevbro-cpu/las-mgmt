// src/utils/mathLetterToken.js
// 수학편지 링크 토큰 생성/검증 유틸리티

/**
 * 수학편지 접속 토큰 생성
 * @param {string} participantCode - 신청자 코드 (예: LAS1011-A0100)
 * @param {number} letterId - 수학편지 ID
 * @returns {string} Base64 인코딩된 토큰
 */
export const generateMathLetterToken = (participantCode, letterId) => {
  const payload = {
    code: participantCode,
    letterId: letterId,
    timestamp: new Date().toISOString()
  }
  
  return btoa(JSON.stringify(payload))
}

/**
 * 토큰 검증 및 디코딩
 * @param {string} token - Base64 토큰
 * @returns {object|null} 디코딩된 데이터 또는 null
 */
export const verifyMathLetterToken = (token) => {
  try {
    const decoded = JSON.parse(atob(token))
    
    // 기본 검증
    if (!decoded.code || !decoded.letterId) {
      return null
    }
    
    return decoded
  } catch (error) {
    console.error('토큰 검증 실패:', error)
    return null
  }
}

/**
 * 수학편지 링크 URL 생성
 * @param {string} participantCode - 신청자 코드
 * @param {number} letterId - 수학편지 ID
 * @param {string} baseUrl - 기본 URL (기본값: 현재 도메인)
 * @returns {string} 완성된 URL
 */
export const generateMathLetterUrl = (participantCode, letterId, baseUrl = window.location.origin) => {
  const token = generateMathLetterToken(participantCode, letterId)
  return `${baseUrl}/math-letter?token=${token}`
}

/**
 * SMS 문자 생성 (카카오 알림톡 형식)
 * @param {string} parentName - 학부모명
 * @param {string} series - 시리즈 (예: K2)
 * @param {number} dayNumber - 일차
 * @param {string} url - 수학편지 URL
 * @returns {string} SMS 메시지
 */
export const generateSmsMessage = (parentName, series, dayNumber, url) => {
  return `[LAS 수학편지]

안녕하세요, ${parentName}님!

${series} ${dayNumber}일차 수학편지를 보내드립니다.

📚 수학편지 보러가기
${url}

자녀의 수학 실력 향상을 응원합니다!

- LAS 매장관리 시스템`
}