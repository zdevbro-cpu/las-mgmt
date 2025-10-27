import React, { useState, useEffect } from 'react'

const ScrollToTop = ({ showBelow = 300 }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > showBelow) {
        setShow(true)
      } else {
        setShow(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showBelow])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!show) return null

  return (
    <button 
      onClick={scrollToTop}
      className="scroll-to-top"
      aria-label="맨 위로 가기"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1e9a8a, #2cb5a3)',
        color: 'white',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(30, 154, 138, 0.3)',
        transition: 'all 0.3s ease',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-3px)'
        e.target.style.boxShadow = '0 6px 16px rgba(30, 154, 138, 0.4)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = '0 4px 12px rgba(30, 154, 138, 0.3)'
      }}
      onMouseDown={(e) => {
        e.target.style.transform = 'translateY(-1px)'
      }}
    >
      ↑
    </button>
  )
}

export default ScrollToTop