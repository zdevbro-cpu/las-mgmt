import { createClient } from '@supabase/supabase-js'

// Supabase 연결
const supabaseUrl = 'https://sgxnxbhbyvrmgrzhosyh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG54YmhieXZybWdyemhvc3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDAzMzMsImV4cCI6MjA3MzQ3NjMzM30.1qS_3Qr-zv7woSyPbkdiLkhuXp2pVHJHGiF3iKWEBkc'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 추천인 Top12 문제 진단 시작...\n')

async function runDiagnosis() {
    try {
        // 1. 전체 참가자 수
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 1. 전체 참가자 수 확인')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        const { count: totalCount } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })

        console.log(`✅ 전체 참가자: ${totalCount}명`)
        if (totalCount > 1000) {
            console.log(`⚠️  경고: 1000명 초과! Supabase 기본 제한으로 인해 일부 데이터가 누락될 수 있습니다.`)
        }
        console.log()

        // 2. referrer_code가 있는 참가자 수
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 2. 추천인 코드가 있는 참가자 수')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        const { count: withReferrerCount } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .not('referrer_code', 'is', null)

        console.log(`✅ 추천인 코드 있음: ${withReferrerCount}명`)
        console.log(`⚪ 추천인 코드 없음: ${totalCount - withReferrerCount}명`)
        console.log()

        // 3. 페이지네이션 없이 조회 시 (기존 코드 방식)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('⚠️  3. 페이지네이션 없이 조회 (현재 코드 방식)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        const { data: noPaginationData } = await supabase
            .from('event_participants')
            .select('referrer_name, referrer_code')
            .not('referrer_code', 'is', null)

        console.log(`✅ 조회된 행: ${noPaginationData?.length || 0}개`)
        if (withReferrerCount > (noPaginationData?.length || 0)) {
            console.log(`❌ 문제 발견! 전체 ${withReferrerCount}명 중 ${noPaginationData?.length}명만 조회됨`)
            console.log(`   누락된 데이터: ${withReferrerCount - (noPaginationData?.length || 0)}명`)
        }
        console.log()

        // 4. Top 12 추천인 (페이지네이션 적용하여 전체 데이터 집계)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🏆 4. 실제 Top 12 추천인 (전체 데이터 집계)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // 모든 데이터 가져오기 (페이지네이션 적용)
        let allData = []
        let from = 0
        const pageSize = 1000

        console.log('데이터 로딩 중...')
        while (true) {
            const { data, error } = await supabase
                .from('event_participants')
                .select('referrer_code, referrer_name')
                .not('referrer_code', 'is', null)
                .range(from, from + pageSize - 1)

            if (error) throw error
            if (!data || data.length === 0) break

            allData = allData.concat(data)
            process.stdout.write(`\r로딩: ${allData.length}/${withReferrerCount}명...`)

            if (data.length < pageSize) break
            from += pageSize
        }
        console.log(`\n✅ 전체 데이터 로딩 완료: ${allData.length}명\n`)

        // 수동 집계
        const referrerMap = {}
        allData.forEach(p => {
            if (!referrerMap[p.referrer_code]) {
                referrerMap[p.referrer_code] = {
                    referrer_code: p.referrer_code,
                    referrer_name: p.referrer_name,
                    count: 0
                }
            }
            referrerMap[p.referrer_code].count++
        })

        const sorted = Object.values(referrerMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 12)

        console.log('순위 | 추천인명        | 추천인코드     | 카운트')
        console.log('-----|----------------|----------------|--------')
        sorted.forEach((r, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${(idx + 1).toString().padStart(2)}위`
            const name = (r.referrer_name || '-').padEnd(14)
            const code = (r.referrer_code || '-').padEnd(14)
            console.log(`${medal.padEnd(5)} | ${name} | ${code} | ${r.count}명`)
        })
        console.log()

        // 5. users 테이블과의 매칭 확인
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔗 5. users 테이블과의 매칭 상태')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const uniqueCodes = [...new Set(allData?.map(r => r.referrer_code))]
        console.log(`✅ 고유 추천인 코드: ${uniqueCodes.length}개`)

        const { data: matchedUsers } = await supabase
            .from('users')
            .select('referral_code')
            .in('referral_code', uniqueCodes)

        const matchedSet = new Set(matchedUsers?.map(u => u.referral_code))
        const unmatched = uniqueCodes.filter(code => !matchedSet.has(code))

        if (unmatched && unmatched.length > 0) {
            console.log(`⚠️  매칭되지 않는 추천인 코드: ${unmatched.length}개`)
            unmatched.slice(0, 10).forEach(code => {
                console.log(`   - ${code}`)
            })
            if (unmatched.length > 10) {
                console.log(`   ... 외 ${unmatched.length - 10}개`)
            }
        } else {
            console.log('✅ 모든 추천인 코드가 users 테이블과 매칭됨')
        }
        console.log()

        // 6. 이벤트별 참가자 수
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🎉 6. 이벤트별 참가자 분포')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        let allEventData = []
        from = 0

        while (true) {
            const { data, error } = await supabase
                .from('event_participants')
                .select('event_name')
                .range(from, from + pageSize - 1)

            if (error) {
                console.error('❌ 에러:', error.message)
                break
            }
            if (!data || data.length === 0) break

            allEventData = allEventData.concat(data)

            if (data.length < pageSize) break
            from += pageSize
        }

        const eventMap = {}
        allEventData.forEach(p => {
            const eventName = p.event_name || '미지정'
            eventMap[eventName] = (eventMap[eventName] || 0) + 1
        })

        const sortedEvents = Object.entries(eventMap)
            .sort((a, b) => b[1] - a[1])

        console.log('이벤트명                | 참가자 수')
        console.log('------------------------|----------')
        sortedEvents.forEach(([name, count]) => {
            console.log(`${name.padEnd(24)} | ${count}명`)
        })
        console.log()

        // 진단 결과 요약
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📋 진단 결과 요약')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const issues = []

        if (totalCount > 1000) {
            issues.push('❌ 핵심 문제: 참가자가 1000명 이상 (현재 ' + totalCount + '명)')
            issues.push('   → AdminEventDashboard.jsx의 referrerStatsQuery에 페이지네이션 미적용')
            issues.push('   → Line 371: const { data: referrerStats } = await referrerStatsQuery')
            issues.push('   → 이 쿼리는 최대 1000개만 반환하므로 데이터가 누락됨')
        }

        if (noPaginationData && withReferrerCount > noPaginationData.length) {
            issues.push(`❌ 실제 누락 확인: ${withReferrerCount - noPaginationData.length}명의 데이터가 조회되지 않음`)
            issues.push(`   → 전체 ${withReferrerCount}명 중 ${noPaginationData.length}명만 조회`)
        }

        if (unmatched && unmatched.length > 0) {
            issues.push(`⚠️  users 테이블에 없는 추천인 코드 ${unmatched.length}개 발견`)
            issues.push('   → 일부 직원이 탈퇴했거나 코드 불일치 가능성')
        }

        if (issues.length === 0) {
            console.log('✅ 특별한 문제가 발견되지 않았습니다.')
        } else {
            console.log('🔍 발견된 문제:\n')
            issues.forEach(issue => console.log(issue))

            console.log('\n💡 해결 방법:')
            console.log('1. AdminEventDashboard.jsx의 loadData() 함수 수정')
            console.log('2. referrerStatsQuery 부분에 페이지네이션 추가 (while 루프 사용)')
            console.log('3. branchStatsQuery는 이미 페이지네이션이 적용되어 있음 (Line 427-441)')
            console.log('4. 동일한 패턴으로 referrerStatsQuery도 수정 필요')
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
        console.log('✅ 진단 완료!')

    } catch (error) {
        console.error('\n❌ 진단 중 오류 발생:', error.message)
        console.error(error.stack)
    }
}

runDiagnosis()
