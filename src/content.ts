export type LeadId = 'ines' | 'dov'
export type { CarId } from './vehicles'
export type StripeId = 'none' | 'rally' | 'twin'
export type SecretId = string

export const CHAPTERS = [
  { id: 'cover', km: 0, label: 'Cold Start' },
  { id: 'story', km: 34, label: 'The Night' },
  { id: 'crew', km: 103, label: 'The Crew' },
  { id: 'atlas', km: 180, label: 'The Atlas' },
  { id: 'drive', km: 290, label: 'The Drive' },
  { id: 'garage', km: 385, label: 'The Garage' },
  { id: 'radio', km: 485, label: 'The Radio' },
  { id: 'logbook', km: 547, label: 'Logbook' },
  { id: 'finale', km: 580, label: 'Last Ferry' },
] as const

export const NIGHT = [
  { hour: '18:40', place: 'Port Sable', text: 'The sea took the lower town in spring. Tonight the Causeway Authority closes Route 9 for good.' },
  { hour: '21:00', place: 'Harbour Street', text: 'Radio Saltline is the last station telling people which roads are still open. The Authority wants it off the air by morning.' },
  { hour: '23:15', place: 'The Glass Flats', text: 'So Odalys Quill unbolts the transmitter, straps it into a rally wagon, and calls the two drivers who still owe her a favour.' },
  { hour: '02:50', place: 'Ember Pines', text: 'The ridge is burning. The roadblocks are moving. Every kilometre they cover, the signal reaches another town.' },
  { hour: '06:00', place: 'Cape Lantern', text: 'The last ferry leaves at dawn. The signal goes with it, or it does not go at all.' },
]

export const LEADS = {
  ines: {
    id: 'ines' as const,
    name: 'Ines Vale',
    role: 'The Navigator',
    age: 34,
    from: 'Port Sable, lower town',
    bio: 'Three-time Orrin Rally co-driver who can read a road from its pace notes alone. Her house is under eleven feet of water. She has stopped mentioning it.',
    quote: 'Left over crest, don’t lift. I said don’t lift.',
    perk: 'Pace Notes',
    perkText: 'Boosting burns a quarter less fuel.',
  },
  dov: {
    id: 'dov' as const,
    name: 'Dov Marek',
    role: 'The Mechanic',
    age: 41,
    from: 'Ferry yards, Cape Lantern',
    bio: 'Kept the Cape ferries running for nineteen years with wire and bad language. He has never once agreed that a car is finished.',
    quote: 'It’s not broken. It’s negotiating.',
    perk: 'Field Repair',
    perkText: 'Stays protected twice as long after losing a life.',
  },
}

export const CREW = [
  { id: 'quill', name: 'Odalys Quill', role: 'Voice of Radio Saltline', line: 'Forty years on air and she has never read a script she agreed with.' },
  { id: 'pim', name: 'Pim Aster', role: 'Signal kid, age 14', line: 'Built a working receiver from a toaster. Rides in the back seat, against all advice.' },
  { id: 'reyne', name: 'Sgt. Hollis Reyne', role: 'Causeway Authority', line: 'Follows every order to the letter, and is starting to read the letters more closely.' },
  { id: 'toll', name: 'The Tollkeeper', role: 'Nobody is sure', line: 'Seen at a booth on the Flats that was demolished in 1961. Still gives correct change.' },
]

export const PAINTS = [
  { id: 'signal', name: 'Signal Red', hex: '#d63a25' },
  { id: 'salt', name: 'Salt White', hex: '#eee7d8' },
  { id: 'harbour', name: 'Harbour Blue', hex: '#1f4f8f' },
  { id: 'pine', name: 'Pine Green', hex: '#1f5c47' },
  { id: 'mustard', name: 'Causeway Mustard', hex: '#e0a226' },
  { id: 'ink', name: 'Night Ink', hex: '#1b1e29' },
  { id: 'moonmetal', name: 'Moonmetal', hex: '#b9c6d2', secret: true },
]

export const STRIPES: { id: StripeId; name: string }[] = [
  { id: 'none', name: 'Clean' },
  { id: 'rally', name: 'Rally' },
  { id: 'twin', name: 'Twin' },
]

export const STATIONS = [
  { freq: 88.3, call: 'RSL', name: 'Radio Saltline', host: 'Odalys Quill', genre: 'Tape-echo dub', line: 'Road reports on the hour. Opinions the rest of the time.' },
  { freq: 94.7, call: 'KLN', name: 'Lantern FM', host: 'The overnight desk', genre: 'Slow tide ambient', line: 'For the ferry crews, the insomniacs and the sea.' },
  { freq: 101.1, call: 'EMB', name: 'Ember AM', host: 'DJ Nine Days', genre: 'Motor disco', line: 'Broadcasting from inside the fire line until someone stops us.' },
]
export const DEAD_AIR = 87.9

/** Secrets hidden in the page itself. Every level adds six more of its own, found on the road. */
export const PAGE_SECRETS: { id: SecretId; name: string; hint: string; found: string }[] = [
  { id: 'lamp', name: 'The Keeper’s Lamp', hint: 'The lamp on the cover answers three knocks.', found: 'Someone at Cape Lantern knocked back.' },
  { id: 'deadair', name: 'Dead Air', hint: 'Someone is reading numbers just below the first station.', found: 'The numbers repeat every eleven minutes.' },
  { id: 'island', name: 'Kilometre 650', hint: 'The atlas has an island nobody named.', found: 'Route 9 was never supposed to end at the Cape.' },
  { id: 'cq', name: 'Calling All Stations', hint: 'Enter the cheat code CQCQ.', found: 'Somebody out there answered.' },
]

export type Cheat = { code: string; name: string; effect: string; once?: boolean }
export const CHEATS: Cheat[] = [
  { code: 'LOWTIDE', name: 'Bottomless tank', effect: 'Fuel never runs out.' },
  { code: 'IRONHIDE', name: 'Iron hide', effect: 'Crashes slow you down but never cost a life.' },
  { code: 'PAYDAY', name: 'Payday', effect: 'Adds 1,000 coins to your wallet.', once: true },
  { code: 'OPENROAD', name: 'Open road', effect: 'Unlocks every level.', once: true },
  { code: 'BLUEPRINT', name: 'Draughtsman’s view', effect: 'Shows the car and the scenery as wireframes.' },
  { code: 'NIGHTSHIFT', name: 'Night print', effect: 'Turns the whole page to night colours.' },
  { code: 'MOONMETAL', name: 'Secret paint', effect: 'Unlocks the Moonmetal paint in the garage.' },
  { code: 'HONKHONK', name: 'Everything honks', effect: 'Every click and tap sounds the horn.' },
  { code: 'CQCQ', name: 'Calling all stations', effect: 'Finds a page secret.', once: true },
]

const LEVEL_RANKS = ['Last Ferry Runner', 'Frostline Driver', 'Delta Navigator', 'Canyon Champion']

export function rankFor(levelsDone: number[], km: number, secrets: number, totalSecrets: number) {
  if (levelsDone.length === LEVEL_RANKS.length && secrets === totalSecrets) return 'Saltline Legend'
  const top = Math.max(-1, ...levelsDone)
  if (top >= 0) return LEVEL_RANKS[top]
  if (km >= 385) return 'Fire Line Driver'
  if (km >= 180) return 'Flats Courier'
  if (km > 0) return 'Causeway Rookie'
  return 'Unlicensed Passenger'
}
