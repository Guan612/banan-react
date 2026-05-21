import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import ThemeToggle from '../components/ThemeToggle'

describe('ThemeToggle', () => {
  test('cycles theme labels without reading localStorage directly in component logic', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button.textContent).toBe('Auto')

    fireEvent.click(button)
    expect(button.textContent).toBe('Light')

    fireEvent.click(button)
    expect(button.textContent).toBe('Dark')
  })
})
