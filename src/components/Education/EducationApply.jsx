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
  const [selectedAppId, setSelectedAppId] = useState(null);

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
      .in('user_type', ['점장', '지점관리자', '시스템관리자', '점주'])
      .order('branch');
    
    if (data) setManagers(data);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.educationId || !applyForm.referrerId || !applyForm.name || !applyForm.phone || !applyForm.birthdate) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    // Deadline check
    const selectedEdu = educations.find(e => e.id === applyForm.educationId);
    if (selectedEdu && selectedEdu.registration_deadline) {
      const now = new Date();
      const deadline = new Date(selectedEdu.registration_deadline);
      if (now > deadline) {
        alert("죄송합니다. 이 교육의 신청 기간이 마감되었습니다.");
        return;
      }
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
        alert("교육 신청이 정상적으로 완료되었습니다!\n추천인(점장/지점관리자/점주)의 승인 완료 후 QR코드를 발급받으실 수 있습니다.");
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
      if (data && data.length === 1) {
        setSelectedAppId(data[0].id);
      } else {
        setSelectedAppId(null);
      }
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
              setSelectedAppId(null)
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
                {educations.map(edu => {
                  const deadline = edu.registration_deadline ? new Date(edu.registration_deadline) : null;
                  const isClosed = deadline ? new Date() > deadline : false;
                  return (
                    <option key={edu.id} value={edu.id} disabled={isClosed}>
                      [{new Date(edu.event_date).toLocaleDateString()}] {edu.title} 
                      {isClosed ? ' (신청 마감)' : (deadline ? ` (~${deadline.toLocaleDateString()} ${deadline.getHours().toString().padStart(2,'0')}:${deadline.getMinutes().toString().padStart(2,'0')} 마감)` : '')}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">추천인 (점장/지점관리자/점주) 지정</label>
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
                ) : !selectedAppId ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 px-1">총 {myApplications.length}건의 신청 내역이 있습니다.</p>
                    {myApplications.map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => setSelectedAppId(app.id)}
                        className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center hover:bg-white hover:border-[#249689] transition-all cursor-pointer group"
                      >
                        <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-[#249689]">{app.education?.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">📅 {new Date(app.education?.event_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {app.status === 'approved' ? (
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">승인</span>
                          ) : app.status === 'rejected' ? (
                            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">거절</span>
                          ) : (
                            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">대기</span>
                          )}
                          <div className="text-gray-300 group-hover:text-[#249689]">▶</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  myApplications.filter(app => app.id === selectedAppId).map(app => (
                    <div key={app.id} className="space-y-4">
                      <button 
                        onClick={() => setSelectedAppId(null)}
                        className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-gray-800"
                      >
                        ← 목록으로 돌아가기
                      </button>
                      <div className="border-2 border-[#249689] rounded-2xl p-6 shadow-sm bg-[#fcfdfd]">
                        <div className="mb-4">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">교육 신청 정보</span>
                          <h3 className="text-xl font-black text-gray-900 leading-tight mt-1">{app.education?.title}</h3>
                        </div>
                        
                        <div className="text-sm text-gray-700 mb-6 space-y-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <p className="flex justify-between">
                            <span className="text-gray-400">교육 일시</span>
                            <span className="font-bold">{new Date(app.education?.event_date).toLocaleString()}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-400">교육 장소</span>
                            <span className="font-bold">{app.education?.location}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-400">추천 소속</span>
                            <span className="font-bold">{app.referrer?.branch || '-'}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-400">추천인</span>
                            <span className="font-bold">{app.referrer?.name || '-'}</span>
                          </p>
                        </div>

                        {/* 상태에 따른 UI 분기 */}
                        <div className="mt-4">
                          {app.status === 'pending' && (
                            <div className="flex flex-col items-center gap-3 text-yellow-700 font-bold bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Clock size={24} />
                              </div>
                              <div className="text-center">
                                <p className="text-lg">승인 대기 중입니다</p>
                                <p className="text-xs font-normal text-yellow-600 mt-1">추천인(점장/지점관리자)의 승인을 기다려주세요.</p>
                              </div>
                            </div>
                          )}
                          {app.status === 'rejected' && (
                            <div className="flex flex-col items-center gap-3 text-red-700 font-bold bg-red-50 p-6 rounded-2xl border border-red-100">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle size={24} />
                              </div>
                              <div className="text-center">
                                <p className="text-lg">신청이 거절되었습니다</p>
                                <p className="text-xs font-normal text-red-600 mt-1">자세한 사항은 소속 지점에 문의해주세요.</p>
                              </div>
                            </div>
                          )}
                          {app.status === 'approved' && (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 px-4 py-2 rounded-full mb-6 border border-green-100">
                                <CheckCircle size={18} /> 승인 완료 (입장용 QR코드)
                              </div>
                              
                              <div id={`qr-container-${app.id}`} className="bg-white p-8 rounded-2xl border-2 border-gray-100 shadow-lg inline-flex flex-col items-center justify-center mb-6">
                                <div className="mb-4 text-center">
                                  <p className="text-xs text-gray-400 font-bold">Attendance QR</p>
                                  <p className="text-sm font-black text-gray-800">{app.applicant_name} 님</p>
                                </div>
                                <QRCodeSVG 
                                  value={app.qr_code_data || app.id} 
                                  size={200} 
                                  level="H"
                                  includeMargin={true}
                                />
                                <div className="mt-4 text-center">
                                  <p className="text-xs font-bold text-gray-400">PHONE</p>
                                  <p className="text-sm font-bold text-gray-800">
                                    {app.applicant_phone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')}
                                  </p>
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
                                위 QR코드를 교육장 입구의<br/>
                                <span className="text-[#249689] font-bold">참석 확인용 스캐너</span>에 보여주세요.
                              </p>
                              
                              <button
                                onClick={() => handleDownloadQR(app.id)}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-[#249689] text-white font-bold rounded-xl hover:bg-[#1d7b70] transition-colors shadow-md"
                              >
                                <Download size={20} />
                                이미지로 갤러리에 저장
                              </button>
                            </div>
                          )}
                        </div>
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
