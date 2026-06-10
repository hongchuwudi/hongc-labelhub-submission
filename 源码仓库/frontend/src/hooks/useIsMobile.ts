/**
 * useIsMobile.ts — 移动端检测 Hook
 * Author: hongchuwudi
 * Description: 检测视口宽度是否小于 768px，供响应式布局使用
 */

import { useState, useEffect } from 'react'

/** 检测当前设备是否为移动端 */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

export default useIsMobile
