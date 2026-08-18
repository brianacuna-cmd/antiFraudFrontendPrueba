import { NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { SettingsGate } from './SettingsGate'
import { SettingsScreen } from '@features/settings/ui/SettingsScreen'
import { FraudConfigScreen } from '@features/fraud-config/ui/FraudConfigScreen'
import { RulesListScreen } from '@features/rules/ui/RulesListScreen'
import { RuleDetailScreen } from '@features/rules/ui/RuleDetailScreen'
import { RuleEditorContainer } from '@features/rules/ui/RuleEditorContainer'
import { IngestorScreen } from '@features/ingestor/ui/IngestorScreen'
import { CasesListScreen } from '@features/cases/ui/CasesListScreen'
import { CaseDetailScreen } from '@features/cases/ui/CaseDetailScreen'

function RulesListRoute() {
  const navigate = useNavigate()
  return <RulesListScreen onSelectRule={(id) => navigate(`/rules/${id}`)} />
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
  return (
    <RuleEditorContainer
      initialName={ruleId ? `Copy of ${ruleId}` : undefined}
      onCreated={(newId) => navigate(`/rules/${newId}`)}
    />
  )
}

function NewRuleRoute() {
  const navigate = useNavigate()
  return <RuleEditorContainer onCreated={(newId) => navigate(`/rules/${newId}`)} />
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
    <nav aria-label="Main navigation">
      <NavLink to="/settings">Settings</NavLink>
      <NavLink to="/config">Fraud Config</NavLink>
      <NavLink to="/rules">Rules</NavLink>
      <NavLink to="/ingestor">Ingestor</NavLink>
      <NavLink to="/cases">Cases</NavLink>
    </nav>
  )
}

export function AppRouter() {
  return (
    <>
      <Nav />
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
    </>
  )
}
