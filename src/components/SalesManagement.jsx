import { useState } from 'react'

export default function SalesManagement() {
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
    orderDetails: ''
  })
  const [loading, setLoading] = useState(false)

  // 데모 사용자 정보
  const user = {
    branch: '강남지점',
    name: '홍길동'
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    
    setTimeout(() => {
      const saleEntry = {
        id: Date.now().toString(),
        user_id: 'demo-user',
        user_name: user.name,
        user_branch: user.branch,
        customer_name: formData.customerName,
        age: parseInt(formData.age) || null,
        address: formData.address,
        customer_phone: formData.phone,
        customer_email: formData.email,
        payment_method: formData.paymentMethod,
        quantity: parseInt(formData.quantity) || null,
        depositor: formData.depositor || null,
        deposit_bank: formData.depositBank || null,
        order_info: formData.orderDetails || null,
        branch_name: user.branch,
        created_at: new Date().toISOString()
      }

      console.log('판매 정보 저장:', saleEntry)
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
      
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <p className="text-center mb-4 font-bold" style={{ color: '#249689', fontSize: '15px' }}>
          LAS Book을 신청합니다.
        </p>
        
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-10 h-10 bg-teal-600 rounded flex items-center justify-center text-white font-bold text-xl">
              LAS
            </div>
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
              value={user.branch}
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
              value={user.name}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
              style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold mb-4 text-lg" style={{ color: '#249689', fontSize: '18px' }}>
              구매자 기본정보
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  이름 <span style={{ color: '#ef4444' }}>*</span>
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
                  주소 <span style={{ color: '#ef4444' }}>*</span>
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
                  연락처 <span style={{ color: '#ef4444' }}>*</span>
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
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
          </div>

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
                    required
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
                    required={formData.paymentMethod === '입금'}
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
                    required={formData.paymentMethod === '입금'}
                    className="w-full px-4 py-2 border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                </div>
              </div>
            </div>
          </div>

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
              onClick={() => alert('대시보드로 이동')}
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