"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  size: number
  type: 'code' | 'binary' | 'node' | 'line'
  content?: string
  color: string
}

interface Connection {
  from: { x: number; y: number }
  to: { x: number; y: number }
  opacity: number
}

interface TechBackgroundProps {
  containerRef?: React.RefObject<HTMLElement>
  scrollProgress?: number
}

export function TechBackground({ containerRef, scrollProgress = 0 }: TechBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const connectionsRef = useRef<Connection[]>([])
  const animationFrameRef = useRef<number | undefined>(undefined)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const scrollProgressRef = useRef<number>(scrollProgress)

  const codeSnippets = [
    'go',
    'hono',
    'react',
    'next.js',
    'typescript',
    'tailwind',
    'prisma',
    'supabase',
    'vercel',
    'docker',
    'kubernetes',
    'postgresql',
    'redis',
    'graphql',
    'fastapi',
    'python',
    'rust',
    'wasm',
    'vite',
    'turbo',
    'pnpm',
    'bun',
    'deno',
    'node.js',
    'express',
    'nestjs',
    'trpc',
    'zod',
    'framer',
    'three.js',
    'webgl',
    'ai/ml',
    'openai',
    'claude',
  ]

  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const container = containerRef?.current
      if (container) {
        const rect = container.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height

        // Canvasを親コンテナに固定
        canvas.style.left = '0px'
        canvas.style.top = '0px'
        canvas.style.width = rect.width + 'px'
        canvas.style.height = rect.height + 'px'
      } else {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    const initParticles = () => {
      particlesRef.current = []

      // コード断片パーティクル
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.7 + 0.3,
          size: Math.random() * 12 + 8,
          type: 'code',
          content: codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }

      // バイナリコードパーティクル
      for (let i = 0; i < 80; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          opacity: Math.random() * 0.4 + 0.1,
          size: Math.random() * 8 + 4,
          type: 'binary',
          content: Math.random() > 0.5 ? '0' : '1',
          color: '#64748b'
        })
      }

      // ネットワークノード
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.6 + 0.4,
          size: Math.random() * 3 + 2,
          type: 'node',
          color: '#06b6d4'
        })
      }
    }

    const updateConnections = () => {
      connectionsRef.current = []
      const nodes = particlesRef.current.filter(p => p.type === 'node')

      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach(otherNode => {
          const dx = node.x - otherNode.x
          const dy = node.y - otherNode.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            connectionsRef.current.push({
              from: { x: node.x, y: node.y },
              to: { x: otherNode.x, y: otherNode.y },
              opacity: Math.max(0, 1 - distance / 150) * 0.3
            })
          }
        })
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // スクロール進捗に応じた速度調整
      const speedMultiplier = 1 + (scrollProgressRef.current / 100) * 2

      // パーティクルの更新と描画
      particlesRef.current.forEach(particle => {
        // 位置更新（スクロール連動）
        particle.x += particle.vx * speedMultiplier
        particle.y += particle.vy * speedMultiplier

        // 画面端での反射
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // 境界内に保持
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))

        // 透明度のアニメーション
        particle.opacity += (Math.random() - 0.5) * 0.01
        particle.opacity = Math.max(0.1, Math.min(1, particle.opacity))

        // 描画
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.fillStyle = particle.color

        if (particle.type === 'code' || particle.type === 'binary') {
          ctx.font = `${particle.size}px 'JetBrains Mono', 'Fira Code', monospace`
          ctx.textAlign = 'center'
          ctx.fillText(particle.content || '', particle.x, particle.y)
        } else if (particle.type === 'node') {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()

          // ノードの外周を描画
          ctx.strokeStyle = particle.color
          ctx.lineWidth = 1
          ctx.stroke()
        }

        ctx.restore()
      })

      // 接続線の更新と描画
      updateConnections()
      connectionsRef.current.forEach(connection => {
        ctx.save()
        ctx.globalAlpha = connection.opacity
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(connection.from.x, connection.from.y)
        ctx.lineTo(connection.to.x, connection.to.y)
        ctx.stroke()
        ctx.restore()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    initParticles()
    animate()

    const handleResize = () => {
      // デバウンス処理でリサイズイベントを制限
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      resizeTimeoutRef.current = setTimeout(() => {
        const container = containerRef?.current
        if (container) {
          const rect = container.getBoundingClientRect()
          const currentWidth = canvas.width
          const currentHeight = canvas.height

          // サイズが実際に変わった場合のみリサイズ
          if (Math.abs(currentWidth - rect.width) > 5 || Math.abs(currentHeight - rect.height) > 5) {
            resizeCanvas()
            // パーティクルの位置を新しいサイズに調整（再生成はしない）
            particlesRef.current.forEach(particle => {
              particle.x = Math.min(particle.x, rect.width)
              particle.y = Math.min(particle.y, rect.height)
            })
          }
        } else {
          resizeCanvas()
          initParticles()
        }
      }, 150) // 150ms のデバウンス
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // scrollProgressをrefに同期
  useEffect(() => {
    scrollProgressRef.current = scrollProgress
  }, [scrollProgress])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 opacity-60"
      style={{
        background: 'transparent',
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: -10
      }}
    />
  )
}