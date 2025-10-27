import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function SalesManagement({ user, onNavigate }) {
  const [formData, setFormData] = useState({
    customerName: '',
    age: '',
    address: '',
    phone: '',
    email: '',
    paymentMethod: '카드',
    quantity: '',
    depositor: '',
    depositAmount: '',
    orderDetails: '',
    needsShipping: false,
    privacyAgreed: false,
    marketingAgreed: false
  })
  const [loading, setLoading] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 금액 포맷팅 함수
  const formatCurrency = (value) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (!numbers) return ''
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    let finalValue = type === 'checkbox' ? checked : value
    
    // 전화번호 포맷팅 적용
    if (name === 'phone') {
      finalValue = formatPhoneNumber(value)
    }
    
    // 입금액 포맷팅 적용
    if (name === 'depositAmount') {
      finalValue = formatCurrency(value)
    }
    
    setFormData({
      ...formData,
      [name]: finalValue
    })
  }

  // 필수 입력 검증
  const validateForm = () => {
    // 판매수량은 항상 필수
    if (!formData.quantity || formData.quantity < 1) {
      alert('판매수량을 입력해주세요')
      return false
    }

    // 배송이 필요한 경우 필수 입력 검증
    if (formData.needsShipping) {
      if (!formData.customerName?.trim()) {
        alert('배송을 위해 구매자 이름을 입력해주세요')
        return false
      }
      if (!formData.address?.trim()) {
        alert('배송을 위해 주소를 입력해주세요')
        return false
      }
      if (!formData.phone?.trim()) {
        alert('배송을 위해 연락처를 입력해주세요')
        return false
      }
    }

    // 입금인 경우 입금자명과 입금기관명 필수
    if (formData.paymentMethod === '입금') {
      if (!formData.depositor?.trim()) {
        alert('입금자명을 입력해주세요')
        return false
      }
      if (!formData.depositAmount?.trim()) {
        alert('입금액을 입력해주세요')
        return false
      }
    }

    // 개인정보 동의 확인
    if (!formData.privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해주세요')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    // 검증
    if (!validateForm()) {
      return
    }

    setLoading(true)
    console.log('=== 저장 시작 ===')
    
    try {
      const insertData = {
        user_id: user?.id || null,
        branch_name: user?.branch || null,
        user_name: user?.name || null,
        user_branch: user?.branch || null,
        customer_name: formData.customerName?.trim() || null,
        phone: formData.phone?.trim() || null,
        customer_email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        payment_method: formData.paymentMethod || null,
        quantity: parseInt(formData.quantity),
        depositor: formData.depositor?.trim() || null,
        deposit_amount: formData.depositAmount?.replace(/,/g, '') || null,
        order_details: formData.orderDetails?.trim() || null,
        age: formData.age ? parseInt(formData.age) : null,
        needs_shipping: formData.needsShipping,
        privacy_agreed: formData.privacyAgreed,
        marketing_agreed: formData.marketingAgreed
      }
      
      console.log('Insert Data:', insertData)
      
      const { data, error } = await supabase
        .from('sales')
        .insert([insertData])
        .select()
      
      if (error) {
        throw error
      }
      
      console.log('저장 성공:', data)
      alert('저장되었습니다!')
      
      // 폼 초기화
      setFormData({
        customerName: '',
        age: '',
        address: '',
        phone: '',
        email: '',
        paymentMethod: '카드',
        quantity: '',
        depositor: '',
        depositAmount: '',
        orderDetails: '',
        needsShipping: false,
        privacyAgreed: false,
        marketingAgreed: false
      })
      
    } catch (err) {
      console.error('=== 저장 오류 상세 ===')
      console.error('Error:', err)
      alert('저장 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-3">
        <p className="text-center mb-2 font-bold" style={{ color: '#249689', fontSize: '15px' }}>
          LAS Book을 신청합니다.
        </p>
        
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              LAS Book Store
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 mb-2">
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              지점명
            </label>
            <input
              type="text"
              value={user?.branch || ''}
              readOnly
              className="w-full px-2 py-1.5 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '8px', color: '#000000', fontSize: '15px' }}
            />
          </div>
          <div>
            <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              이름
            </label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              className="w-full px-2 py-1.5 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          {/* 배송 여부 선택 */}
          <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="needsShipping"
                checked={formData.needsShipping}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="font-bold" style={{ color: '#249689', fontSize: '16px' }}>
                📦 배송이 필요합니다
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-1 ml-6">
              {formData.needsShipping 
                ? '✓ 배송 선택: 이름, 연락처, 주소가 필수입니다' 
                : '배송을 선택하지 않으면 구매자 정보는 선택사항입니다'}
            </p>
          </div>

          {/* 구매자 기본정보 */}
          <div className="border-2 border-gray-200 rounded-lg p-2.5 bg-gray-50">
            <h3 className="font-bold mb-2 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              구매자 기본정보
            </h3>
            <div className="space-y-1.5">
              <div>
                <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  이름 {formData.needsShipping && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="구매자 성함을 적어주세요"
                  className="w-full px-3 py-1.5 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  나이
                </label>
                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="구매자 나이를 적어주세요"
                  className="w-full px-3 py-1.5 border border-gray-300"
                  style={{ borderRadius: '8px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  주소 {formData.needsShipping && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="구매자 주소를 적어주세요"
                  className="w-full px-3 py-1.5 border border-gray-300"
                  style={{ borderRadius: '8px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  연락처 {formData.needsShipping && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="구매자 연락처를 적어주세요"
                  className="w-full px-3 py-1.5 border border-gray-300"
                  style={{ borderRadius: '8px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="구매자 이메일을 적어주세요"
                  className="w-full px-3 py-1.5 border border-gray-300"
                  style={{ borderRadius: '8px', fontSize: '15px' }}
                />
              </div>
            </div>
          </div>

          {/* 결제정보 */}
          <div className="border-2 border-gray-200 rounded-lg p-2.5 bg-gray-50">
            <h3 className="font-bold mb-2 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              결제정보
            </h3>
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="카드"
                    checked={formData.paymentMethod === '카드'}
                    onChange={handleChange}
                    className="w-3.5 h-3.5"
                  />
                  <span style={{ color: '#000000', fontSize: '15px', fontWeight: 'bold' }}>카드</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="입금"
                    checked={formData.paymentMethod === '입금'}
                    onChange={handleChange}
                    className="w-3.5 h-3.5"
                  />
                  <span style={{ color: '#000000', fontSize: '15px', fontWeight: 'bold' }}>입금</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    판매수량 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="수량"
                    min="1"
                    className="w-full px-3 py-1.5 border border-gray-300"
                    style={{ borderRadius: '8px', fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    입금자명 {formData.paymentMethod === '입금' && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    name="depositor"
                    value={formData.depositor}
                    onChange={handleChange}
                    placeholder="입금자명"
                    disabled={formData.paymentMethod === '카드'}
                    className="w-full px-2 py-1.5 border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                    style={{ borderRadius: '8px', fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    입금액 {formData.paymentMethod === '입금' && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    name="depositAmount"
                    value={formData.depositAmount}
                    onChange={handleChange}
                    placeholder="입금액"
                    disabled={formData.paymentMethod === '카드'}
                    className="w-full px-2 py-1.5 border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                    style={{ borderRadius: '8px', fontSize: '15px', textAlign: 'right' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 주문정보 */}
          <div className="border-2 border-gray-200 rounded-lg p-2.5 bg-gray-50">
            <h3 className="font-bold mb-1.5 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              주문정보
            </h3>
            <textarea
              name="orderDetails"
              value={formData.orderDetails}
              onChange={handleChange}
              placeholder="주문상품명과 수량을 적어주세요"
              rows={3}
              className="w-full px-2 py-1.5 border border-gray-300"
              style={{ borderRadius: '8px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 개인정보 수집 및 이용 동의 */}
          <div className="border-2 border-gray-200 rounded-lg p-2.5 bg-gray-50">
            <h3 className="font-bold mb-1.5 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              개인정보 수집 및 이용 동의
            </h3>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="privacyAgreed"
                  checked={formData.privacyAgreed}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5"
                />
                <span style={{ color: '#000000', fontSize: '14px' }}>
                  개인정보 수집 및 이용에 동의합니다 <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-sm underline whitespace-nowrap"
                style={{ color: '#249689' }}
              >
                📄 내용보기
              </button>
            </div>

            <div className="pt-2 border-t border-gray-300">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="marketingAgreed"
                  checked={formData.marketingAgreed}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5"
                />
                <span style={{ fontSize: '14px', flex: 1 }}>
                  <span className="font-bold">(선택)</span> 이벤트 및 마케팅 정보 수신에 동의합니다
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              {loading ? '저장 중...' : '확인'}
            </button>
            <button
              onClick={() => onNavigate?.('Dashboard')}
              disabled={loading}
              className="flex-1 py-2 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              나가기
            </button>
          </div>
        </div>
      </div>

      {/* 개인정보 처리방침 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="font-bold mb-4" style={{ color: '#249689', fontSize: '24px' }}>
              개인정보 수집 및 이용 동의서
            </h2>
            
            <div className="space-y-4 text-sm" style={{ color: '#333' }}>
              <div>
                <h3 className="font-bold mb-2" style={{ fontSize: '16px' }}>1. 개인정보의 수집 및 이용 목적</h3>
                <p className="ml-4">- 상품 주문 및 배송</p>
                <p className="ml-4">- 결제 처리 및 영수증 발행</p>
                <p className="ml-4">- 고객 문의 응대 및 불만 처리</p>
              </div>

              <div>
                <h3 className="font-bold mb-2" style={{ fontSize: '16px' }}>2. 수집하는 개인정보의 항목</h3>
                <p className="ml-4">- 필수항목: 이름, 연락처, 주소(배송 시)</p>
                <p className="ml-4">- 선택항목: 이메일, 나이</p>
              </div>

              <div>
                <h3 className="font-bold mb-2" style={{ fontSize: '16px' }}>3. 개인정보의 보유 및 이용 기간</h3>
                <p className="ml-4">- 수집된 개인정보는 목적 달성 후 지체 없이 파기합니다.</p>
                <p className="ml-4">- 단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</p>
              </div>

              <div>
                <h3 className="font-bold mb-2" style={{ fontSize: '16px' }}>4. 동의를 거부할 권리 및 거부 시 불이익</h3>
                <p className="ml-4">- 귀하는 개인정보 수집 및 이용을 거부할 권리가 있습니다.</p>
                <p className="ml-4">- 단, 필수항목 미동의 시 상품 구매 및 배송이 제한될 수 있습니다.</p>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full mt-6 py-3 text-white font-bold rounded-lg"
              style={{ backgroundColor: '#249689' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}