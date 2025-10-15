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
      const saleEntry = {
        id: Date.now().toString(),
        user_id: user.id,
        user_name: user.name,
        user_branch: user.branch,
        customer_name: formData.customerName,
        birth_date: formData.birthDate || null,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        payment_method: formData.paymentMethod,
        quantity: parseInt(formData.quantity) || null,
        depositor: formData.depositor || null,
        deposit_bank: formData.depositBank || null,
        order_details: formData.orderDetails || null,
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
      onNavigate('dashboard')
    } catch (err) {
      console.error('판매 정보 제출 오류:', err)
      alert('판매 정보 제출 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* 헤더 - 중앙정렬 */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex items-center gap-4 mb-2">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-16 h-16"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '48px' }}>
              LAS Book Store
            </h1>
          </div>
        </div>

        <p className="text-center mb-6" style={{ color: '#249689', fontSize: '15px' }}>
          LAS Book을 신청합니다.
        </p>

        {/* 사용자 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 구매자 기본정보 - 그룹화 */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold mb-4 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              구매자 기본정보
            </h3>
            <div className="space-y-4">
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
                  생년월일
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  placeholder="구매자 생년월일을 적어주세요"
                  required
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
            <div className="space-y-4">
              {/* 결제방법 */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
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
                <label className="flex items-center gap-2 cursor-pointer">
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
              <div className="grid grid-cols-3 gap-4">
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
              rows={4}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>

          {/* 버튼들 */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="flex-1 py-3 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}