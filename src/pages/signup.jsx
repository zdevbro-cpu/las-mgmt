import React, { useState } from 'react';

const SUPABASE_URL = 'https://sgxnxbhbyvrmgrzhosyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG54YmhieXZybWdyemhvc3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDAzMzMsImV4cCI6MjA3MzQ3NjMzM30.1qS_3Qr-zv7woSyPbkdiLkhuXp2pVHJHGiF3iKWEBkc';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    brname: '',
    handphone: '',
    userType: '점주'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log('🔍 회원가입 시작...');

    // 유효성 검사
    if (!formData.email || !formData.password || !formData.name || !formData.brname) {
      setError('필수 항목을 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      console.log('📧 이메일:', formData.email);
      console.log('👤 이름:', formData.name);
      console.log('🏪 지점명:', formData.brname);

      // 1. Supabase Auth API로 회원가입
      console.log('1️⃣ Auth 회원가입 시도...');
      const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        console.error('❌ Auth 오류:', authData);
        throw new Error(authData.error_description || authData.msg || '회원가입 실패');
      }

      console.log('✅ Auth 회원가입 성공!', authData);

      // 2. users 테이블에 추가 정보 저장
      if (authData.user) {
        console.log('2️⃣ users 테이블에 정보 저장 중...');
        
        const userData = {
          auth_id: authData.user.id,
          email: formData.email,
          name: formData.name,
          brname: formData.brname,
          handphone: formData.handphone || null,
          user_type: formData.userType
        };

        console.log('저장할 데이터:', userData);

        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(userData)
        });

        const insertData = await insertResponse.json();

        if (!insertResponse.ok) {
          console.error('❌ 테이블 저장 오류:', insertData);
          throw new Error(insertData.message || '사용자 정보 저장 실패');
        }

        console.log('✅ users 테이블 저장 성공!', insertData);

        setSuccess('✅ 회원가입이 완료되었습니다! 로그인할 수 있습니다.');
        
        // 폼 초기화
        setFormData({
          email: '',
          password: '',
          passwordConfirm: '',
          name: '',
          brname: '',
          handphone: '',
          userType: '점주'
        });

        // 성공 알림
        setTimeout(() => {
          alert('회원가입 성공! 이제 로그인할 수 있습니다.');
        }, 1000);
      }
    } catch (err) {
      console.error('💥 회원가입 오류:', err);
      setError(`회원가입 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
      console.log('🏁 회원가입 프로세스 종료');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-cyan-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-cyan-600">회원가입</h1>
          <p className="text-sm text-gray-500 mt-2">LAS 매장관리 시스템</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📧 이메일 *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔒 비밀번호 * (6자 이상)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔒 비밀번호 확인 *
            </label>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 확인하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👤 이름 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏪 지점명 *
            </label>
            <input
              type="text"
              name="brname"
              value={formData.brname}
              onChange={handleChange}
              placeholder="지점명을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📱 핸드폰
            </label>
            <input
              type="tel"
              name="handphone"
              value={formData.handphone}
              onChange={handleChange}
              placeholder="핸드폰 번호를 입력하세요 (선택)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              구분
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="점주"
                  checked={formData.userType === '점주'}
                  onChange={handleChange}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-gray-700">점주</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="점장"
                  checked={formData.userType === '점장'}
                  onChange={handleChange}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-gray-700">점장</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리중...' : '회원가입'}
            </button>
            <button
              onClick={() => {
                setFormData({
                  email: '',
                  password: '',
                  passwordConfirm: '',
                  name: '',
                  brname: '',
                  handphone: '',
                  userType: '점주'
                });
                setError('');
                setSuccess('');
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition"
            >
              취소
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            이미 회원이신가요?{' '}
            <button className="text-cyan-600 font-semibold hover:underline">
              로그인 하기
            </button>
          </p>
        </div>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>팁:</strong> F12를 눌러 개발자 도구를 열면 자세한 로그를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}