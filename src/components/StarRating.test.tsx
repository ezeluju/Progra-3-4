import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('renders five stars with initial value', () => {
    render(<StarRating value={2} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(5)
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[2]).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange when a star is clicked', async () => {
    const user = userEvent.setup()
    const fn = vi.fn()
    render(<StarRating onChange={fn} />)
    await user.click(screen.getAllByRole('radio')[3])
    expect(fn).toHaveBeenCalledWith(4)
  })

  it('shows hover state', () => {
    render(<StarRating value={1} />)
    const star = screen.getAllByRole('radio')[4]
    fireEvent.mouseEnter(star)
    expect(star).toHaveTextContent('★')
    fireEvent.mouseLeave(star)
    expect(star).toHaveTextContent('☆')
  })
})

