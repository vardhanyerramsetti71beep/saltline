import { Poster } from '../art'
import { go, Reveal } from '../hooks'

export function Finale() {
  return (
    <section id="finale" className="finale">
      <div className="finale__art"><Poster region="cape" label={false} /></div>
      <Reveal className="finale__copy">
        <span className="chead__mile"><i>Km</i>580</span>
        <h2>The ramp comes up at six.</h2>
        <p>Somebody has to be on it.</p>
        <button className="btn btn--solid btn--big" onClick={() => go('drive')}>Drive Route 9</button>
      </Reveal>
      <footer className="foot">
        <p className="foot__morse" aria-label="A message in Morse code">−·−· −−·− −·−· −−·−</p>
        <p><strong>SALTLINE is not a real game.</strong> The Free State of Orrin, its people, cars, radio stations and artwork were all invented for this page. Every drawing is generated in code and every sound is synthesized in your browser.</p>
      </footer>
    </section>
  )
}
