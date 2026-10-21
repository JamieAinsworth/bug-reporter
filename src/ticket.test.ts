import { describe, expect, it } from 'vitest'
import { emptyDraft, formatTicket, getSteps, requiredFields, validateDraft } from './ticket'
import type { BugDraft } from './ticket'

const valid: BugDraft = {
  summary: 'Checkout does not open', environment: 'Chrome 128, Windows 11',
  steps: '1. Open cart\n2. Click checkout', expected: 'Payment page opens',
  actual: 'Cart remains open', frequency: 'Every time', impact: 'Customers cannot pay',
  attachments: [],
}

describe('ticket validation', () => {
  it('requires all seven essentials without guessing', () => {
    expect(Object.keys(validateDraft(emptyDraft))).toEqual([...requiredFields])
    expect(validateDraft(valid)).toEqual({})
  })

  it('rejects whitespace, empty numbered steps, and unlisted frequencies', () => {
    expect(validateDraft({ ...valid, expected: ' \n ' }).expected).toBeDefined()
    expect(validateDraft({ ...valid, steps: '1.\n2. ' }).steps).toBeDefined()
    expect(validateDraft({ ...valid, frequency: 'probably' }).frequency).toBeDefined()
    expect(validateDraft({ ...valid, frequency: 'Not yet known' })).toEqual({})
  })

  it('enforces the exact summary limit', () => {
    expect(validateDraft({ ...valid, summary: 'a'.repeat(255) })).toEqual({})
    expect(validateDraft({ ...valid, summary: 'a'.repeat(256) }).summary).toBeDefined()
  })
})

describe('ticket formatting', () => {
  it('normalizes numbered steps, Windows line endings, and blank lines', () => {
    expect(getSteps(' 1. Open cart\r\n\r\n2) Click checkout\nWait ')).toEqual(['Open cart', 'Click checkout', 'Wait'])
    expect(getSteps('1.5 seconds later, click again')).toEqual(['1.5 seconds later, click again'])
  })

  it('exports the complete ticket in a predictable Markdown shape', () => {
    expect(formatTicket(valid)).toBe(`# Checkout does not open

## Environment
Chrome 128, Windows 11

## Steps to reproduce
1. Open cart
2. Click checkout

## Expected result
Payment page opens

## Actual result
Cart remains open

## Frequency
Every time

## User impact
Customers cannot pay
`)
  })

  it('escapes Markdown syntax without introducing inferred information', () => {
    const output = formatTicket({ ...valid, summary: '<script> *bug*', actual: 'Error\n# unknown', attachments: ['[screen].png'] })
    expect(output).toContain('# \\<script\\> \\*bug\\*')
    expect(output).toContain('Error  \n\\# unknown')
    expect(output).toContain('- \\[screen\\]\\.png')
    expect(output).toContain('Filenames only. Attach these files separately')
    expect(formatTicket(valid)).not.toContain('Attachment references')
    expect(output).not.toContain('Priority')
  })
})
