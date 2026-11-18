import { CAR_SIDE, INK, MUSTARD, PAPER, RED, TEAL, rng } from './art'
import { CARS, LEADS, PAINTS, rankFor, type CarId, type LeadId } from './content'

export type CardData = { callsign: string; lead: LeadId; car: CarId; paint: string; miles: number; valves: number; secrets: number; finished: boolean }

const DISPLAY = '"Big Shoulders Display", Impact, sans-serif'
const MONO = '"Overpass Mono", monospace'

export async function drawCard(canvas: HTMLCanvasElement, d: CardData) {
  await Promise.allSettled([document.fonts.load(`900 120px "Big Shoulders Display"`), document.fonts.load(`600 30px "Overpass Mono"`)])
  const W = 1080
  const H = 1350
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')!
  const accent = d.lead === 'ines' ? RED : TEAL
  const paint = PAINTS.find((p) => p.id === d.paint) ?? PAINTS[0]

  g.fillStyle = PAPER
  g.fillRect(0, 0, W, H)

  // The scene: sun, sea, road.
  const top = 150
  const sceneH = 560
  g.save()
  g.beginPath()
  g.rect(50, top, W - 100, sceneH)
  g.clip()
  g.fillStyle = '#f0c95f'
  g.fillRect(50, top, W - 100, sceneH)
  const r = rng(d.callsign.length + 7)
  g.fillStyle = PAPER
  for (let i = 0; i < 42; i++) g.fillRect(50 + r() * (W - 100), top + r() * 170, 3, 3)
  g.fillStyle = accent
  g.beginPath()
  g.arc(W / 2, top + 290, 210, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = TEAL
  g.fillRect(50, top + 340, W - 100, 22)
  g.fillStyle = INK
  g.fillRect(50, top + 362, W - 100, sceneH)
  g.fillStyle = '#242b42'
  g.beginPath()
  g.moveTo(W / 2, top + 362)
  g.lineTo(W + 80, top + sceneH)
  g.lineTo(-80, top + sceneH)
  g.fill()
  g.fillStyle = MUSTARD
  for (const [y, h, w] of [[376, 10, 3], [400, 18, 6], [438, 28, 10]]) g.fillRect(W / 2 - w / 2, top + y, w, h)

  // The player's car, in the paint they chose.
  const side = CAR_SIDE[d.car]
  g.translate(W / 2 - 380, top + 300)
  g.scale(3.2, 3.2)
  g.fillStyle = paint.hex
  g.strokeStyle = INK
  g.lineWidth = 3
  g.lineJoin = 'round'
  const body = new Path2D(side.body)
  g.fill(body)
  g.stroke(body)
  g.fillStyle = INK
  g.fill(new Path2D(side.glass))
  for (const [x, y] of side.wheels) {
    g.fillStyle = INK
    g.beginPath()
    g.arc(x, y, side.r, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = PAPER
    g.beginPath()
    g.arc(x, y, side.r * 0.42, 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
  g.strokeStyle = INK
  g.lineWidth = 6
  g.strokeRect(50, top, W - 100, sceneH)

  // Masthead.
  g.fillStyle = INK
  g.font = `900 104px ${DISPLAY}`
  g.textBaseline = 'alphabetic'
  g.fillText('SALTLINE', 50, 122)
  g.font = `600 26px ${MONO}`
  g.textAlign = 'right'
  g.fillText('ROUTE 9 DRIVER’S CARD', W - 50, 76)
  g.fillStyle = accent
  g.fillText(`NO. ${String(d.valves * 7 + d.miles + 1000).padStart(5, '0')}`, W - 50, 116)
  g.textAlign = 'left'

  // Callsign.
  const name = (d.callsign.trim() || 'NIGHT DRIVER').toUpperCase()
  let size = 150
  g.font = `900 ${size}px ${DISPLAY}`
  while (g.measureText(name).width > W - 100 && size > 60) {
    size -= 6
    g.font = `900 ${size}px ${DISPLAY}`
  }
  g.fillStyle = accent
  g.fillText(name, 54, 860 + 4)
  g.fillStyle = INK
  g.fillText(name, 50, 860)

  // Stats.
  const rows: [string, string][] = [
    ['RANK', rankFor(d.miles, d.secrets, d.finished).toUpperCase()],
    ['DRIVER', LEADS[d.lead].name.toUpperCase()],
    ['CAR', CARS[d.car].name.toUpperCase()],
    ['PAINT', paint.name.toUpperCase()],
  ]
  rows.forEach(([k, v], i) => {
    const y = 930 + i * 58
    g.fillStyle = INK
    g.fillRect(50, y + 18, W - 100, 2)
    g.font = `600 24px ${MONO}`
    g.fillText(k, 50, y)
    g.font = `700 42px ${DISPLAY}`
    g.textAlign = 'right'
    g.fillText(v, W - 50, y + 4)
    g.textAlign = 'left'
  })

  const tiles: [string, string][] = [['BEST MILE', String(d.miles)], ['VALVES', String(d.valves)], ['SECRETS', `${d.secrets}/6`]]
  tiles.forEach(([k, v], i) => {
    const x = 50 + i * 250
    g.fillStyle = INK
    g.font = `900 92px ${DISPLAY}`
    g.fillText(v, x, 1262)
    g.font = `600 22px ${MONO}`
    g.fillText(k, x, 1298)
  })

  // Ticket barcode.
  const b = rng(d.miles * 31 + d.valves + 5)
  let x = 806
  g.fillStyle = INK
  while (x < W - 54) {
    const w = 2 + Math.floor(b() * 8)
    g.fillRect(x, 1200, w, 98)
    x += w + 3 + Math.floor(b() * 7)
  }
}

export function cardBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
}
