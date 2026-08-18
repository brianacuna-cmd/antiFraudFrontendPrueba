import { NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { SettingsGate } from './SettingsGate'
import { SettingsScreen } from '@features/settings/ui/SettingsScreen'
import { FraudConfigScreen } from '@features/fraud-config/ui/FraudConfigScreen'
import { RulesListScreen } from '@features/rules/ui/RulesListScreen'
import { RuleDetailScreen } from '@features/rules/ui/RuleDetailScreen'
import { RuleEditorContainer } from '@features/rules/ui/RuleEditorContainer'
import { IngestorScreen } from '@features/ingestor/ui/IngestorScreen'
import { CasesListScreen } from '@features/cases/ui/CasesListScreen'
import { CaseDetailScreen } from '@features/cases/ui/CaseDetailScreen'
import { ErrorBanner } from '@shared/ui'
import { useRuleDetail } from '@features/rules/application/useRules'

function RulesListRoute() {
  const navigate = useNavigate()
  return (
    <RulesListScreen
      onSelectRule={(id) => navigate(`/rules/${id}`)}
      onCreate={() => navigate('/rules/new')}
    />
  )
}

function RuleDetailRoute() {
  const { ruleId } = useParams<{ ruleId: string }>()
  const navigate = useNavigate()
  if (!ruleId) return null
  return <RuleDetailScreen ruleId={ruleId} onEdit={(id) => navigate(`/rules/${id}/edit`)} />
}

function RuleEditRoute() {
  const { ruleId } = useParams<{ ruleId: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useRuleDetail(ruleId)

  if (isLoading) return <p>Loading…</p>
  if (isError || !data) return <ErrorBanner message="Failed to load rule" />

  return (
    <RuleEditorContainer
      draftKey={`edit:${ruleId}`}
      initialName={`Copy of ${data.name}`}
      initialGraph={data.conditions}
      onCreated={(newId) => navigate(`/rules/${newId}`)}
    />
  )
}

function NewRuleRoute() {
  const navigate = useNavigate()
  return <RuleEditorContainer draftKey="new" onCreated={(newId) => navigate(`/rules/${newId}`)} />
}

function CasesListRoute() {
  const navigate = useNavigate()
  return <CasesListScreen onSelectCase={(id) => navigate(`/cases/${id}`)} />
}

function CaseDetailRoute() {
  const { caseId } = useParams<{ caseId: string }>()
  if (!caseId) return null
  return <CaseDetailScreen caseId={caseId} />
}

function Nav() {
  return (
    <nav aria-label="Main navigation" className="af-nav">
      <NavLink to="/settings">Settings</NavLink>
      <NavLink to="/config">Fraud Config</NavLink>
      <NavLink to="/rules">Rules</NavLink>
      <NavLink to="/ingestor">Ingestor</NavLink>
      <NavLink to="/cases">Cases</NavLink>
    </nav>
  )
}

function pageMeta(pathname: string): { title: string; hint: string } | null {
  if (pathname === '/settings' || pathname === '/') {
    return {
      title: 'Settings',
      hint: 'Set the trusted-header identity for this session. Both IDs must be 24-character hex strings.',
    }
  }
  if (pathname === '/config') {
    return {
      title: 'Fraud config',
      hint: 'Save SLA windows and risk thresholds for this tenant. Scoring cannot open cases until this exists.',
    }
  }
  if (pathname === '/rules') {
    return {
      title: 'Rules',
      hint: 'Draft a JDM graph, then activate it. Activate is an admin action and will 403 in trusted-header mode.',
    }
  }
  if (pathname === '/rules/new') {
    return {
      title: 'New rule',
      hint: 'Left palette has every node type. Double-click a node to edit it. Simulator previews the riskScore expression.',
    }
  }
  if (/^\/rules\/[^/]+\/edit$/.test(pathname)) {
    return {
      title: 'Edit as new draft',
      hint: 'Saving creates a new INACTIVE rule (there is no update endpoint). Copy starts from the current graph.',
    }
  }
  if (pathname === '/ingestor') {
    return {
      title: 'Ingestor',
      hint: 'Submit a CanonicalRiskEvent to score it, and optionally open a case if the threshold is met.',
    }
  }
  if (pathname === '/cases') {
    return { title: 'Cases', hint: 'Inbox for this organization. Start review, notes, and evidence work here.' }
  }
  return null
}

function PageFrame() {
  const { pathname } = useLocation()
  const meta = pageMeta(pathname)
  const isRuleCanvas =
    pathname === '/rules/new' || /^\/rules\/[^/]+(\/edit)?$/.test(pathname)

  return (
    <section className={isRuleCanvas ? 'af-page af-page--editor' : 'af-page'}>
      {meta ? (
        <header className="af-page__intro">
          <h2>{meta.title}</h2>
          <p>{meta.hint}</p>
        </header>
      ) : null}
      <div className="af-page__body">
        <Routes>
        {/* Settings is intentionally OUTSIDE SettingsGate — a user with no
            identity yet must still be able to reach the screen that lets
            them set one (spec settings-auth: First-time setup). */}
        <Route path="/settings" element={<SettingsScreen />} />
        <Route
          path="/config"
          element={
            <SettingsGate>
              <FraudConfigScreen />
            </SettingsGate>
          }
        />
        <Route
          path="/rules"
          element={
            <SettingsGate>
              <RulesListRoute />
            </SettingsGate>
          }
        />
        <Route
          path="/rules/new"
          element={
            <SettingsGate>
              <NewRuleRoute />
            </SettingsGate>
          }
        />
        <Route
          path="/rules/:ruleId"
          element={
            <SettingsGate>
              <RuleDetailRoute />
            </SettingsGate>
          }
        />
        <Route
          path="/rules/:ruleId/edit"
          element={
            <SettingsGate>
              <RuleEditRoute />
            </SettingsGate>
          }
        />
        <Route
          path="/ingestor"
          element={
            <SettingsGate>
              <IngestorScreen />
            </SettingsGate>
          }
        />
        <Route
          path="/cases"
          element={
            <SettingsGate>
              <CasesListRoute />
            </SettingsGate>
          }
        />
        <Route
          path="/cases/:caseId"
          element={
            <SettingsGate>
              <CaseDetailRoute />
            </SettingsGate>
          }
        />
        <Route path="*" element={<SettingsScreen />} />
      </Routes>
      </div>
    </section>
  )
}

export function AppRouter() {
  return (
    <>
      <Nav />
      <PageFrame />
    </>
  )
}
