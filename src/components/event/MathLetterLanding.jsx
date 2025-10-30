import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function MathLetterLanding() {
  const [email, setEmail] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const navigate = useNavigate()

  // 이메일 유효성 검사
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 스크롤 이동
  const scrollToSubscribe = () => {
    document.getElementById('subscribe')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    })
  }

  // 구독 신청 처리
  const handleSubscribe = async (e) => {
    e.preventDefault()
    
    const trimmedEmail = email.trim()
    
    if (!isValidEmail(trimmedEmail)) {
      alert('올바른 이메일 주소를 입력해주세요.')
      return
    }
    
    try {
      const params = new URLSearchParams(window.location.search)
      const refCode = params.get('ref')
      
      // Supabase에 이메일 저장
      const { data, error } = await supabase
        .from('event_participants')
        .insert([{
          email: trimmedEmail,
          referrer_code: refCode || null,
          event_name: '수학편지 구독',
          privacy_agreed: true,
          marketing_agreed: true
        }])
        .select()
      
      if (error) {
        console.error('❌ 저장 오류:', error)
        alert(`이메일 저장 중 오류가 발생했습니다.\n\n${error.message}`)
        return
      }
      
      console.log('✅ 이메일 저장 성공:', data)
      localStorage.setItem('mathLetterEmail', trimmedEmail)
      
      // 정보 입력 페이지로 이동
      navigate(refCode ? `/event?ref=${encodeURIComponent(refCode)}` : '/event')
      
    } catch (err) {
      console.error('❌ 오류:', err)
      alert(`오류가 발생했습니다.\n\n${err.message}`)
    }
  }

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --primary: #2D7C8E;
          --primary-light: #4BA5B8;
          --primary-dark: #1E5A6A;
          --accent: #5CC0CE;
          --accent-light: #8FD9E3;
          --text-dark: #1a1a1a;
          --text-gray: #4a4a4a;
          --text-light: #6a6a6a;
          --bg-light: #f8fafb;
          --bg-white: #ffffff;
          --gradient-1: linear-gradient(135deg, #2D7C8E 0%, #4BA5B8 100%);
          --gradient-2: linear-gradient(135deg, #5CC0CE 0%, #8FD9E3 100%);
          --shadow-sm: 0 2px 8px rgba(45, 124, 142, 0.08);
          --shadow-md: 0 4px 16px rgba(45, 124, 142, 0.12);
          --shadow-lg: 0 8px 32px rgba(45, 124, 142, 0.16);
        }

        body {
          color: var(--text-dark);
          line-height: 1.7;
          overflow-x: hidden;
          background: var(--bg-white);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Navigation */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: var(--shadow-sm);
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--primary);
          font-weight: 700;
          font-size: 1.5rem;
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .logo:hover {
          transform: translateY(-2px);
        }

        .logo img {
          height: 40px;
          width: auto;
        }

        .cta-btn-nav {
          background: var(--gradient-1);
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-sm);
        }

        .cta-btn-nav:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        /* Hero Section */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 0 80px;
          overflow: hidden;
          background: linear-gradient(135deg, #f8fafb 0%, #e8f4f7 100%);
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          z-index: 0;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          animation: float 20s infinite ease-in-out;
        }

        .shape-1 {
          width: 400px;
          height: 400px;
          background: var(--gradient-1);
          top: -100px;
          right: -100px;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 300px;
          height: 300px;
          background: var(--gradient-2);
          bottom: -50px;
          left: -50px;
          animation-delay: 7s;
        }

        .shape-3 {
          width: 200px;
          height: 200px;
          background: var(--accent);
          top: 50%;
          left: 10%;
          animation-delay: 14s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          animation: fadeInUp 1s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 24px;
          color: var(--text-dark);
        }

        .hero-title .highlight {
          background: var(--gradient-1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          line-height: 1.8;
          color: var(--text-gray);
          margin-bottom: 40px;
        }

        .hero-subtitle strong {
          color: var(--primary);
          font-weight: 700;
        }

        .cta-btn-primary {
          background: var(--gradient-1);
          color: white;
          border: none;
          padding: 18px 48px;
          border-radius: 50px;
          font-size: 1.15rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-md);
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }

        .cta-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }

        .hero-note {
          margin-top: 20px;
          font-size: 1.1rem;
          color: var(--text-light);
        }

        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          animation: bounce 2s infinite;
          color: var(--primary);
          font-size: 1.5rem;
          cursor: pointer;
        }

        @keyframes bounce {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, 10px); }
        }

        /* Section Styles */
        section {
          padding: 100px 0;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 16px;
          position: relative;
          display: inline-block;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 4px;
          background: var(--gradient-1);
          border-radius: 2px;
        }

        /* About Section */
        .about {
          background: var(--bg-white);
        }

        .about-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .lead-text {
          font-size: 1.2rem;
          line-height: 1.9;
          color: var(--text-gray);
          text-align: center;
          margin-bottom: 60px;
        }

        .lead-text strong {
          color: var(--primary);
          font-weight: 700;
        }

        .about-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 30px;
          background: var(--bg-light);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .feature-item:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
        }

        .feature-icon {
          font-size: 3rem;
          flex-shrink: 0;
        }

        .feature-text h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .feature-text p {
          color: var(--text-gray);
          line-height: 1.6;
        }

        /* Why Section */
        .why {
          background: var(--bg-light);
        }

        .why-content {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 60px;
          align-items: center;
        }

        .why-visual {
          position: relative;
        }

        .pattern-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 20px;
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-md);
          max-width: 280px;
          margin: 0 auto;
        }

        .pattern-item {
          font-size: 2.5rem;
          text-align: center;
          padding: 12px;
          background: var(--bg-light);
          border-radius: 12px;
          transition: transform 0.3s ease;
        }

        .pattern-item:hover {
          transform: scale(1.1) rotate(5deg);
        }

        .why-text {
          padding: 20px;
        }

        .why-lead {
          font-size: 1.15rem;
          color: var(--text-gray);
          margin-bottom: 24px;
        }

        .why-emphasis {
          font-size: 1.5rem;
          line-height: 1.6;
          color: var(--text-dark);
          margin-bottom: 24px;
        }

        .highlight-text {
          background: var(--gradient-1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
        }

        .why-description {
          font-size: 1.1rem;
          line-height: 1.8;
          color: var(--text-gray);
        }

        .why-description strong {
          color: var(--primary);
          font-weight: 700;
        }

        /* How Section */
        .how {
          background: var(--bg-white);
        }

        .how-steps {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 30px;
          flex-wrap: wrap;
        }

        .step-item {
          flex: 1;
          min-width: 250px;
          max-width: 300px;
          padding: 40px 30px;
          text-align: center;
          background: var(--bg-light);
          border-radius: 20px;
          position: relative;
          transition: all 0.3s ease;
        }

        .step-item:hover {
          transform: translateY(-10px);
          box-shadow: var(--shadow-lg);
          background: white;
        }

        .step-number {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 50px;
          height: 50px;
          background: var(--gradient-1);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          box-shadow: var(--shadow-md);
        }

        .step-icon {
          font-size: 3rem;
          color: var(--primary);
          margin: 20px 0;
        }

        .step-item h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 12px;
        }

        .step-item p {
          color: var(--text-gray);
          line-height: 1.6;
        }

        .step-arrow {
          font-size: 2rem;
          color: var(--accent);
          flex-shrink: 0;
        }

        /* Social Proof Section */
        .social-proof {
          background: linear-gradient(135deg, #2D7C8E 0%, #4BA5B8 100%);
          color: white;
        }

        .social-proof .section-title {
          color: white;
        }

        .social-proof .section-title::after {
          background: white;
        }

        .testimonials {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }

        .testimonial-item {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 40px 30px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .testimonial-item:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.15);
        }

        .quote-icon {
          font-size: 4rem;
          font-family: Georgia, serif;
          color: var(--accent-light);
          line-height: 1;
          margin-bottom: 16px;
        }

        .testimonial-text {
          font-size: 1.3rem;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .testimonial-author {
          font-size: 1.1rem;
          color: var(--accent-light);
        }

        .stats {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 1rem;
          color: var(--accent-light);
        }

        .stat-divider {
          display: none;
        }

        /* Final CTA Section */
        .final-cta {
          background: var(--bg-light);
          padding: 120px 0;
        }

        .cta-content {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 60px;
          align-items: center;
        }

        .cta-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .envelope-icon {
          width: 150px;
          height: 150px;
          background: var(--gradient-1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          animation: pulse 2s infinite;
        }

        .envelope-icon i {
          font-size: 4rem;
          color: white;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .cta-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.4;
          color: var(--text-dark);
          margin-bottom: 20px;
        }

        .cta-subtitle {
          font-size: 1.15rem;
          line-height: 1.8;
          color: var(--text-gray);
          margin-bottom: 40px;
        }

        .cta-subtitle strong {
          color: var(--primary);
          font-weight: 700;
        }

        /* Subscribe Form */
        .subscribe-form {
          margin-top: 40px;
        }

        .form-group {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .email-input {
          flex: 1;
          padding: 16px 24px;
          border: 2px solid #e0e0e0;
          border-radius: 50px;
          font-size: 1rem;
          font-family: 'Noto Sans KR', sans-serif;
          transition: all 0.3s ease;
        }

        .email-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(45, 124, 142, 0.1);
        }

        .submit-btn {
          background: var(--gradient-1);
          color: white;
          border: none;
          padding: 16px 36px;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-md);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

       .form-note {
        font-size: 0.9rem;
        color: var(--text-light);
        display: flex;
        flex-direction: column;  /* 추가 - 세로 방향 배치 */
        align-items: center;      /* 이미 있었음 - 가로 중앙 정렬 */
        gap: 8px;
        text-align: center;       /* 추가 - 텍스트 중앙 정렬 */
      }

        .form-note i {
          color: var(--primary);
        }

        /* Footer */
        .footer {
          background: var(--text-dark);
          color: white;
          padding: 60px 0;
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          text-align: center;
        }

        .footer-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .footer-logo img {
          height: 50px;
          width: auto;
        }

        .footer-logo p {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .footer-info {
          color: rgba(255, 255, 255, 0.7);
        }

        .footer-info p {
          margin: 8px 0;
          font-size: 0.95rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .why-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .step-arrow {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.3rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .pattern-grid {
            max-width: 250px;
            padding: 18px;
            gap: 10px;
          }

          .pattern-item {
            font-size: 2rem;
            padding: 10px;
          }

          .cta-content {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .cta-title {
            font-size: 1.75rem;
          }

          .form-group {
            flex-direction: column;
          }

          .submit-btn {
            width: 100%;
            justify-content: center;
          }

          .about-features {
            grid-template-columns: 1fr;
          }

          .stats {
            gap: 30px;
          }

          .stat-divider {
            display: none;
          }

          .how-steps {
            flex-direction: column;
          }

          .step-item {
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 0 16px;
          }

          .hero {
            padding: 100px 0 60px;
          }

          .hero-title {
            font-size: 2rem;
          }

          section {
            padding: 60px 0;
          }

          .cta-btn-primary {
            padding: 16px 32px;
            font-size: 1rem;
          }

          .logo span {
            font-size: 2.0rem;
          }

          .cta-btn-nav {
            padding: 10px 20px;
            font-size: 0.85rem;
          }

          .envelope-icon {
            width: 100px;
            height: 100px;
          }

          .envelope-icon i {
            font-size: 2.5rem;
          }

          .pattern-item {
            font-size: 1.8rem;
            padding: 8px;
          }

          .pattern-grid {
            max-width: 220px;
            padding: 15px;
            gap: 8px;
          }
        }
      `}</style>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />

      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/images/logo.png" alt="라스북 로고" />
              <span>LAS Book 수학편지</span>
            </div>
            {/* <button className="cta-btn-nav" onClick={scrollToSubscribe}>무료 구독하기</button> */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              수학을 잘하기보다,<br />
              <span className="highlight">함께 느끼는 시간</span>이<br />
              더 중요합니다.
            </h1>
            <p className="hero-subtitle">
              아이와 부모가 함께 읽는<br />무료 뉴스레터,<strong>'라스북 수학편지'</strong>로<br />수학의 진짜 의미를 발견하세요.
            </p>
            <button className="cta-btn-primary" onClick={scrollToSubscribe}>
              <i className="fas fa-envelope"></i>
              무료 구독하기
            </button>
            <p className="hero-note">매일 한 통의 수학 이야기가<br />  이메일로 도착합니다.</p>
          </div>
        </div>
        <div className="scroll-indicator" onClick={scrollToSubscribe}>
          <i className="fas fa-chevron-down"></i>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">라스북 수학편지란<br />무엇인가요?</h2>
          </div>
          <div className="about-content">
            <p className="lead-text">
              라스북은 <strong>미국 연방교육부 기준의</strong><br />
              <strong>세계 수학교육 표준</strong>을 바탕으로,<br />
              아이와 부모가 함께<br />
              <strong>'수학의 본질'</strong>을 발견하는<br />
              무료 교육 편지 프로그램입니다.
            </p>
            <div className="about-features">
              <div className="feature-item">
                <div className="feature-icon">🌿</div>
                <div className="feature-text">
                  <h3>아이에게는</h3>
                  <p>호기심을 키워주는 질문</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">👨‍👩‍👧</div>
                <div className="feature-text">
                  <h3>부모에게는</h3>
                  <p>대화의 주제와 통찰</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📖</div>
                <div className="feature-text">
                  <h3>가정에는</h3>
                  <p>함께 배우는 따뜻한 시간</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="why">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">왜 이 편지를 <br />읽어야 할까요?</h2>
          </div>
          <div className="why-content">
            <div className="why-visual">
              <div className="pattern-grid">
                <div className="pattern-item">❄️</div>
                <div className="pattern-item">🍃</div>
                <div className="pattern-item">⭐</div>
                <div className="pattern-item">🐚</div>
                <div className="pattern-item">🌸</div>
                <div className="pattern-item">🔷</div>
              </div>
            </div>
            <div className="why-text">
              <p className="why-lead">
                우리는<br />
                오랫동안 <strong>'연산'</strong>을 수학의 전부로 배워왔습니다.
              </p>
              <p className="why-emphasis">
                하지만 수학의 본질은 <br />계산이 아니라<br />
                <span className="highlight-text">'세상을 관찰하고 이해하는 힘'</span><br />이에요.
              </p>
              <p className="why-description">
                라스북 수학편지는<br />
                아이가 <strong>세상 속 수학</strong>을 발견하고,<br />
                부모가 함께 그 의미를 이야기하도록 돕습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Section */}
      <section className="how">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">이렇게 진행됩니다</h2>
          </div>
          <div className="how-steps">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <h3>구독 신청 (무료)</h3>
              <p>간단히 이메일만 입력하세요.</p>
            </div>
            <div className="step-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-icon">
                <i className="fas fa-envelope-open-text"></i>
              </div>
              <h3>매일 한 편의 수학편지 도착</h3>
              <p>매일 자연·예술·과학과 연결된 수학 이야기가 이메일로 전달됩니다.</p>
            </div>
            <div className="step-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>아이와 함께 대화하기</h3>
              <p>읽고, 묻고, 생각하며 '수학의 언어로 세상을 보는 법'을 함께 익힙니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="social-proof">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">함께하는 가족의 이야기</h2>
          </div>
          <div className="testimonials">
            <div className="testimonial-item">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">아이와 대화가 깊어졌어요.</p>
              <div className="testimonial-author">- 초등 2학년 학부모</div>
            </div>
            <div className="testimonial-item">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">수학이 처음으로 따뜻하게 느껴졌습니다.</p>
              <div className="testimonial-author">- 중학생 엄마</div>
            </div>
            <div className="testimonial-item">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">이건 공부가 아니라 대화예요.</p>
              <div className="testimonial-author">- 유치원생 아빠</div>
            </div>
          </div>
          <div className="stats">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">함께하는 가정</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">매주</div>
              <div className="stat-label">새로운 수학 이야기</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">무료</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta" id="subscribe">
        <div className="container">
          <div className="cta-content">
            <div className="cta-visual">
              <div className="envelope-icon">
                <i className="fas fa-envelope"></i>
              </div>
            </div>
            <div className="cta-text">
              <h2 className="cta-title">수학은 계산이 아니라,<br />세상을 이해하는 언어입니다.</h2>
              <p className="cta-subtitle">
                지금 구독하고, 아이와 함께 <br /><strong>'생각이 자라는 수학 시간'</strong>을<br />시작하세요.
              </p>
              
              {/* Subscription Form */}
              <form className="subscribe-form" onSubmit={handleSubscribe}>
                <div className="form-group">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="email-input" 
                    placeholder="이메일 주소를 입력하세요"
                    required
                  />
                  <button type="submit" className="submit-btn">
                    <i className="fas fa-paper-plane"></i>
                    무료로 구독하기
                  </button>
                </div>
                <p className="form-note">
                  <i className="fas fa-lock"></i>
                    언제든지 구독을 취소할 수 있습니다.<br />개인정보는 안전하게 보호됩니다.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="/images/logo.png" alt="라스북 로고" />
              <p>라스북 수학편지</p>
            </div>
            <div className="footer-info">
              <p>&copy; 2024 라스북. All rights reserved.</p>
              <p>아이와 부모가 함께 성장하는 수학 교육</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}