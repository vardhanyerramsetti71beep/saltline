export type LeadId = 'ines' | 'dov'
export type CarId = 'sandpiper' | 'merle' | 'ostler'
export type StripeId = 'none' | 'rally' | 'twin'
export type SecretId = 'lamp' | 'deadair' | 'ghost' | 'island' | 'cq' | 'ferry'

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
    perkText: 'Pulls in radio valves from twice as far away.',
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

export const REGIONS = [
  {
    id: 'sable', name: 'Port Sable', from: 0, to: 180, hour: '21:00', weather: 'Rain, low cloud',
    blurb: 'A harbour city going under one street at a time. The cranes still work. Nobody is sure who for.',
    watch: 'Container trucks running the evacuation lanes',
    banter: { ines: 'Rain on the causeway. Keep it smooth and stay off the paint.', dov: 'Wipers are decorative. Good luck.' },
  },
  {
    id: 'flats', name: 'The Glass Flats', from: 180, to: 385, hour: '23:15', weather: 'Clear, strange light',
    blurb: 'A hundred and fifty kilometres of dry sea bed, white as paper. The heat stays long after dark and the road plays tricks.',
    watch: 'Mirages, and one toll booth that should not be there',
    banter: { ines: 'Flat for 150 kilometres. Trust the notes, not your eyes.', dov: 'Salt in the bearings. I can hear it.' },
  },
  {
    id: 'pines', name: 'Ember Pines', from: 385, to: 470, hour: '02:50', weather: 'Smoke, falling embers',
    blurb: 'The forest has been burning for nine days. The road is the only gap in it and the Authority knows that.',
    watch: 'Roadblocks at every narrow',
    banter: { ines: 'Smoke ahead. Roadblocks after it. Pick a gap and commit.', dov: 'If the paint blisters, that’s just character.' },
  },
  {
    id: 'cape', name: 'Cape Lantern', from: 470, to: 580, hour: '05:20', weather: 'Sea fog, stars above it',
    blurb: 'The end of Route 9. One lighthouse, one ramp, one ferry with its engines already running.',
    watch: 'No street lights past the ridge',
    banter: { ines: 'I can see the lamp. Don’t you dare slow down.', dov: 'Nineteen years I worked that ramp. Hold on.' },
  },
]

export const CARS = {
  sandpiper: { id: 'sandpiper' as const, name: 'Harlow Sandpiper', kind: 'Rally wagon', year: 1974, top: 212, grip: 1, tank: 1.12, tough: 0.58, note: 'Carries the transmitter, the spares and most of the argument.' },
  merle: { id: 'merle' as const, name: 'Corvane Merle', kind: 'Grand tourer', year: 1971, top: 250, grip: 0.86, tank: 0.9, tough: 0.42, note: 'Very fast. Very thirsty. Very sure of itself.' },
  ostler: { id: 'ostler' as const, name: 'Ostler Twelve', kind: 'Ferry-yard pickup', year: 1968, top: 183, grip: 0.92, tank: 1.36, tough: 0.74, note: 'Has already hit everything you are about to hit.' },
}

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

export const SECRETS: { id: SecretId; name: string; hint: string; found: string }[] = [
  { id: 'lamp', name: 'The Keeper’s Lamp', hint: 'The lamp on the cover answers three knocks.', found: 'Someone at Cape Lantern knocked back.' },
  { id: 'deadair', name: 'Dead Air', hint: 'Someone is reading numbers just below the first station.', found: 'The numbers repeat every eleven minutes.' },
  { id: 'ghost', name: 'The Ghost Toll', hint: 'Keep far right on the Flats around km 290.', found: 'You paid. You do not remember paying.' },
  { id: 'island', name: 'Kilometre 650', hint: 'The atlas has an island nobody named.', found: 'Route 9 was never supposed to end at the Cape.' },
  { id: 'cq', name: 'Calling All Stations', hint: 'Two letters, twice. Every radio operator knows them.', found: 'Somebody out there answered.' },
  { id: 'ferry', name: 'The Last Ferry', hint: 'Reach Cape Lantern before your three lives run out.', found: 'The ramp came up behind you.' },
]

export const CHEATS = [
  { code: 'CQCQ', name: 'Calling all stations', hint: 'Two letters, twice.' },
  { code: 'LOWTIDE', name: 'Bottomless tank', hint: 'When the water goes out.' },
  { code: 'NIGHTSHIFT', name: 'Night print', hint: 'Who works while you sleep?' },
  { code: 'BLUEPRINT', name: 'Draughtsman’s view', hint: 'What the car looked like first.' },
  { code: 'MOONMETAL', name: 'Secret paint', hint: 'The seventh colour has a name.' },
  { code: 'HONKHONK', name: 'Everything honks', hint: 'Say it like the horn does.' },
]

export function rankFor(km: number, secrets: number, finished: boolean) {
  if (finished && secrets === 6) return 'Saltline Legend'
  if (finished) return 'Last Ferry Runner'
  if (km >= 385) return 'Fire Line Driver'
  if (km >= 180) return 'Flats Courier'
  if (km > 0) return 'Causeway Rookie'
  return 'Unlicensed Passenger'
}
