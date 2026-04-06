import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
    신용카드 결제 영수증 이미지에서 다음 정보를 추출하여 JSON 형식으로 응답해줘.
    응답은 반드시 아래 JSON 스키마를 따라야 하며, 정보가 없는 경우 빈 문자열("")을 넣어줘.
    금액은 콤마 없이 숫자만 추출해줘.

    추출 항목:
    1. amount: 결제금액 (또는 합계금액)
    2. issuer: 카드사 이름 (예: 신한카드, 국민카드 등)
    3. approvalNo: 승인번호 (보통 8자리 숫자)
    4. terminalNo: 단말기번호 (보통 10자리 내외)
    5. serialNo: 일련번호 (가맹점번호 또는 전표번호가 아닌 일련번호/Serial No)

    응답 형식 예시:
    {
      "amount": "15000",
      "issuer": "현대카드",
      "approvalNo": "12345678",
      "terminalNo": "7123456789",
      "serialNo": "0001"
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const responseText = response.text();
    
    // JSON 블록 추출 시도
    let jsonText = responseText;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    try {
      const data = JSON.parse(jsonText);
      return res.status(200).json(data);
    } catch (parseError) {
      console.error('JSON Parse Error. Raw Text:', responseText);
      return res.status(500).json({ 
        error: 'AI 응답 형식이 올바르지 않습니다.',
        debug: responseText 
      });
    }
  } catch (err) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({ error: '제미나이 연동 오류: ' + err.message });
  }
}
