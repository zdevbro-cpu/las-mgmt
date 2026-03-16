import { createClient } from '@supabase/supabase-js'

// Supabase 연결
const supabaseUrl = 'https://sgxnxbhbyvrmgrzhosyh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG54YmhieXZybWdyemhvc3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDAzMzMsImV4cCI6MjA3MzQ3NjMzM30.1qS_3Qr-zv7woSyPbkdiLkhuXp2pVHJHGiF3iKWEBkc'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 추천인 필터 목록 문제 진단...\n')

async function diagnoseFilterIssue() {
    try {
        // 1. 현재 코드 방식 (페이지네이션 없이)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('⚠️  1. 현재 코드 방식 (페이지네이션 없음)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        let participantsQuery = supabase
            .from('event_participants')
            .select('referrer_code, event_name')
            .not('referrer_code', 'is', null)

        const { data: participantsData } = await participantsQuery

        console.log(`조회된 데이터: ${participantsData?.length || 0}개`)

        const usedReferrerCodes = new Set(participantsData?.map(p => p.referrer_code) || [])
        console.log(`고유 추천인 코드: ${usedReferrerCodes.size}개\n`)

        // LAS1195가 포함되어 있는지 확인
        if (usedReferrerCodes.has('LAS1195')) {
            console.log('✅ LAS1195 (배미운) - 포함됨')
        } else {
            console.log('❌ LAS1195 (배미운) - 누락됨')
        }
        console.log()

        // 2. 올바른 방식 (페이지네이션 적용)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ 2. 올바른 방식 (페이지네이션 적용)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        let allParticipantsData = []
        let from = 0
        const pageSize = 1000

        while (true) {
            const { data, error } = await supabase
                .from('event_participants')
                .select('referrer_code, event_name')
                .not('referrer_code', 'is', null)
                .range(from, from + pageSize - 1)

            if (error) throw error
            if (!data || data.length === 0) break

            allParticipantsData = allParticipantsData.concat(data)

            if (data.length < pageSize) break
            from += pageSize
        }

        console.log(`조회된 데이터: ${allParticipantsData.length}개`)

        const allUsedReferrerCodes = new Set(allParticipantsData.map(p => p.referrer_code))
        console.log(`고유 추천인 코드: ${allUsedReferrerCodes.size}개\n`)

        // LAS1195가 포함되어 있는지 확인
        if (allUsedReferrerCodes.has('LAS1195')) {
            console.log('✅ LAS1195 (배미운) - 포함됨')
        } else {
            console.log('❌ LAS1195 (배미운) - 누락됨')
        }
        console.log()

        // 3. 차이 확인
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 3. 차이 분석')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        console.log(`현재 방식으로 조회된 추천인 수: ${usedReferrerCodes.size}명`)
        console.log(`올바른 방식으로 조회된 추천인 수: ${allUsedReferrerCodes.size}명`)
        console.log(`누락된 추천인 수: ${allUsedReferrerCodes.size - usedReferrerCodes.size}명\n`)

        // 누락된 추천인 코드 찾기
        const missingCodes = [...allUsedReferrerCodes].filter(code => !usedReferrerCodes.has(code))

        if (missingCodes.length > 0) {
            console.log(`누락된 추천인 코드 (최대 20개):`)

            // users 테이블에서 이름 가져오기
            const { data: usersData } = await supabase
                .from('users')
                .select('name, referral_code, branch')
                .in('referral_code', missingCodes.slice(0, 20))

            const userMap = {}
            usersData?.forEach(u => {
                userMap[u.referral_code] = u
            })

            // 각 추천인의 카운트 계산
            const countMap = {}
            allParticipantsData.forEach(p => {
                countMap[p.referrer_code] = (countMap[p.referrer_code] || 0) + 1
            })

            missingCodes.slice(0, 20).forEach(code => {
                const user = userMap[code]
                const count = countMap[code] || 0
                if (user) {
                    console.log(`  - ${code} (${user.name}, ${user.branch}): ${count}명`)
                } else {
                    console.log(`  - ${code}: ${count}명`)
                }
            })

            if (missingCodes.length > 20) {
                console.log(`  ... 외 ${missingCodes.length - 20}개`)
            }
        }
        console.log()

        // 4. users 테이블에서 배미운 확인
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('👤 4. users 테이블에서 배미운 정보')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const { data: baemiunUser } = await supabase
            .from('users')
            .select('name, referral_code, branch')
            .eq('referral_code', 'LAS1195')
            .single()

        if (baemiunUser) {
            console.log(`이름: ${baemiunUser.name}`)
            console.log(`추천인코드: ${baemiunUser.referral_code}`)
            console.log(`지점: ${baemiunUser.branch}`)
        }
        console.log()

        // 5. 필터 목록 생성 로직 시뮬레이션
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔍 5. 필터 목록 생성 로직 시뮬레이션')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // users 테이블에서 모든 사용자 가져오기
        const { data: allUsers } = await supabase
            .from('users')
            .select('name, referral_code')
            .not('referral_code', 'is', null)
            .order('name')

        console.log(`users 테이블의 전체 사용자: ${allUsers?.length || 0}명`)

        // 현재 방식 (잘못된 방식)
        const wrongFilterList = allUsers?.filter(u => usedReferrerCodes.has(u.referral_code)) || []
        console.log(`현재 방식으로 생성된 필터 목록: ${wrongFilterList.length}명`)

        const wrongHasBaemiun = wrongFilterList.some(u => u.referral_code === 'LAS1195')
        if (wrongHasBaemiun) {
            console.log('  ✅ 배미운 포함됨')
        } else {
            console.log('  ❌ 배미운 누락됨')
        }
        console.log()

        // 올바른 방식 (페이지네이션 적용)
        const correctFilterList = allUsers?.filter(u => allUsedReferrerCodes.has(u.referral_code)) || []
        console.log(`올바른 방식으로 생성된 필터 목록: ${correctFilterList.length}명`)

        const correctHasBaemiun = correctFilterList.some(u => u.referral_code === 'LAS1195')
        if (correctHasBaemiun) {
            console.log('  ✅ 배미운 포함됨')
        } else {
            console.log('  ❌ 배미운 누락됨')
        }
        console.log()

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📋 결론')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('\n문제 원인:')
        console.log('  Line 221의 participantsQuery에 페이지네이션 미적용')
        console.log('  → event_participants에서 1000개만 조회')
        console.log('  → 오래된 데이터(배미운 등)가 누락됨')
        console.log('\n해결 방법:')
        console.log('  Line 221 부분에 페이지네이션 추가 필요')
        console.log('  (referrerStatsQuery 수정과 동일한 패턴 적용)')
        console.log()

    } catch (error) {
        console.error('\n❌ 진단 중 오류 발생:', error.message)
        console.error(error.stack)
    }
}

diagnoseFilterIssue()
