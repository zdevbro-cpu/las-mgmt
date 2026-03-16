import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, AlertCircle, Clock, Save, Search, User, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function EducationApply() {
  const [activeTab, setActiveTab] = useState('apply'); // 'apply' or 'check'
  const [educations, setEducations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    name: '',
    phone: '',
    birthdate: '',
    educationId: '',
    referrerId: ''
  });

  // Check Form State
  const [checkForm, setCheckForm] = useState({
    name: '',
    phone: '',
    birthdate: ''
  });
  const [myApplications, setMyApplications] = useState([]);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    fetchActiveEducations();
    fetchManagers();
  }, []);

  const fetchActiveEducations = async () => {
    const { data } = await supabase
      .from('educations')
      .select('*')
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true });
    
    if (data) setEducations(data);
  };

  const fetchManagers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, name, branch, user_type')
      .in('user_type', ['점장', '지점관리자', '시스템관리자'])
      .order('branch');
    
    if (data) setManagers(data);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.educationId || !applyForm.referrerId || !applyForm.name || !applyForm.phone || !applyForm.birthdate) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // Create unique QR code data token
      const qrData = `EDU-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { error } = await supabase
        .from('education_applications')
        .insert({
          education_id: applyForm.educationId,
          applicant_name: applyForm.name.trim(),
          applicant_phone: applyForm.phone.trim().replace(/-/g, ''),
          applicant_birthdate: applyForm.birthdate.trim().replace(/-/g, ''),
          referrer_id: applyForm.referrerId,
          qr_code_data: qrData,
          status: 'pending',
          attendance_status: 'absent'
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          alert("이미 해당 교육에 등록된 전화번호입니다.");
        } else {
          alert('신청 중 오류가 발생했습니다: ' + error.message);
        }
      } else {
        alert("교육 신청이 정상적으로 완료되었습니다!\n점장님의 승인 완료 후 QR코드를 발급받으실 수 있습니다.");
        setApplyForm({ name: '', phone: '', birthdate: '', educationId: '', referrerId: '' });
        setActiveTab('check');
        // Pre-fill check form and perform a search immediately if possible
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckSubmit = async (e) => {
    e.preventDefault();
    if (!checkForm.name || !checkForm.phone || !checkForm.birthdate) {
      alert("모든 조회 정보를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setHasChecked(false);
    
    const plainPhone = checkForm.phone.replace(/-/g, '');
    const plainBirth = checkForm.birthdate.replace(/-/g, '');

    const { data, error } = await supabase
      .from('education_applications')
      .select(`
        *,
        education:educations(title, event_date, location),
        referrer:users(name, branch)
      `)
      .eq('applicant_name', checkForm.name.trim())
      .eq('applicant_phone', plainPhone)
      .eq('applicant_birthdate', plainBirth)
      .order('created_at', { ascending: false });

    setIsLoading(false);
    setHasChecked(true);

    if (error) {
      alert("조회 중 오류가 발생했습니다: " + error.message);
    } else {
      setMyApplications(data || []);
    }
  };

  const handleDownloadQR = async (appId) => {
    const qrElement = document.getElementById(`qr-container-${appId}`);
    if (!qrElement) return;
    
    try {
      // Capture the element styling as an image
      const canvas = await html2canvas(qrElement, { backgroundColor: '#ffffff', scale: 2 });
      const imageURL = canvas.toDataURL('image/png');
      
      // Create a temporary anchor to trigger download
      const link = document.createElement('a');
      link.href = imageURL;
      link.download = `교육입장_QR코드_${appId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("QR 코드가 기기에 저장되었습니다.\n갤러리 또는 다운로드 폴더를 확인해주세요.");
    } catch (err) {
      console.error("QR 다운로드 오류", err);
      alert("다운로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-md bg-white rounded-t-xl shadow-sm border-b p-5 flex items-center justify-center gap-2 mt-4">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#249689' }}>
          <User size={24} /> 교육 신청 및 출석 조회
        </h1>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-b-xl shadow-md p-6 border-t-0">
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
              activeTab === 'apply' ? 'bg-white shadow text-[#249689]' : 'text-gray-500'
            }`}
          >
            교육 신청하기
          </button>
          <button
            onClick={() => {
              setActiveTab('check')
              setHasChecked(false)
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
              activeTab === 'check' ? 'bg-white shadow text-[#249689]' : 'text-gray-500'
            }`}
          >
            신청내역 / QR 조회
          </button>
        </div>

        {/* ==================================
            TAB 1: 교육 신청하기
            ================================== */}
        {activeTab === 'apply' && (
          <form onSubmit={handleApplySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">참석할 교육 선택</label>
              <select 
                required
                value={applyForm.educationId}
                onChange={e => setApplyForm({...applyForm, educationId: e.target.value})}
                className="w-full bg-gray-50 border rounded-lg p-3 text-sm"
              >
                <option value="" disabled>-- 진행 중인 교육을 선택하세요 --</option>
                {educations.map(edu => (
                  <option key={edu.id} value={edu.id}>
                    [{new Date(edu.event_date).toLocaleDateString()}] {edu.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">추천인 (점장/지점장) 지정</label>
              <select 
                required
                value={applyForm.referrerId}
                onChange={e => setApplyForm({...applyForm, referrerId: e.target.value})}
                className="w-full bg-gray-50 border rounded-lg p-3 text-sm"
              >
                <option value="" disabled>-- 나를 추천한 분을 선택하세요 --</option>
                {managers.map(mgr => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.branch} - {mgr.name} ({mgr.user_type})
                  </option>
                ))}
              </select>
            </div>

            <hr className="my-4 border-gray-200" />

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">신청자 이름</label>
              <input 
                required type="text" placeholder="예: 홍길동"
                value={applyForm.name} onChange={e => setApplyForm({...applyForm, name: e.target.value})}
                className="w-full bg-gray-50 border rounded-lg p-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">전화번호</label>
              <input 
                required type="tel" placeholder="- 없이 숫자만 입력 (예: 01012345678)"
                value={applyForm.phone} onChange={e => setApplyForm({...applyForm, phone: e.target.value})}
                className="w-full bg-gray-50 border rounded-lg p-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">생년월일 (8자리)</label>
              <input 
                required type="text" placeholder="예: 19900115" maxLength={8}
                value={applyForm.birthdate} onChange={e => setApplyForm({...applyForm, birthdate: e.target.value.replace(/[^0-9]/g, '')})}
                className="w-full bg-gray-50 border rounded-lg p-3 text-sm"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-6 py-4 bg-[#249689] text-white font-bold rounded-lg hover:bg-[#1d7b70] disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {isLoading ? '신청 중...' : '교육 신청하기'}
            </button>
          </form>
        )}

        {/* ==================================
            TAB 2: 신청내역 / QR 조회
            ================================== */}
        {activeTab === 'check' && (
          <div className="space-y-4">
            <form onSubmit={handleCheckSubmit} className="space-y-3 mb-6 bg-blue-50 p-4 rounded-lg">
              <h2 className="text-sm font-bold text-blue-800 mb-2">본인 인증 (신청 시 입력한 정보)</h2>
              <input 
                required type="text" placeholder="이름"
                value={checkForm.name} onChange={e => setCheckForm({...checkForm, name: e.target.value})}
                className="w-full bg-white border rounded-lg p-3 text-sm"
              />
              <input 
                required type="tel" placeholder="전화번호 (- 없이)"
                value={checkForm.phone} onChange={e => setCheckForm({...checkForm, phone: e.target.value})}
                className="w-full bg-white border rounded-lg p-3 text-sm"
              />
              <input 
                required type="text" placeholder="생년월일 8자리 (예: 19900115)" maxLength={8}
                value={checkForm.birthdate} onChange={e => setCheckForm({...checkForm, birthdate: e.target.value.replace(/[^0-9]/g, '')})}
                className="w-full bg-white border rounded-lg p-3 text-sm"
              />
              <button 
                type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-lg"
              >
                <Search size={18} />
                {isLoading ? '조회 중...' : '조회하기'}
              </button>
            </form>

            {hasChecked && (
              <div className="space-y-4">
                {myApplications.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50 rounded-lg text-gray-500">
                    <p>등록된 교육 신청 내역이 없습니다.</p>
                  </div>
                ) : (
                  myApplications.map(app => (
                    <div key={app.id} className="border rounded-lg p-5 shadow-sm">
                      <div className="mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">교육명</span>
                        <h3 className="text-lg font-bold text-gray-900">{app.education?.title}</h3>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4 space-y-1">
                        <p>📅 {new Date(app.education?.event_date).toLocaleString()}</p>
                        <p>📍 {app.education?.location}</p>
                        <p>👤 추천인: {app.referrer?.branch} {app.referrer?.name}</p>
                      </div>

                      {/* 상태에 따른 UI 분기 */}
                      <div className="mt-4 pt-4 border-t">
                        {app.status === 'pending' && (
                          <div className="flex items-center gap-2 text-yellow-600 font-bold bg-yellow-50 p-3 rounded-lg justify-center">
                            <Clock size={20} /> 점장 승인 대기 중입니다.
                          </div>
                        )}
                        {app.status === 'rejected' && (
                          <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-3 rounded-lg justify-center">
                            <AlertCircle size={20} /> 취소/거절된 신청입니다.
                          </div>
                        )}
                        {app.status === 'approved' && (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-3 rounded-lg mb-4 w-full justify-center">
                              <CheckCircle size={20} /> 승인 완료 (입장용 QR코드)
                            </div>
                            <div id={`qr-container-${app.id}`} className="bg-white p-6 rounded-xl border-2 border-green-100 shadow-sm inline-flex flex-col items-center justify-center">
                              <h3 className="font-bold text-gray-800 mb-1 whitespace-nowrap">[{app.education?.title}]</h3>
                              <p className="text-gray-600 font-bold text-sm mb-4">{new Date(app.education?.event_date).toLocaleString()}</p>
                              <QRCodeSVG 
                                value={app.qr_code_data || app.id} 
                                size={180} 
                                level="M"
                                includeMargin={true}
                              />
                              <p className="text-sm font-bold text-gray-800 mt-4">{app.applicant_name} 님</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {app.applicant_phone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center mb-4">
                              교육장 입장 시 담당자에게<br/>위 QR코드를 제시해 주세요.
                            </p>
                            <button
                              onClick={() => handleDownloadQR(app.id)}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-[#249689] text-white font-bold rounded-lg hover:bg-[#1d7b70] transition-colors"
                            >
                              <Download size={20} />
                              이미지로 갤러리에 저장
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
