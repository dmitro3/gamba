import React, { ReactNode, useEffect, useState } from 'react'
import styled from 'styled-components'

const Wrapper = styled.span<{$flash?: boolean}>`
  background: transparent;
  transition: background .5s;
  border-radius: 5px;
  ${({ $flash }) => $flash && `
    background: currentColor;
    transition: none;
  `}
`

interface Props {
  key?: string
  children: ReactNode
}

export function Value({ key, children }: Props) {
  const [flash, set] = useState(false)

  useEffect(() => {
    set(true)
    setTimeout(() => {
      set(false)
    }, 250)
  }, [key, children])

  return (
    <Wrapper $flash={flash}>
      {children}
    </Wrapper>
  )
}
