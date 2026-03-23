import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { Plus, Trash2, CheckCircle2, AlertCircle, ShoppingCart, CreditCard, Banknote, FileUp, X, Check } from 'lucide-react'

export default function SalesManagement({ user, onNavigate }) {
  const [formData, setFormData] = useState({
    customerName: '',
    age: '',
    address: '',
    phone: '',
    paymentMethod: '카드',
    needsShipping: false,
    privacyAgreed: false,
    marketingAgreed: false
  })

  // 신규 상태 추가
  const [orderItems, setOrderItems] = useState([
    { id: Date.now(), language: '한글', series: 'K2', quantity: 1, price: 0 }
  ])
  const [cardInfo, setCardInfo] = useState({
    number: ['', '', '', ''],
    cvc: '',
    issuer: '',
    approvalNo: ''
  })
  const [cashInfo, setCashInfo] = useState({
    bank: '',
    depositor: '',
    amount: ''
  })

  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showCardValidationModal, setShowCardValidationModal] = useState(false)
  const [cardValidationResult, setCardValidationResult] = useState({ success: false, message: '' })
  const [excelPreview, setExcelPreview] = useState(null)
  const [showExcelPreview, setShowExcelPreview] = useState(false)

  // 가격 정보 로드
  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)

      if (error) throw error
      setPrices(data || [])

      // 초기 아이템 가격 설정
      if (data && data.length > 0) {
        setOrderItems(prev => prev.map(item => {
          const priceObj = data.find(p => p.series === item.series && p.language === item.language)
          return { ...item, price: priceObj ? priceObj.price : 0 }
        }))
      }
    } catch (err) {
      console.error('가격 정보 로드 오류:', err)
    }
  }

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 금액 포맷팅 함수
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0원'
    const numbers = value.toString().replace(/[^\d]/g, '')
    if (!numbers) return '0원'
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = type === 'checkbox' ? checked : value

    if (name === 'phone') {
      finalValue = formatPhoneNumber(value)
    }

    setFormData({
      ...formData,
      [name]: finalValue
    })
  }

  // 상품 항목 관리
  const addOrderItem = () => {
    const newId = Date.now()
    setOrderItems([...orderItems, {
      id: newId,
      language: '한글',
      series: 'K2',
      quantity: 1,
      price: getPrice('K2', '한글')
    }])
  }

  const removeOrderItem = (id) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id))
    }
  }

  const updateOrderItem = (id, field, value) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value }
        if (field === 'series' || field === 'language') {
          newItem.price = getPrice(newItem.series, newItem.language)
        }
        return newItem
      }
      return item
    }))
  }

  const getPrice = (series, language) => {
    const priceObj = prices.find(p => p.series === series && p.language === language)
    return priceObj ? priceObj.price : 0
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  // 카드 정보 관리
  const handleCardNumberChange = (index, value) => {
    const numbers = value.replace(/[^\d]/g, '').slice(0, 4)
    const newNumbers = [...cardInfo.number]
    newNumbers[index] = numbers
    setCardInfo({ ...cardInfo, number: newNumbers })

    // 자동 다음 칸 이동
    if (numbers.length === 4 && index < 3) {
      const nextInput = document.getElementById(`card-number-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const validateCardNumber = () => {
    const fullNumber = cardInfo.number.join('')
    if (fullNumber.length !== 16) {
      setCardValidationResult({ success: false, message: '카드번호 16자리를 모두 입력해주세요.' })
    } else {
      setCardValidationResult({ success: true, message: '유효한 카드 번호 형식입니다.' })
    }
    setShowCardValidationModal(true)
  }

  // 엑셀 업로드
  const handleExcelUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws)

      setExcelPreview(data)
      setShowExcelPreview(true)
    }
    reader.readAsBinaryString(file)
  }

  const applyExcelData = () => {
    if (!excelPreview) return

    const newItems = excelPreview.map((row, index) => {
      const language = row['언어'] || row['language'] || '한글'
      const series = row['시리즈'] || row['series'] || 'K2'
      const quantity = parseInt(row['수량'] || row['quantity'] || 1)

      return {
        id: Date.now() + index,
        language,
        series,
        quantity,
        price: getPrice(series, language)
      }
    })

    setOrderItems(newItems)
    setShowExcelPreview(false)
    setExcelPreview(null)
  }

  // 필수 입력 검증
  const validateForm = () => {
    if (orderItems.length === 0) {
      alert('상품을 하나 이상 선택해주세요.')
      return false
    }

    if (formData.needsShipping) {
      if (!formData.customerName?.trim()) { alert('배송을 위해 구매자 이름을 입력해주세요'); return false }
      if (!formData.address?.trim()) { alert('배송을 위해 주소를 입력해주세요'); return false }
      if (!formData.phone?.trim()) { alert('배송을 위해 연락처를 입력해주세요'); return false }
    }

    if (formData.paymentMethod === '카드') {
      const fullNumber = cardInfo.number.join('')
      if (fullNumber.length !== 16) { alert('카드번호 16자리를 입력해주세요'); return false }
      if (!cardInfo.cvc) { alert('CVC 번호를 입력해주세요'); return false }
      if (!cardInfo.issuer) { alert('카드사를 입력해주세요'); return false }
      if (!cardInfo.approvalNo) { alert('승인번호를 입력해주세요'); return false }
    } else {
      if (!cashInfo.bank) { alert('입금기관명을 입력해주세요'); return false }
      if (!cashInfo.depositor) { alert('입금자명을 입력해주세요'); return false }
      if (!cashInfo.amount) { alert('입금액을 입력해주세요'); return false }
    }

    if (!formData.privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해주세요')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const totalAmount = calculateTotal()
      const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const orderSummary = orderItems.map(item => `${item.language} ${item.series} ${item.quantity}개`).join(', ')

      const insertData = {
        user_id: user?.id || null,
        branch_name: user?.branch || null,
        user_name: user?.name || null,
        user_branch: user?.branch || null,
        customer_name: formData.customerName?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        payment_method: formData.paymentMethod || null,
        quantity: totalQuantity,
        deposit_amount: totalAmount,
        order_details: orderSummary,
        age: formData.age ? parseInt(formData.age) : null,
        needs_shipping: formData.needsShipping,
        privacy_agreed: formData.privacyAgreed,
        marketing_agreed: formData.marketingAgreed,
        payment_info: JSON.stringify({
          card: formData.paymentMethod === '카드' ? cardInfo : null,
          cash: formData.paymentMethod === '입금' ? cashInfo : null,
          items: orderItems
        })
      }

      const { data, error } = await supabase
        .from('sales')
        .insert([insertData])
        .select()

      if (error) throw error

      alert('저장되었습니다!')
      onNavigate?.('Dashboard')

    } catch (err) {
      console.error('저장 오류:', err)
      alert('저장 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg relative overflow-hidden" style={{ padding: '12px', paddingBottom: '24px' }}>

        {/* 헤더 섹션 - 컴팩트하게 축소 */}
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <img
              src="/images/logo.png"
              alt="LAS Logo"
              className="w-8 h-8 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '24px' }}>
              LAS Book Store
            </h1>
          </div>
          <p className="text-gray-500 text-xs font-medium tracking-wide">판매관리 시스템</p>
        </div>

        {/* 지점 정보 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 mb-1">지점명</label>
            <div className="font-bold text-gray-800">{user?.branch || '-'}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 mb-1">이름</label>
            <div className="font-bold text-gray-800">{user?.name || '-'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="border border-teal-200 rounded-xl p-2 bg-teal-50/20 transition-all">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="needsShipping"
                checked={formData.needsShipping}
                onChange={handleChange}
                className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
              />
              <span className="font-bold text-teal-800" style={{ fontSize: '15px' }}>
                📦 배송이 필요합니다
              </span>
            </label>
            <p className="text-[11px] text-teal-600 mt-1 ml-7 font-medium leading-tight">
              {formData.needsShipping
                ? '✓ 배송 선택: 이름, 연락처, 주소가 필수입니다'
                : '배송을 선택하지 않으면 구매자 정보는 선택사항입니다'}
            </p>
          </div>

          {/* 구매자 기본정보 */}
          <div className="border border-gray-200 rounded-xl p-2.5 shadow-sm">
            <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#249689', fontSize: '16px' }}>
              <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
              구매자 기본정보
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block mb-0.5 text-xs font-bold text-gray-700">
                  이름 {formData.needsShipping && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="성함"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-teal-500 font-medium"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-xs font-bold text-gray-700">생년월일</label>
                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="19900101"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-teal-500 font-medium text-center"
                />
              </div>
              <div>
                <label className="block mb-0.5 text-xs font-bold text-gray-700">
                  연락처 {formData.needsShipping && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-teal-500 font-medium text-center"
                />
              </div>
              <div className="col-span-3">
                <label className="block mb-0.5 text-xs font-bold text-gray-700">
                  주소 {formData.needsShipping && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="구매자 주소 입력"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* 구매상품 섹션 */}
          <div className="border border-gray-200 rounded-xl p-2.5 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold flex items-center gap-2" style={{ color: '#249689', fontSize: '16px' }}>
                <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                구매상품
              </h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors border border-blue-100">
                  <FileUp size={14} />
                  엑셀업로드
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
                </label>
                <button
                  onClick={addOrderItem}
                  className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-600 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors border border-teal-100"
                >
                  <Plus size={14} />
                  추가
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={item.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 relative group">
                  <button
                    onClick={() => removeOrderItem(item.id)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-20"
                    title="항목 삭제"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                  <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto">
                    <div className="flex-1 min-w-[60px]">
                      <label className="block mb-0.5 text-[12px] font-bold text-gray-600">언어</label>
                      <select
                        value={item.language}
                        onChange={(e) => updateOrderItem(item.id, 'language', e.target.value)}
                        className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-teal-500 transition-all font-bold"
                      >
                        <option value="한글">한글</option>
                        <option value="영문">영문</option>
                      </select>
                    </div>
                    <div className="flex-[1.2] min-w-[70px]">
                      <label className="block mb-0.5 text-[12px] font-bold text-gray-600">시리즈</label>
                      <select
                        value={item.series}
                        onChange={(e) => updateOrderItem(item.id, 'series', e.target.value)}
                        className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-teal-500 transition-all font-bold"
                      >
                        {Array.from({ length: 6 }, (_, i) => `K${i + 2}`).map(s => <option key={s} value={s}>{s}</option>)}
                        {Array.from({ length: 6 }, (_, i) => `G${i + 1}`).map(s => <option key={s} value={s}>{s}</option>)}
                        {Array.from({ length: 4 }, (_, i) => `S${i + 2}`).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="w-[50px]">
                      <label className="block mb-0.5 text-[12px] font-bold text-gray-600">수량</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-1 py-1 border border-gray-200 rounded-lg bg-white text-sm text-center font-bold outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex-[1.5] text-right">
                      <label className="block mb-0.5 text-[12px] font-bold text-gray-600">금액</label>
                      <div className="text-sm font-bold text-teal-700 leading-tight">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-800" style={{ fontSize: '16px' }}>총 합계금액</span>
              <span className="font-black text-2xl text-teal-600 tracking-tight">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* 결제정보 섹션 */}
          <div className="border border-gray-200 rounded-xl p-2.5 shadow-sm bg-white">
            <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#249689', fontSize: '16px' }}>
              <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
              결제정보
            </h3>
            <div className="flex gap-1.5 mb-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <label
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === '카드'
                    ? 'bg-white text-teal-600 shadow-sm border border-teal-100 font-bold'
                    : 'text-gray-400 font-medium'
                  }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="카드"
                  checked={formData.paymentMethod === '카드'}
                  onChange={handleChange}
                  className="hidden"
                />
                <CreditCard size={18} />
                <span>카드</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === '입금'
                    ? 'bg-white text-teal-600 shadow-sm border border-teal-100 font-bold'
                    : 'text-gray-400 font-medium'
                  }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="입금"
                  checked={formData.paymentMethod === '입금'}
                  onChange={handleChange}
                  className="hidden"
                />
                <Banknote size={18} />
                <span>현금</span>
              </label>
            </div>

            {formData.paymentMethod === '카드' ? (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block mb-0.5 text-xs font-bold text-gray-700">카드번호 16자리</label>
                  <div className="flex items-center gap-1.5">
                    {cardInfo.number.map((num, i) => (
                      <input
                        key={i}
                        id={`card-number-${i}`}
                        type="text"
                        value={num}
                        onChange={(e) => handleCardNumberChange(i, e.target.value)}
                        placeholder="0000"
                        className="flex-1 w-0 text-center py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none font-bold text-sm bg-white"
                        maxLength={4}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">CVC</label>
                    <input
                      type="text"
                      value={cardInfo.cvc}
                      onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value.slice(0, 3) })}
                      placeholder="3자리"
                      className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white text-center"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">카드사</label>
                    <input
                      type="text"
                      value={cardInfo.issuer}
                      onChange={(e) => setCardInfo({ ...cardInfo, issuer: e.target.value })}
                      placeholder="현대"
                      className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">승인번호</label>
                    <input
                      type="text"
                      value={cardInfo.approvalNo}
                      onChange={(e) => setCardInfo({ ...cardInfo, approvalNo: e.target.value })}
                      placeholder="번호"
                      className="w-full px-1.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white text-center"
                    />
                  </div>
                </div>
                <button
                  onClick={validateCardNumber}
                  className="w-full py-2 bg-teal-50 text-teal-600 rounded-lg font-bold border border-teal-100 hover:bg-teal-100 transition-colors flex items-center justify-center gap-1.5 text-sm"
                >
                  <CheckCircle2 size={16} />
                  유효성 체크
                </button>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block mb-0.5 text-xs font-bold text-gray-700">입금액</label>
                  <input
                    type="text"
                    value={cashInfo.amount}
                    onChange={(e) => setCashInfo({ ...cashInfo, amount: formatCurrency(e.target.value).replace('원', '') })}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-right text-base bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">입금기관명</label>
                    <input
                      type="text"
                      value={cashInfo.bank}
                      onChange={(e) => setCashInfo({ ...cashInfo, bank: e.target.value })}
                      placeholder="예: 우리은행"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-xs font-bold text-gray-700">입금자명</label>
                    <input
                      type="text"
                      value={cashInfo.depositor}
                      onChange={(e) => setCashInfo({ ...cashInfo, depositor: e.target.value })}
                      placeholder="성함 입력"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 개인정보 및 제출 섹션 */}
          <div className="space-y-2">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="privacyAgreed"
                    checked={formData.privacyAgreed}
                    onChange={handleChange}
                    className="w-4 h-4 accent-teal-600"
                  />
                  개인정보 수집 및 이용 동의 <span className="text-red-500">*</span>
                </label>
                <button onClick={() => setShowPrivacyModal(true)} className="text-xs text-teal-600 underline">내용보기</button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-500">
                <input
                  type="checkbox"
                  name="marketingAgreed"
                  checked={formData.marketingAgreed}
                  onChange={handleChange}
                  className="w-4 h-4 accent-teal-600"
                />
                (선택) 마케팅 정보 수신 동의
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-700/10 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
              >
                {loading ? '저장 중...' : <><Check size={18} /> 확인 및 제출</>}
              </button>
              <button
                onClick={() => onNavigate?.('Dashboard')}
                disabled={loading}
                className="flex-1 py-2.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모달: 개인정보 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto">
              <h2 className="font-black mb-6 text-teal-600 text-3xl">Privacy Policy</h2>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed font-medium">
                <div className="bg-teal-50 p-4 rounded-xl">
                  <h3 className="font-bold text-teal-800 mb-2">1. 수집 목적</h3>
                  <p>- 상품 구매 및 배송 서비스 제공, 결제 처리</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-xl">
                  <h3 className="font-bold text-teal-800 mb-2">2. 수집 항목</h3>
                  <p>- 필수: 이름, 연락처, 주소(배송 시)</p>
                  <p>- 선택: 나이</p>
                </div>
                <p className="px-2">※ 수집된 정보는 목적 달성 후 지체 없이 파기하며, 법령에 따른 보존 기간을 준수합니다.</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-500/20"
              >
                창 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 카드 유효성 결과 */}
      {showCardValidationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in zoom-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl border border-gray-100">
            {cardValidationResult.success ? (
              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4 pulse">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">확인 완료</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{cardValidationResult.message}</p>
              </div>
            ) : (
              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">확인 실패</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{cardValidationResult.message}</p>
              </div>
            )}
            <button
              onClick={() => setShowCardValidationModal(false)}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${cardValidationResult.success
                  ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/20'
                  : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                }`}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 모달: 엑셀 미리보기 */}
      {showExcelPreview && excelPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[70vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileUp size={20} className="text-blue-500" />
                업로드 내용 확인
              </h3>
              <button onClick={() => setShowExcelPreview(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-sm">
                <thead className="text-gray-400 font-bold bg-gray-50/50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left">언어</th>
                    <th className="px-2 py-2 text-left">시리즈</th>
                    <th className="px-2 py-2 text-center">수량</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {excelPreview.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-2 py-3 font-medium">{row['언어'] || row['language'] || '한글'}</td>
                      <td className="px-2 py-3 font-black text-teal-600">{row['시리즈'] || row['series'] || 'K2'}</td>
                      <td className="px-2 py-3 text-center font-bold">{row['수량'] || row['quantity'] || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-blue-600 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                위의 정보를 확인해 주세요. 적용 버튼을 누르면 목록에 반영됩니다.
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 bg-gray-50">
              <button
                onClick={() => setShowExcelPreview(false)}
                className="flex-1 py-3 font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={applyExcelData}
                className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}