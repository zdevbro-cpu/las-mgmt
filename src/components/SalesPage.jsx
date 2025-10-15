import { useState } from 'react'
import { localDB } from '../lib/supabase'

export default function SalesManagement({ user, onNavigate }) {
  const [formData, setFormData] = useState({
    customerName: '',
    birthDate: '',
    address: '',
    phone: '',
    email: '',
    bookTitle: '',
    paymentMethod: '카드',
    quantity: '',
    depositor: '',
    depositDeadline: '',
    orderDetails: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const saleEntry = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userBranch: user.branch,
      ...formData,
      createdAt: new Date().toISOString()
    }

    const sales = localDB.getSales()
    sales.push(saleEntry)
    localDB.setSales(sales)

    alert('판매 정보가 저장되었습니다!')
    onNavigate('dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-12 h-12"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
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
          {/* 구매자 기본정보 */}
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4" style={{ color: '#000000', fontSize: '15px' }}>
              구매자 기본정보
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
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
                <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
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
                <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
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
                <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
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
                <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
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
              <div>
                <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
                  저녁명
                </label>
                <input
                  type="text"
                  name="bookTitle"
                  value={formData.bookTitle}
                  onChange={handleChange}
                  placeholder="구매자 저녁명을 적어주세요"
                  required
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
          </div>

          {/* 결제정보 */}
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4" style={{ color: '#000000', fontSize: '15px' }}>
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
                  <span style={{ color: '#000000', fontSize: '15px' }}>카드</span>
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
                  <span style={{ color: '#000000', fontSize: '15px' }}>입금</span>
                </label>
              </div>

              {/* 판매수량 */}
              <div>
                <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
                  판매수량
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="수량만 입력"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              {/* 입금자 (입금 선택시만) */}
              {formData.paymentMethod === '입금' && (
                <>
                  <div>
                    <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
                      입금자명
                    </label>
                    <input
                      type="text"
                      name="depositor"
                      value={formData.depositor}
                      onChange={handleChange}
                      placeholder="입금자명"
                      required
                      className="w-full px-4 py-2 border border-gray-300"
                      style={{ borderRadius: '10px', fontSize: '15px' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: '#000000', fontSize: '15px' }}>
                      입금기한
                    </label>
                    <input
                      type="date"
                      name="depositDeadline"
                      value={formData.depositDeadline}
                      onChange={handleChange}
                      placeholder="입금기한"
                      required
                      className="w-full px-4 py-2 border border-gray-300"
                      style={{ borderRadius: '10px', fontSize: '15px' }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 주문정보 */}
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4" style={{ color: '#000000', fontSize: '15px' }}>
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
              판매관리
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

        {/* 하단 링크 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="font-bold underline hover:opacity-80"
            style={{ color: '#249689', fontSize: '15px' }}
          >
            매장관리 시스템으로 가기
          </button>
        </div>
      </div>
    </div>
  )
}