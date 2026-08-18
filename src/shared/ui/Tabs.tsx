import { useState } from 'react'
import type { ReactNode } from 'react'

export interface TabDef {
  id: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  tabs: TabDef[]
  defaultTabId?: string
}

export function Tabs({ tabs, defaultTabId }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id)
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]
  return (
    <div className="af-tabs">
      <div role="tablist" className="af-tabs__list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active?.id}
            className="af-tabs__tab"
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="af-tabs__panel">{active?.content}</div>
    </div>
  )
}
