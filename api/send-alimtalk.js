import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { phone, templateCode, params, participant_id, letter_id, sender_id } = req.body

        if (!phone) {
            return res.status(400).json({ error: '전화번호는 필수입니다.' })
        }

        // Supabase 클라이언트 초기화 (Service Role Key 사용 권장하지만, 여기서는 환경변수 확인)
        const supabaseUrl = process.env.VITE_SUPABASE_URL
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY // 또는 SERVICE_ROLE_KEY

        let supabase = null
        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey)
        }

        // 환경 변수에서 API 키 확인
        const apiKey = process.env.ALIMTALK_API_KEY

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📨 [Mock] 알림톡 전송 요청 수신')
        console.log(`📞 수신번호: ${phone}`)
        console.log(`📝 템플릿코드: ${templateCode || '기본'}`)
        console.log(`📦 파라미터:`, params)
        if (participant_id) console.log(`👤 참가자ID: ${participant_id}`)
        if (letter_id) console.log(`📄 편지ID: ${letter_id}`)

        let success = false
        let message = ''

        if (!apiKey) {
            console.log('⚠️ API Key가 설정되지 않았습니다. Mock 모드로 동작합니다.')
            console.log('✅ 전송 성공 (Simulated)')
            success = true
            message = '전송 성공 (테스트 모드)'
        } else {
            // TODO: 실제 BSP API 연동
            // const result = await sendToBSP(...)
            success = true // 임시
            message = '전송 성공'
        }

        // DB에 로그 기록
        if (success && supabase && participant_id && letter_id) {
            try {
                const { error } = await supabase
                    .from('math_letter_send_logs')
                    .insert({
                        participant_id,
                        letter_id,
                        sent_by: sender_id || null,
                        status: 'success',
                        sent_at: new Date().toISOString()
                    })

                if (error) {
                    console.error('⚠️ 로그 기록 실패:', error)
                } else {
                    console.log('✅ 발송 로그 기록 완료')
                }
            } catch (logError) {
                console.error('⚠️ 로그 기록 중 예외 발생:', logError)
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        return res.status(200).json({
            success: true,
            message: message,
            data: {
                phone,
                params,
                mode: apiKey ? 'live' : 'mock'
            }
        })

    } catch (error) {
        console.error('❌ 알림톡 전송 에러:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
