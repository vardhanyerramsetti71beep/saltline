import { Portrait } from '../art'
import { CREW, LEADS, type LeadId } from '../content'
import { ChapterHead, Reveal } from '../hooks'
import { useGame } from '../store'

export function Crew() {
  const lead = useGame((s) => s.lead)
  const setLead = useGame((s) => s.setLead)
  return (
    <section id="crew" className="chapter crew">
      <ChapterHead mile={64} title="Two drivers. One seat.">
        Choose who takes the wheel. Your driver changes the colour of this page, the voice on the road and how the run plays.
      </ChapterHead>
      <div className="leads" role="radiogroup" aria-label="Choose your driver">
        {(Object.keys(LEADS) as LeadId[]).map((id) => {
          const l = LEADS[id]
          const on = id === lead
          return (
            <button key={id} className={`lead lead--${id} ${on ? 'on' : ''}`} role="radio" aria-checked={on} onClick={() => setLead(id)}>
              <span className="lead__art"><Portrait who={id} /></span>
              <span className="lead__body">
                <span className="lead__role">{l.role}</span>
                <span className="lead__name">{l.name}</span>
                <span className="lead__more">
                  <span className="lead__quote">“{l.quote}”</span>
                  <span className="lead__bio">{l.bio}</span>
                  <span className="lead__perk"><b>{l.perk}</b> {l.perkText}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="crewlist">
        {CREW.map((c, i) => (
          <Reveal as="article" key={c.id} delay={i * 80} className="crewcard">
            <Portrait who={c.id as 'quill'} />
            <h3>{c.name}</h3>
            <span>{c.role}</span>
            <p>{c.line}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
