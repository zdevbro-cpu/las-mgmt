import { createClient } from '@supabase/supabase-js'

// Supabase 연결
const supabaseUrl = 'https://sgxnxbhbyvrmgrzhosyh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG54YmhieXZybWdyemhvc3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDAzMzMsImV4cCI6MjA3MzQ3NjMzM30.1qS_3Qr-zv7woSyPbkdiLkhuXp2pVHJHGiF3iKWEBkc'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 배미운 추천인 확인 중...\n')

async function checkBaemiun() {
    try {
        // 1. users 테이블에서 배미운 검색
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 1. users 테이블에서 "배미운" 검색')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, referral_code, branch, user_type, email')
            .ilike('name', '%배미운%')

        if (usersError) {
            console.error('❌ 에러:', usersError.message)
        } else if (!users || users.length === 0) {
            console.log('⚠️  "배미운"이라는 이름을 가진 사용자를 찾을 수 없습니다.')
            console.log('   → 이름 철자를 확인하거나 유사한 이름을 검색해보세요.\n')
        } else {
            console.log(`✅ 찾은 사용자: ${users.length}명\n`)
            users.forEach(user => {
                console.log(`이름: ${user.name}`)
                console.log(`추천인코드: ${user.referral_code}`)
                console.log(`지점: ${user.branch}`)
                console.log(`사용자타입: ${user.user_type}`)
                console.log(`이메일: ${user.email}`)
                console.log('---')
            })
        }
        console.log()

        // 2. "배미운"의 추천 참가자 수 확인
        if (users && users.length > 0) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('📊 2. 배미운의 추천 참가자 수')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

            for (const user of users) {
                // 페이지네이션으로 모든 참가자 조회
                let allParticipants = []
                let from = 0
                const pageSize = 1000

                while (true) {
                    const { data, error } = await supabase
                        .from('event_participants')
                        .select('id, parent_name, phone, created_at')
                        .eq('referrer_code', user.referral_code)
                        .range(from, from + pageSize - 1)

                    if (error) {
                        console.error('❌ 에러:', error.message)
                        break
                    }
                    if (!data || data.length === 0) break

                    allParticipants = allParticipants.concat(data)

                    if (data.length < pageSize) break
                    from += pageSize
                }

                console.log(`\n${user.name} (${user.referral_code}):`)
                console.log(`✅ 총 추천 수: ${allParticipants.length}명`)

                if (allParticipants.length > 0) {
                    console.log('\n최근 추천 참가자 5명:')
                    allParticipants.slice(0, 5).forEach(p => {
                        const date = new Date(p.created_at).toLocaleString('ko-KR')
                        console.log(`  - ${p.parent_name} (${p.phone}) - ${date}`)
                    })
                } else {
                    console.log('⚠️  아직 추천한 참가자가 없습니다.')
                }
            }
            console.log()
        }

        // 3. event_participants에서 referrer_name으로 검색
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 3. event_participants에서 referrer_name으로 검색')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        let allReferrerData = []
        let from = 0
        const pageSize = 1000

        while (true) {
            const { data, error } = await supabase
                .from('event_participants')
                .select('referrer_name, referrer_code')
                .ilike('referrer_name', '%배미운%')
                .range(from, from + pageSize - 1)

            if (error) {
                console.error('❌ 에러:', error.message)
                break
            }
            if (!data || data.length === 0) break

            allReferrerData = allReferrerData.concat(data)

            if (data.length < pageSize) break
            from += pageSize
        }

        if (allReferrerData.length > 0) {
            const referrerMap = {}
            allReferrerData.forEach(p => {
                const key = `${p.referrer_name}_${p.referrer_code}`
                if (!referrerMap[key]) {
                    referrerMap[key] = {
                        name: p.referrer_name,
                        code: p.referrer_code,
                        count: 0
                    }
                }
                referrerMap[key].count++
            })

            console.log('event_participants 테이블에서 찾은 결과:')
            Object.values(referrerMap).forEach(r => {
                console.log(`  ${r.name} (${r.code}): ${r.count}명`)
            })
        } else {
            console.log('⚠️  event_participants에 "배미운"이라는 referrer_name이 없습니다.')
        }
        console.log()

        // 4. 유사한 이름 검색
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 4. 유사한 이름 검색 (오타 가능성 확인)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const { data: similarUsers, error: similarError } = await supabase
            .from('users')
            .select('name, referral_code, branch')
            .or('name.ilike.%배%,name.ilike.%미%,name.ilike.%운%')
            .order('name')

        if (similarError) {
            console.error('❌ 에러:', similarError.message)
        } else if (similarUsers && similarUsers.length > 0) {
            console.log(`✅ 유사한 이름 ${similarUsers.length}명 발견:\n`)
            console.log('이름          | 추천인코드     | 지점')
            console.log('--------------|----------------|------------------')
            similarUsers.slice(0, 20).forEach(user => {
                const name = (user.name || '').padEnd(12)
                const code = (user.referral_code || '').padEnd(14)
                const branch = user.branch || ''
                console.log(`${name} | ${code} | ${branch}`)
            })

            if (similarUsers.length > 20) {
                console.log(`... 외 ${similarUsers.length - 20}명`)
            }
        }
        console.log()

        // 5. Top 12 확인
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🏆 5. 현재 Top 12 추천인 확인')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // 모든 추천 데이터 가져오기
        let allData = []
        from = 0

        while (true) {
            const { data, error } = await supabase
                .from('event_participants')
                .select('referrer_code, referrer_name')
                .not('referrer_code', 'is', null)
                .range(from, from + pageSize - 1)

            if (error) {
                console.error('❌ 에러:', error.message)
                break
            }
            if (!data || data.length === 0) break

            allData = allData.concat(data)

            if (data.length < pageSize) break
            from += pageSize
        }

        // 집계
        const referrerMap = {}
        allData.forEach(p => {
            if (!referrerMap[p.referrer_code]) {
                referrerMap[p.referrer_code] = {
                    code: p.referrer_code,
                    name: p.referrer_name,
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
            const name = (r.name || '-').padEnd(14)
            const code = (r.code || '-').padEnd(14)
            console.log(`${medal.padEnd(5)} | ${name} | ${code} | ${r.count}명`)
        })

        // 배미운이 Top 12에 있는지 확인
        if (users && users.length > 0) {
            console.log('\n배미운의 순위:')
            users.forEach(user => {
                const rank = Object.values(referrerMap)
                    .sort((a, b) => b.count - a.count)
                    .findIndex(r => r.code === user.referral_code) + 1

                const count = referrerMap[user.referral_code]?.count || 0

                if (rank > 0) {
                    console.log(`  ${user.name} (${user.referral_code}): ${rank}위 (${count}명)`)
                    if (rank > 12) {
                        console.log(`  → Top 12에 포함되지 않습니다 (13위 이하)`)
                    }
                } else {
                    console.log(`  ${user.name} (${user.referral_code}): 순위 없음 (추천 0명)`)
                }
            })
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
        console.log('✅ 확인 완료!')

    } catch (error) {
        console.error('\n❌ 확인 중 오류 발생:', error.message)
        console.error(error.stack)
    }
}

checkBaemiun()
