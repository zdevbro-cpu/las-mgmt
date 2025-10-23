// utils/shareUtils.js

/**
 * 참가자 공유 URL 생성
 */
export const generateShareUrl = (participantId) => {
  const baseUrl = window.location.origin
  return `${baseUrl}/event/${participantId}`
}

/**
 * 카카오톡/문자 공유용 메시지 생성
 */
export const generateShareMessage = (participantName, eventName, shareUrl) => {
  return `🎉 ${participantName}님이 ${eventName} 이벤트에 참여했어요!\n\n아래 링크를 클릭해서 확인해보세요 👇\n${shareUrl}`
}

/**
 * 클립보드에 복사
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('클립보드 복사 실패:', err)
    return false
  }
}

/**
 * 카카오톡 공유 (Web Share API)
 */
export const shareViaKakao = async (title, text, url) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url
      })
      return true
    } catch (err) {
      console.error('공유 실패:', err)
      return false
    }
  } else {
    // Web Share API 미지원 시 클립보드 복사
    return await copyToClipboard(url)
  }
}

/**
 * HTML 이메일 템플릿 생성
 */
export const generateEmailHTML = (participant, event, shareUrl) => {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="${event.name}">
    <meta property="og:description" content="${participant.customer_name}님의 이벤트 참여">
    <meta property="og:image" content="${participant.generated_image_url}">
    <meta property="og:url" content="${shareUrl}">
    <title>${event.name} - ${participant.customer_name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        .image-container {
            position: relative;
            cursor: pointer;
            overflow: hidden;
        }
        .image-container img {
            width: 100%;
            height: auto;
            display: block;
            transition: transform 0.3s ease;
        }
        .image-container:hover img {
            transform: scale(1.05);
        }
        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s ease;
        }
        .image-container:hover .overlay {
            background: rgba(0,0,0,0.3);
        }
        .overlay-text {
            background: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: bold;
            color: #14b8a6;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.3s ease;
        }
        .image-container:hover .overlay-text {
            opacity: 1;
            transform: scale(1);
        }
        .footer {
            background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%);
            padding: 30px;
            text-align: center;
        }
        .btn {
            display: inline-block;
            background: white;
            color: #14b8a6;
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .info {
            padding: 20px 30px;
            background: #f8fafc;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ${event.name}</h1>
            <p>${participant.customer_name}님의 이벤트 참여</p>
        </div>
        
        <a href="${event.landing_url}" class="image-container">
            <img src="${participant.generated_image_url}" alt="${event.name}">
            <div class="overlay">
                <div class="overlay-text">
                    👆 클릭하여 참여하기
                </div>
            </div>
        </a>
        
        <div class="footer">
            <a href="${event.landing_url}" class="btn">
                🎁 이벤트 참여하기
            </a>
        </div>
        
        ${event.description ? `
        <div class="info">
            <p>${event.description}</p>
        </div>
        ` : ''}
    </div>
</body>
</html>
  `.trim()
}