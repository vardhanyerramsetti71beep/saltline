import { PAGE_SECRETS } from '../content'
import { LEVELS } from '../levels'
import { useGame } from '../store'

/** Every secret, grouped: the page's own four, then six for each level of the drive. */
export function SecretGroups({ openLevel }: { openLevel?: number }) {
  const secrets = useGame((s) => s.secrets)
  const groups = [
    { id: 'page', title: 'On this page', items: PAGE_SECRETS },
    ...LEVELS.map((l) => ({ id: l.id, title: `Level ${l.n} · ${l.name}`, items: l.secrets })),
  ]
  return (
    <div className="secret-groups">
      {groups.map((g, gi) => {
        const got = g.items.filter((s) => secrets.includes(s.id)).length
        return (
          <details key={g.id} open={gi === 0 || gi - 1 === openLevel}>
            <summary><span>{g.title}</span><b>{got}/{g.items.length}</b></summary>
            <ol>
              {g.items.map((s) => {
                const has = secrets.includes(s.id)
                return (
                  <li key={s.id} className={has ? 'got' : ''}>
                    <strong>{has ? s.name : 'Not found yet'}</strong>
                    <span>{has ? s.found : s.hint}</span>
                  </li>
                )
              })}
            </ol>
          </details>
        )
      })}
    </div>
  )
}
