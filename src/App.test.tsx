// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function completeForm() {
  const user = userEvent.setup()
  render(<App />)
  for (const [label, value] of [
    ['Bug summary', 'Checkout fails'],
    ['Environment', 'Chrome on Windows'],
    ['Steps to reproduce', 'Open cart\nClick checkout'],
    ['Expected result', 'Payment opens'],
    ['Actual result', 'Nothing happens'],
    ['User impact', 'Cannot purchase'],
  ]) {
    await user.type(screen.getByLabelText(new RegExp(label)), value)
  }
  await user.selectOptions(screen.getByLabelText(/Frequency/), 'Every time')
  return user
}

describe('bug report workflow', () => {
  it('blocks an incomplete report and focuses the first missing field', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Review ticket/ }))
    expect(screen.getByRole('alert').textContent).toContain('Some details are missing')
    expect(document.activeElement).toBe(screen.getByLabelText(/Bug summary/))
    expect(screen.queryByRole('region', { name: 'Ticket preview' })).toBeNull()
  })

  it('reviews, copies, and edits without losing details or attachment references', async () => {
    const user = await completeForm()
    await user.upload(screen.getByLabelText(/Supporting files/), new File(['test'], 'evidence.png', { type: 'image/png' }))
    await user.click(screen.getByRole('button', { name: /Review ticket/ }))
    expect(screen.getByRole('region', { name: 'Ticket preview' }).textContent).toContain('Checkout fails')
    expect(screen.getByText('evidence.png')).toBeDefined()
    const clipboard = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: /Copy ticket/ }))
    await waitFor(() => expect(clipboard).toHaveBeenCalledOnce())
    expect(clipboard.mock.calls[0][0]).toContain('1. Open cart\n2. Click checkout')
    expect(screen.getByRole('status').textContent).toContain('Ticket copied')
    await user.click(screen.getByRole('button', { name: 'Edit details' }))
    expect((screen.getByLabelText(/Bug summary/) as HTMLInputElement).value).toBe('Checkout fails')
    expect((screen.getByLabelText(/Steps to reproduce/) as HTMLTextAreaElement).value).toBe('Open cart\nClick checkout')
    await user.click(screen.getByRole('button', { name: 'Remove evidence.png' }))
    expect(screen.queryByText('evidence.png')).toBeNull()
  })

  it('explains clipboard failure instead of reporting success', async () => {
    const user = await completeForm()
    await user.click(screen.getByRole('button', { name: /Review ticket/ }))
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'))
    await user.click(screen.getByRole('button', { name: /Copy ticket/ }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Could not copy'))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('downloads Markdown with the expected filename and content', async () => {
    const user = await completeForm()
    await user.click(screen.getByRole('button', { name: /Review ticket/ }))
    const create = vi.fn().mockReturnValue('blob:ticket')
    const revoke = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('checkout-fails.md')
      expect(this.href).toBe('blob:ticket')
    })
    try {
      await user.click(screen.getByRole('button', { name: 'Download Markdown' }))
      expect(click).toHaveBeenCalledOnce()
      expect(create).toHaveBeenCalledWith(expect.any(Blob))
      expect(screen.getByRole('status').textContent).toContain('download requested')
      await waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:ticket'), { timeout: 2000 })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('requires confirmation before clearing a draft', async () => {
    const user = await completeForm()
    await user.click(screen.getByRole('button', { name: /Clear draft & start over/ }))
    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect((screen.getByLabelText(/Bug summary/) as HTMLInputElement).value).toBe('Checkout fails')
    await user.click(screen.getByRole('button', { name: /Clear draft & start over/ }))
    await user.click(screen.getByRole('button', { name: 'Yes, clear draft' }))
    expect((screen.getByLabelText(/Bug summary/) as HTMLInputElement).value).toBe('')
    expect(screen.getByRole('status').textContent).toContain('Draft cleared')
  })
})
