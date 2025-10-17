import { useState } from 'react'
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
    depositBank: '',
    orderDetails: '',
    needsShipping: false
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
      if (!formData.depositBank?.trim()) {
        alert('입금기관명을 입력해주세요')
        return false
      }
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
        customer_phone: formData.phone?.trim() || null,
        customer_email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        payment_method: formData.paymentMethod || null,
        quantity: parseInt(formData.quantity),
        depositor: formData.depositor?.trim() || null,
        deposit_bank: formData.depositBank?.trim() || null,
        order_details: formData.orderDetails?.trim() || null,
        age: formData.age ? parseInt(formData.age) : null,
        needs_shipping: formData.needsShipping
      }
      
      console.log('Insert Data:', insertData)
      
      const { data, error } = await supabase
        .from('sales')
        .insert([insertData])
        .select()
      
      if (error) {
        console.error('Supabase Error:', error)
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
        depositBank: '',
        orderDetails: '',
        needsShipping: false
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
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <p className="text-center mb-4 font-bold" style={{ color: '#249689', fontSize: '15px' }}>
          LAS Book을 신청합니다.
        </p>
        
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="flex items-center gap-1.5 mb-2">
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

        <div className="grid grid-cols-2 gap-1.5 mb-4">
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              지점명
            </label>
            <input
              type="text"
              value={user?.branch || ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              이름
            </label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {/* 배송 여부 선택 */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="needsShipping"
                checked={formData.needsShipping}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span className="font-bold" style={{ color: '#249689', fontSize: '16px' }}>
                📦 배송이 필요합니다
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-2 ml-7">
              {formData.needsShipping 
                ? '✓ 배송 선택: 이름, 연락처, 주소가 필수입니다' 
                : '배송을 선택하지 않으면 구매자 정보는 선택사항입니다'}
            </p>
          </div>

          {/* 구매자 기본정보 */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold mb-4 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              구매자 기본정보
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  이름 {formData.needsShipping && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="구매자 성함을 적어주세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  나이
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="구매자 나이를 적어주세요"
                  min="1"
                  max="150"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  주소 {formData.needsShipping && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="배송지 주소를 정확하게 적어주세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  연락처 {formData.needsShipping && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="구매자 연락처를 적어주세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="구매자 이메일을 적어주세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
          </div>

          {/* 결제정보 */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold mb-4 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              결제정보
            </h3>
            <div className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="카드"
                    checked={formData.paymentMethod === '카드'}
                    onChange={handleChange}
                    className="w-4 h-4"
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
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#000000', fontSize: '15px', fontWeight: 'bold' }}>입금</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    판매수량 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="수량"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    입금자명 {formData.paymentMethod === '입금' && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    name="depositor"
                    value={formData.depositor}
                    onChange={handleChange}
                    placeholder="입금자명"
                    disabled={formData.paymentMethod === '카드'}
                    className="w-full px-4 py-2 border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    입금기관명 {formData.paymentMethod === '입금' && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    name="depositBank"
                    value={formData.depositBank}
                    onChange={handleChange}
                    placeholder="입금기관명"
                    disabled={formData.paymentMethod === '카드'}
                    className="w-full px-4 py-2 border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 주문정보 */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold mb-4 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              주문정보
            </h3>
            <textarea
              name="orderDetails"
              value={formData.orderDetails}
              onChange={handleChange}
              placeholder="주문상품명과 수량을 적어주세요"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => onNavigate?.('dashboard')}
              disabled={loading}
              className="flex-1 py-2.5 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              나가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}