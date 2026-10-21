import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { emptyDraft, frequencies, formatTicket, getSteps, requiredFields, validateDraft } from './ticket'
import type { BugDraft, FieldErrors } from './ticket'
import './App.css'

function App() {
  const [draft, setDraft] = useState<BugDraft>({ ...emptyDraft })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [reviewing, setReviewing] = useState(false)
  const [notice, setNotice] = useState('')
  const [exportError, setExportError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const validation = validateDraft(draft)
  const completed = requiredFields.filter((field) => !validation[field]).length
  const markdown = formatTicket(draft)

  function update(field: Exclude<keyof BugDraft, 'attachments'>, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setNotice('')
    setExportError('')
  }

  function focusHeading() {
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }
    setReviewing(true)
    setNotice('')
    setExportError('')
    focusHeading()
  }

  async function copyTicket() {
    setNotice('')
    setExportError('')
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard is unavailable')
      }
      await navigator.clipboard.writeText(markdown)
      setNotice('Ticket copied as Markdown. Paste it into your issue tracker.')
    } catch {
      setExportError('Could not copy to the clipboard. Allow clipboard access, or use Download Markdown instead.')
    }
  }

  function downloadTicket() {
    setNotice('')
    setExportError('')
    let url: string | undefined
    try {
      url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${draft.summary.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'bug-ticket'}.md`
      document.body.append(link)
      link.click()
      link.remove()
      setNotice('Markdown download requested. Attach any evidence files separately.')
    } catch {
      setExportError('Could not download the ticket. Try Copy ticket instead.')
    } finally {
      if (url) {
        const downloadUrl = url
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      }
    }
  }

  function reset() {
    setDraft({ ...emptyDraft })
    setErrors({})
    setReviewing(false)
    setNotice('Draft cleared. You can start a new report.')
    setExportError('')
    setConfirmReset(false)
    if (fileRef.current) fileRef.current.value = ''
    focusHeading()
  }

  function textField(
    field: 'summary' | 'steps' | 'expected' | 'actual' | 'environment' | 'impact',
    label: string,
    hint: string,
    placeholder: string,
    rows = 3,
  ) {
    const attributes = {
      id: field,
      name: field,
      value: draft[field],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field, event.target.value),
      'aria-required': true as const,
      'aria-invalid': Boolean(errors[field]),
      'aria-describedby': `${field}-hint${errors[field] ? ` ${field}-error` : ''}`,
      placeholder,
    }
    return (
      <div className={`field ${errors[field] ? 'has-error' : ''}`}>
        <label htmlFor={field}>{label} <span aria-hidden="true">*</span></label>
        <p className="field-hint" id={`${field}-hint`}>{hint}</p>
        {field === 'summary'
          ? <input {...attributes} maxLength={255} />
          : <textarea {...attributes} rows={rows} />}
        {field === 'summary' && <span className="character-count">{draft.summary.length}/255</span>}
        {errors[field] && <p className="field-error" id={`${field}-error`}>{errors[field]}</p>}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#main"><span className="brand-mark" aria-hidden="true">b<span>.</span></span>bugbrief<span className="brand-dot">.</span></a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <div className="nav-item active"><span aria-hidden="true">+ </span> New bug report <span className="nav-badge">1</span></div>
        <div className="sidebar-section">
          <div className="workspace-label">INTEGRATIONS</div>
          <div className="integration"><span className="jira-icon" aria-hidden="true">J</span> Jira <span className="soon">COMING NEXT</span></div>
          <p>Better reports today.<br />Connected workflows next.</p>
        </div>
        <div className="sidebar-bottom">
          <div className="privacy-icon" aria-hidden="true">B</div>
          <div><strong>Your details stay here</strong><p>No account. No uploads.</p></div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>Workspace <span className="breadcrumb-slash">/</span> <strong>New bug report</strong></div>
          <span className="local-badge"><span /> LOCAL WORKSPACE</span>
        </header>
        <main id="main">
          <div className="page-heading">
            <div><div className="eyebrow">LESS BACK-AND-FORTH. MORE FIXING.</div>
              <h1 ref={headingRef} tabIndex={-1}>{reviewing ? 'A clear report. Ready to go.' : 'Good fixes start with good reports.'}</h1>
              <p>{reviewing ? 'Give it one last read, then take it to your issue tracker.' : 'Turn what went wrong into a ticket your team can act on.'}</p>
            </div>
            <span className="version-badge">THE BUG TICKET HELPER <span>v1.0</span></span>
          </div>

          <ol className="stepper" aria-label="Report progress">
            <li aria-current={!reviewing ? 'step' : undefined} className={!reviewing ? 'current' : 'done'}><span>1</span><div>Describe the bug<small>The details that matter</small></div></li>
            <li className="step-line" aria-hidden="true" />
            <li aria-current={reviewing ? 'step' : undefined} className={reviewing ? 'current' : ''}><span>2</span><div>Review & export<small>A ticket, not a guessing game</small></div></li>
          </ol>

          <div className="content-grid">
            <div>
              {notice && <div className="notice" role="status">{notice}</div>}
              {exportError && <div className="error-banner" role="alert">{exportError}</div>}
              {!reviewing ? (
                <form noValidate onSubmit={review}>
                  <section className="card">
                    <div className="card-heading"><span className="section-icon" aria-hidden="true">01</span><div><h2>The essentials</h2><p>Start with a little context.</p></div><span className="required-note">* Required fields</span></div>
                    {Object.values(errors).some(Boolean) && <div className="error-banner" role="alert">Some details are missing. Check the highlighted fields below.</div>}
                    {textField('summary', 'Bug summary', 'A short, specific description of the problem.', 'e.g. Checkout button does not respond on mobile')}
                    {textField('environment', 'Environment', 'Include the app version, browser, device, or operating system you tested.', 'e.g. Web app v2.4, Chrome 128, iPhone 15 / iOS 18', 2)}
                  </section>
                  <section className="card">
                    <div className="card-heading"><span className="section-icon" aria-hidden="true">02</span><div><h2>What happened?</h2><p>Help someone else see what you see.</p></div></div>
                    {textField('steps', 'Steps to reproduce', 'One action per line, in the order you performed them. Include any preconditions.', 'Open the store on a mobile device\nAdd an item to the cart\nTap the checkout button', 5)}
                    <div className="two-columns">
                      {textField('expected', 'Expected result', 'What should have happened?', 'e.g. The payment page opens.', 4)}
                      {textField('actual', 'Actual result', 'What happened instead? Include exact errors.', 'e.g. Nothing happens; the cart stays open.', 4)}
                    </div>
                  </section>
                  <section className="card">
                    <div className="card-heading"><span className="section-icon" aria-hidden="true">03</span><div><h2>Impact & evidence</h2><p>A little more detail goes a long way.</p></div></div>
                    <div className={`field ${errors.frequency ? 'has-error' : ''}`}>
                      <label htmlFor="frequency">Frequency <span aria-hidden="true">*</span></label>
                      <p className="field-hint" id="frequency-hint">How often have you observed this behavior?</p>
                      <select id="frequency" value={draft.frequency} onChange={(event) => update('frequency', event.target.value)} aria-required="true" aria-invalid={Boolean(errors.frequency)} aria-describedby={`frequency-hint${errors.frequency ? ' frequency-error' : ''}`}>
                        <option value="">Select a frequency</option>
                        {frequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}
                      </select>
                      {errors.frequency && <p className="field-error" id="frequency-error">{errors.frequency}</p>}
                    </div>
                    {textField('impact', 'User impact', 'Who is affected, what is blocked, and is there a workaround? It is okay to say you do not know.', 'e.g. Mobile customers cannot complete purchases. Desktop checkout still works.')}
                    <div className="field">
                      <label htmlFor="attachments">Supporting files <span className="optional">Optional</span></label>
                      <p className="field-hint" id="attachments-hint">Reference screenshots, logs, or recordings. Only filenames are included in the ticket; files are not read, saved, or uploaded.</p>
                      <div className="upload-area"><span className="upload-icon" aria-hidden="true">+</span><strong>Add a little evidence</strong><span>Select files to list in your report</span><input ref={fileRef} id="attachments" type="file" multiple aria-describedby="attachments-hint" onChange={(event) => {
                        const names = Array.from(event.target.files ?? [], (file) => file.name)
                        setDraft((previous) => ({ ...previous, attachments: [...new Set([...previous.attachments, ...names])] }))
                        event.target.value = ''
                      }} /></div>
                      {draft.attachments.length > 0 && <ul className="attachment-list">{draft.attachments.map((name) => <li key={name}><span>{name}</span><button type="button" aria-label={`Remove ${name}`} onClick={() => setDraft((previous) => ({ ...previous, attachments: previous.attachments.filter((file) => file !== name) }))}>Remove</button></li>)}</ul>}
                    </div>
                  </section>
                  <div className="form-footer"><p>Just the facts. We never fill in the blanks for you.</p><button className="primary" type="submit">Review ticket <span aria-hidden="true">&rarr;</span></button></div>
                </form>
              ) : (
                <section className="card review-card" aria-label="Ticket preview">
                  <div className="card-heading"><span className="section-icon" aria-hidden="true">02</span><div><h2>Your ticket preview</h2><p>Exactly your details, neatly organized.</p></div><button className="text-button" onClick={() => { setReviewing(false); setNotice(''); setExportError(''); focusHeading() }}>Edit details</button></div>
                  <div className="ticket-type">BUG REPORT</div>
                  <h2 className="ticket-title">{draft.summary.trim()}</h2>
                  <div className="ticket-meta"><span>Frequency</span><strong>{draft.frequency}</strong></div>
                  <section className="preview-section"><h3>Environment</h3><p>{draft.environment.trim()}</p></section>
                  <section className="preview-section"><h3>Steps to reproduce</h3><ol>{getSteps(draft.steps).map((step, index) => <li key={index}>{step}</li>)}</ol></section>
                  <section className="preview-section"><h3>Expected result</h3><p>{draft.expected.trim()}</p></section>
                  <section className="preview-section"><h3>Actual result</h3><p>{draft.actual.trim()}</p></section>
                  <section className="preview-section"><h3>User impact</h3><p>{draft.impact.trim()}</p></section>
                  {draft.attachments.length > 0 && <section className="preview-section"><h3>Attachment references</h3><ul>{draft.attachments.map((name) => <li key={name}>{name}</li>)}</ul><p className="field-hint">Filenames only. Attach these files separately in your issue tracker.</p></section>}
                  <div className="export-actions"><button className="secondary" onClick={downloadTicket}>Download Markdown</button><button className="primary" onClick={copyTicket}>Copy ticket <span aria-hidden="true">&rarr;</span></button></div>
                  <p className="export-note">Exports a Markdown ticket. No ticket is submitted to Jira.</p>
                </section>
              )}
              <div className="reset-row">
                {confirmReset ? <><span>Discard all report details?</span><button className="danger-button" onClick={reset}>Yes, clear draft</button><button className="text-button" onClick={() => setConfirmReset(false)}>Keep editing</button></> : <button className="text-button muted" onClick={() => setConfirmReset(true)}>Clear draft & start over</button>}
              </div>
            </div>

            <aside className="guidance" aria-label="Report guidance">
              <section className="progress-card">
                <div className="eyebrow">A LITTLE STRUCTURE. A LOT OF CLARITY.</div>
                <h2>Your report, at a glance</h2>
                <div className="completion"><strong>{completed}<span> / {requiredFields.length}</span></strong><span>essentials covered</span></div>
                <progress value={completed} max={requiredFields.length} aria-label="Required details completed" />
                <ul className="checklist">
                  {([['summary', 'A clear summary'], ['environment', 'The right environment'], ['steps', 'Steps someone can follow'], ['expected', 'The expected result'], ['actual', 'The actual result'], ['frequency', 'How often it happens'], ['impact', 'Who it affects']] as const).map(([field, label]) => <li key={field} className={!validation[field] ? 'checked' : ''}><span aria-hidden="true">{!validation[field] ? '\u2713' : '\u00b7'}</span>{label}</li>)}
                </ul>
              </section>
              <section className="tip-card"><span className="tip-spark" aria-hidden="true">*</span><h3>Specific beats perfect.</h3><p>You do not need to know why a bug happens. Describe what you observed, and let the details do the talking.</p><div className="tip-divider" /><strong>A useful summary</strong><p className="example">"Checkout button does not respond on mobile"</p><p className="not-example">Instead of "Checkout is broken"</p></section>
              <div className="privacy-note"><span aria-hidden="true">i</span><p>This draft lives in this tab only. Refreshing or closing it clears your work. Copy or download it before you leave. Do not include passwords or sensitive data.</p></div>
            </aside>
          </div>
          <footer className="page-footer"><span className="footer-brand">bugbrief.</span><span>Better context. Faster fixes.</span><span>Made for the humans behind the bugs.</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
