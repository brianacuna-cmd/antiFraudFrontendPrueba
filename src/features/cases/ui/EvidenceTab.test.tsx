import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import { EvidenceTab } from './EvidenceTab'

function renderTab() {
  const { Wrapper } = createQueryWrapper()
  return render(<EvidenceTab caseId="c1" />, { wrapper: Wrapper })
}

describe('EvidenceTab', () => {
  it('uploads a file via multipart/form-data and reflects success', async () => {
    server.use(
      http.get('/api/v1/cases/c1/evidence', () => HttpResponse.json({ items: [] })),
      http.post('/api/v1/cases/c1/evidence', () =>
        HttpResponse.json({ id: 'e1', caseId: 'c1', fileName: 'evidence.txt' }, { status: 201 }),
      ),
    )
    renderTab()
    const file = new File(['hello'], 'evidence.txt', { type: 'text/plain' })
    const input = screen.getByLabelText('File') as HTMLInputElement
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }))
    expect(await screen.findByText('Evidence uploaded')).toBeInTheDocument()
  })

  it('blocks submit client-side when no file is chosen', async () => {
    server.use(http.get('/api/v1/cases/c1/evidence', () => HttpResponse.json({ items: [] })))
    renderTab()
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }))
    expect(await screen.findByText('Choose a file to upload')).toBeInTheDocument()
  })

  it('lists existing evidence with a download link', async () => {
    server.use(
      http.get('/api/v1/cases/c1/evidence', () =>
        HttpResponse.json({ items: [{ id: 'e1', caseId: 'c1', fileName: 'proof.png' }] }),
      ),
    )
    renderTab()
    expect(await screen.findByText(/proof\.png/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      '/api/v1/evidence/e1/download',
    )
  })
})
