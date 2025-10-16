import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SalesManagement({ user, onNavigate }) {
  const [formData, setFormData] = useState({
    customerName: '',
    birthDate: '',
    address: '',
    phone: '',
    email: '',
    paymentMethod: '카드',
    quantity: '',
    depositor: '',
    depositBank: '',
    orderDetails: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // ✅ 필드명을 PurchaseHistory와 일치시킴
      const saleEntry = {
        id: Date.now().toString(),
        user_id: user.id,
        user_name: user.name,
        user_branch: user.branch,
        customer_name: formData.customerName,
        age: parseInt(formData.age) || null,
        address: formData.address,
        customer_phone: formData.phone,        // ← phone → customer_phone
        customer_email: formData.email,        // ← email → customer_email
        payment_method: formData.paymentMethod,
        // payment_amount: null,  // 추후 추가 가능
        quantity: parseInt(formData.quantity) || null,
        depositor: formData.depositor || null,
        deposit_bank: formData.depositBank || null,
        order_info: formData.orderDetails || null,  // ← order_details → order_info
        branch_name: user.branch,  // ← 추가
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('sales')
        .insert([saleEntry])
        .select()

      if (error) {
        console.error('판매 정보 저장 오류:', error)
        alert('판매 정보 저장 중 오류가 발생했습니다: ' + error.message)
        setLoading(false)
        return
      }

      console.log('판매 정보 저장 성공:', data)
      alert('판매 정보가 저장되었습니다!')
      
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
        orderDetails: ''
      })
      
      // 대시보드로 이동하거나 현재 페이지 유지
      // onNavigate('dashboard')  // 주석 처리: 계속 입력 가능하도록
      
    } catch (err) {
      console.error('판매 정보 제출 오류:', err)
      alert('판매 정보 제출 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <p className="text-center mb-4 font-bold text-center mb-2" style={{ color: '#249689', fontSize: '15px' }}>
          LAS Book을 신청합니다.
      </p>
        {/* 헤더 - 중앙정렬 */}
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

        {/* 사용자 정보 */}
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

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 구매자 기본정보 - 그룹화 */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold mb-4 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              구매자 기본정보
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  이름
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="구매자 성함을 적어주세요"
                  required
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
                  주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="구매자 주소를 적어주세요"
                  required
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  연락처
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="구매자 연락처를 적어주세요"
                  required
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
                  required
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
          </div>

          {/* 결제정보 - 그룹화 */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold mb-4 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              결제정보
            </h3>
            <div className="space-y-3">
              {/* 결제방법 */}
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

              {/* 판매수량/입금자명/입금기관명 - 1 row */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* 판매수량 */}
                <div>
                  <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    판매수량
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="수량"
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>

                {/* 입금자명 (입금 선택시만) */}
                <div>
                  <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    입금자명
                  </label>
                  <input
                    type="text"
                    name="depositor"
                    value={formData.depositor}
                    onChange={handleChange}
                    placeholder="입금자명"
                    disabled={formData.paymentMethod === '카드'}
                    required={formData.paymentMethod === '입금'}
                    className="w-full px-4 py-2 border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>

                {/* 입금기관명 (입금 선택시만) */}
                <div>
                  <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    입금기관명
                  </label>
                  <input
                    type="text"
                    name="depositBank"
                    value={formData.depositBank}
                    onChange={handleChange}
                    placeholder="입금기관명"
                    disabled={formData.paymentMethod === '카드'}
                    required={formData.paymentMethod === '입금'}
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

          {/* 버튼들 */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              {loading ? '저장 중...' : '확인'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              disabled={loading}
              className="flex-1 py-2.5 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              나가기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}