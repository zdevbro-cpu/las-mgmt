import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'

/**
 * 직원 목록 엑셀 다운로드
 * @param {Array} selectedUsers - 선택된 사용자 ID 배열
 * @param {Array} allUsers - 전체 사용자 데이터
 * @param {string} startDate - 근무 시작일 (YYYY-MM-DD)
 * @param {string} endDate - 근무 종료일 (YYYY-MM-DD)
 */
export const exportUsersToExcel = async (selectedUsers, allUsers, startDate, endDate) => {
  // 1. 유효성 검사
  if (!selectedUsers || selectedUsers.length === 0) {
    alert('다운로드할 직원을 선택해주세요.')
    return false
  }

  if (!startDate || !endDate) {
    alert('근무기간(시작일/종료일)을 선택해주세요.')
    return false
  }

  try {
    // 2. 선택된 사용자 데이터 필터링
    const selectedData = allUsers.filter(u => selectedUsers.includes(u.id))
    
    // 3. 각 사용자별로 근무시간 조회 및 엑셀 데이터 생성
    const excelData = await Promise.all(selectedData.map(async (u) => {
      // work_diaries에서 해당 기간의 근무시간 합계 조회
      const { data: workDiaries, error } = await supabase
        .from('work_diaries')
        .select('work_hours')
        .eq('user_id', u.id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)

      if (error) {
        console.error(`근무일지 조회 오류 (user_id: ${u.id}):`, error)
      }

      // 총근무시간 계산
      const totalWorkHours = workDiaries?.reduce((sum, diary) => {
        return sum + (parseFloat(diary.work_hours) || 0)
      }, 0) || 0

      // 주민번호 마스킹 (123456-*******)
      const maskedSSN = u.ssn ? u.ssn.substring(0, 6) + '-*******' : '-'
      
      // 계좌번호 마스킹 (끝 4자리 ****)
      const maskedAccount = u.account_number 
        ? u.account_number.substring(0, u.account_number.length - 4) + '****'
        : '-'

      return {
        '지점명': u.branch || '-',
        '이름': u.name || '-',
        '전화번호': u.phone || '-',
        '구분': u.user_type || '-',
        '근무시작일': new Date(startDate).toLocaleDateString('ko-KR'),
        '근무종료일': new Date(endDate).toLocaleDateString('ko-KR'),
        '총근무시간': `${totalWorkHours.toFixed(1)}시간`,
        '주민번호': maskedSSN,
        '예금주': u.account_holder || '-',
        '기관명': u.bank_name || '-',
        '계좌번호': maskedAccount
      }
    }))

    // 4. 엑셀 파일 생성
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '직원목록')
    
    // 5. 파일 다운로드
    const fileName = `직원목록_${startDate}_${endDate}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    return true
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error)
    alert('엑셀 파일 생성 중 오류가 발생했습니다.')
    return false
  }
}