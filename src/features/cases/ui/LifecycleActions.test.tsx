import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mswServer'
import { createQueryWrapper } from '../../../test/queryWrapper'
import type { Case } from '@shared/types/domain'
import { LifecycleActions } from './LifecycleActions'

const CASE: Case = { id: 'c1', organizationId: 'org1', status: 'OPEN' }

function renderActions(caseData: Case = CASE) {
  const { Wrapper } = createQueryWrapper()
  return render(<LifecycleActions caseData={caseData} />, { wrapper: Wrapper })
}

describe('LifecycleActions', () => {
  it('starts review and reflects the new status', async () => {
    server.use(
      http.post('/api/v1/cases/c1/start-review', () => HttpResponse.json({ ...CASE, status: 'IN_REVIEW' })),
    )
    renderActions()
    await userEvent.click(screen.getByRole('button', { name: 'Start review' }))
    await screen.findByRole('button', { name: 'Start review' })
  })

  it('resolves with a reason', async () => {
    let capturedBody: unknown
    server.use(
      http.post('/api/v1/cases/c1/resolve', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...CASE, status: 'RESOLVED' })
      }),
    )
    renderActions()
    await userEvent.type(screen.getByLabelText('Reason (for resolve/archive)'), 'confirmed fraud')
    await userEvent.click(screen.getByRole('button', { name: 'Resolve' }))
    await screen.findByRole('button', { name: 'Resolve' })
    expect(capturedBody).toEqual({ reason: 'confirmed fraud' })
  })

  it('reassigns to the given assignee id', async () => {
    let capturedBody: unknown
    server.use(
      http.post('/api/v1/cases/c1/reassign', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...CASE, assignedTo: 'user-2' })
      }),
    )
    renderActions()
    await userEvent.type(screen.getByLabelText('Reassign to (user id)'), 'user-2')
    await userEvent.click(screen.getByRole('button', { name: 'Reassign' }))
    await screen.findByRole('button', { name: 'Reassign' })
    expect(capturedBody).toEqual({ assigneeId: 'user-2' })
  })

  it('resolve/archive are disabled without a reason', () => {
    renderActions()
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled()
  })
})
