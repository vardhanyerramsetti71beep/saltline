import { useEffect, useState } from 'react'
import { audio } from '../audio'
import { DAILY_BONUS, tasksFor, untilTomorrow } from '../daily'
import { useGame } from '../store'

export function DailyTasks({ compact = false }: { compact?: boolean }) {
  const daily = useGame((s) => s.daily)
  const claimTask = useGame((s) => s.claimTask)
  const claimBonus = useGame((s) => s.claimBonus)
  const refresh = useGame((s) => s.refreshDaily)
  const [clock, setClock] = useState(untilTomorrow())

  useEffect(() => {
    refresh()
    const t = setInterval(() => {
      refresh()
      setClock(untilTomorrow())
    }, 30000)
    return () => clearInterval(t)
  }, [refresh])

  const tasks = tasksFor(daily.date)
  const done = tasks.filter((t) => (daily.progress[t.id] ?? 0) >= t.target).length
  const allClaimed = tasks.every((t) => daily.claimed.includes(t.id))
  return (
    <div className={`daily ${compact ? 'daily--compact' : ''}`}>
      <div className="daily__head">
        <h3>Daily tasks <b>{done}/3</b></h3>
        <span>New tasks in {clock}</span>
      </div>
      <ol>
        {tasks.map((t) => {
          const got = Math.min(t.target, Math.floor(daily.progress[t.id] ?? 0))
          const ready = got >= t.target
          const claimed = daily.claimed.includes(t.id)
          return (
            <li key={t.id} className={claimed ? 'claimed' : ready ? 'ready' : ''}>
              <div className="daily__text">
                <strong>{t.text}</strong>
                <i aria-hidden="true"><b style={{ width: `${(got / t.target) * 100}%` }} /></i>
                <small>{got} / {t.target}</small>
              </div>
              <button className="btn" disabled={!ready || claimed} onClick={() => (claimTask(t.id) ? null : audio.fail())} aria-label={claimed ? `${t.text}: reward claimed` : `Claim ${t.reward} coins for: ${t.text}`}>
                {claimed ? 'Claimed' : <><i className="coin" aria-hidden="true" />{t.reward}</>}
              </button>
            </li>
          )
        })}
      </ol>
      <div className={`daily__bonus ${daily.bonus ? 'claimed' : ''}`}>
        <span>Claim all three for a bonus: {DAILY_BONUS} coins and a free special power.</span>
        <button className="btn btn--solid" disabled={!allClaimed || daily.bonus} onClick={() => (claimBonus() ? null : audio.fail())}>
          {daily.bonus ? 'Bonus claimed' : 'Claim bonus'}
        </button>
      </div>
    </div>
  )
}
