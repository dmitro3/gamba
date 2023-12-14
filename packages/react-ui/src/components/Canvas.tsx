import React from 'react'
import useAnimationFrame, { AnimationFrameData } from '../hooks/useAnimationFrame'

export interface CanvasProps extends React.InputHTMLAttributes<HTMLCanvasElement> {
  zIndex?: number
  render: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    time: AnimationFrameData,
    stuff: {width: number, height: number},
  ) => void
}

export const GambaCanvas = React.forwardRef<HTMLCanvasElement, CanvasProps>(function Canvas(props, forwardRef) {
  const { render, zIndex = 0, style, ...rest } = props
  const wrapper = React.useRef<HTMLDivElement>(null!)
  const canvas = React.useRef<HTMLCanvasElement>(null!)

  React.useImperativeHandle(forwardRef, () => canvas.current)

  useAnimationFrame(
    (time) => {
      const ctx = canvas.current.getContext('2d')!
      ctx.save()
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      render(
        canvas.current,
        ctx,
        time,
        {width: wrapper.current.clientWidth, height: wrapper.current.clientHeight}
      )
      ctx.restore()
    }
  )

  React.useLayoutEffect(() => {
    let timeout: NodeJS.Timer

    const resize = () => {
      canvas.current.width = wrapper.current.clientWidth * window.devicePixelRatio
      canvas.current.height = wrapper.current.clientHeight * window.devicePixelRatio
    }

    const ro = new ResizeObserver(resize)

    ro.observe(wrapper.current)

    const resizeHandler = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        resize()
      }, 250)
    }

    window.addEventListener('resize', resizeHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
      ro.disconnect()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div ref={wrapper} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex}}>
      <canvas {...rest} style={{ width: '100%', height: '100%', ...style }} ref={canvas} />
    </div>
  )
})
