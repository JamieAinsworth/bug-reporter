export const frequencies = ['Every time', 'Often', 'Sometimes', 'Once', 'Not yet known'] as const

export interface BugDraft {
  summary: string
  environment: string
  steps: string
  expected: string
  actual: string
  frequency: string
  impact: string
  attachments: string[]
}

export const emptyDraft: BugDraft = {
  summary: '', environment: '', steps: '', expected: '', actual: '',
  frequency: '', impact: '', attachments: [],
}

export const requiredFields = ['summary', 'environment', 'steps', 'expected', 'actual', 'frequency', 'impact'] as const
export type FieldErrors = Partial<Record<typeof requiredFields[number], string>>

export function getSteps(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim().replace(/^\d+[.)](?:\s+|$)/, '').trim()).filter(Boolean)
}

export function validateDraft(draft: BugDraft): FieldErrors {
  const errors: FieldErrors = {}
  const labels = {
    summary: 'a short bug summary', environment: 'the environment you tested',
    steps: 'at least one step to reproduce', expected: 'the expected result',
    actual: 'the actual result', frequency: 'how often this happens', impact: 'the user impact',
  }
  for (const field of requiredFields) {
    if (!draft[field].trim()) errors[field] = `Please provide ${labels[field]}.`
  }
  if (draft.summary.trim().length > 255) errors.summary = 'Keep the summary to 255 characters or fewer.'
  if (!getSteps(draft.steps).length) errors.steps = 'Please provide at least one step to reproduce.'
  if (draft.frequency && !frequencies.some((value) => value === draft.frequency)) {
    errors.frequency = 'Please select a listed frequency.'
  }
  return errors
}

function escapeMarkdown(value: string): string {
  return value.trim().replace(/\r\n/g, '\n').replace(/([\\`*_{}[\]()<>#+\-.!|~])/g, '\\$1')
}

function paragraph(value: string): string {
  return escapeMarkdown(value).replace(/\n/g, '  \n')
}

export function formatTicket(draft: BugDraft): string {
  const sections = [
    `# ${escapeMarkdown(draft.summary)}`,
    `## Environment\n${paragraph(draft.environment)}`,
    `## Steps to reproduce\n${getSteps(draft.steps).map((step, index) => `${index + 1}. ${escapeMarkdown(step)}`).join('\n')}`,
    `## Expected result\n${paragraph(draft.expected)}`,
    `## Actual result\n${paragraph(draft.actual)}`,
    `## Frequency\n${escapeMarkdown(draft.frequency)}`,
    `## User impact\n${paragraph(draft.impact)}`,
  ]
  if (draft.attachments.length) {
    sections.push(`## Attachment references\nFilenames only. Attach these files separately in your issue tracker.\n\n${draft.attachments.map((name) => `- ${escapeMarkdown(name).replace(/\n/g, ' ')}`).join('\n')}`)
  }
  return `${sections.join('\n\n')}\n`
}
