// Reference data for the Cryptid Field Office seed: regions, subjects, witnesses.
// Tone: deadpan bureau. The humour lives in the bureaucracy, never in anyone's belief.
// All secret societies are invented. No real groups or real named people appear.

export type Category = 'cryptid' | 'ufo' | 'extraterrestrial' | 'ghost' | 'spirit' | 'occult'

export interface SeedRegion {
  key: string
  name: string
  country: string
  restricted: boolean
  lat: number
  lng: number
}

export const REGIONS: SeedRegion[] = [
  {key: 'area51', name: 'Groom Lake (Area 51), Nevada', country: 'United States', restricted: true, lat: 37.235, lng: -115.8111},
  {key: 'rachel-nv', name: 'Rachel, Nevada', country: 'United States', restricted: false, lat: 37.6447, lng: -115.7433},
  {key: 'roswell-nm', name: 'Roswell, New Mexico', country: 'United States', restricted: false, lat: 33.3943, lng: -104.523},
  {key: 'sedona-az', name: 'Sedona, Arizona', country: 'United States', restricted: false, lat: 34.8697, lng: -111.761},
  {key: 'point-pleasant-wv', name: 'Point Pleasant, West Virginia', country: 'United States', restricted: false, lat: 38.8443, lng: -82.1379},
  {key: 'pine-barrens-nj', name: 'Pine Barrens, New Jersey', country: 'United States', restricted: false, lat: 39.75, lng: -74.5},
  {key: 'olympic-wa', name: 'Olympic Peninsula, Washington', country: 'United States', restricted: false, lat: 47.8021, lng: -123.6044},
  {key: 'loch-ness-uk', name: 'Loch Ness, Highlands', country: 'United Kingdom', restricted: false, lat: 57.3229, lng: -4.4244},
  {key: 'everglades-fl', name: 'Big Cypress, Florida', country: 'United States', restricted: false, lat: 25.9, lng: -81.0},
  {key: 'puerto-rico', name: 'Central Puerto Rico', country: 'United States', restricted: false, lat: 18.2208, lng: -66.5901},
  {key: 'edinburgh-uk', name: 'Old Town, Edinburgh', country: 'United Kingdom', restricted: false, lat: 55.9486, lng: -3.19},
  {key: 'new-orleans-la', name: 'New Orleans, Louisiana', country: 'United States', restricted: false, lat: 29.9584, lng: -90.0644},
  {key: 'salem-ma', name: 'Salem, Massachusetts', country: 'United States', restricted: false, lat: 42.5195, lng: -70.8967},
  {key: 'cairo-eg', name: 'Cairo', country: 'Egypt', restricted: false, lat: 30.0444, lng: 31.2357},
  {key: 'istanbul-tr', name: 'Istanbul', country: 'Turkey', restricted: false, lat: 41.0082, lng: 28.9784},
  {key: 'providence-ri', name: 'Providence, Rhode Island', country: 'United States', restricted: false, lat: 41.824, lng: -71.4128},
  {key: 'washington-dc', name: 'Washington, D.C.', country: 'United States', restricted: false, lat: 38.9072, lng: -77.0369},
]

export interface SeedSubject {
  slug: string
  name: string
  codename: string
  category: Category
  summary: string
  description: string[]
  traits: string[]
  habitat: string[]
  size?: [number, number]
  firstRecorded?: number
  threat: 1 | 2 | 3 | 4 | 5
}

export const SUBJECTS: SeedSubject[] = [
  {
    slug: 'sasquatch', name: 'Sasquatch', codename: 'SUBJECT-BF', category: 'cryptid',
    summary: 'Large bipedal primate reported across North American forest regions. Prefers not to be photographed and is remarkably consistent about it.',
    description: [
      'Reported height 2.1 to 2.7 metres, heavy build, dark hair. Witnesses describe an unhurried gait and a strong odour. Footprint casts cluster between 38 and 46 centimetres.',
      'The Bureau notes that the subject is reported in every region with dense forest and poor mobile coverage.',
    ],
    traits: ['bipedal', 'dark hair', 'strong odour', 'unhurried gait'], habitat: ['temperate rainforest', 'mountain forest'],
    size: [210, 270], firstRecorded: 1958, threat: 2,
  },
  {
    slug: 'mothman', name: 'Mothman', codename: 'SUBJECT-MM', category: 'cryptid',
    summary: 'Winged humanoid with reflective red eyes, reported near industrial sites and bridges. Associated with a general feeling that something is about to happen.',
    description: [
      'Reported wingspan approaching three metres. Witnesses consistently mention the eyes, which reflect vehicle headlights. Sightings tend to precede or follow periods of local anxiety.',
      'The Bureau records the association without drawing a conclusion from it.',
    ],
    traits: ['winged', 'red reflective eyes', 'silent flight'], habitat: ['river valleys', 'disused industrial sites'],
    size: [180, 240], firstRecorded: 1966, threat: 3,
  },
  {
    slug: 'jersey-devil', name: 'Jersey Devil', codename: 'SUBJECT-JD', category: 'cryptid',
    summary: 'Hooved, winged creature of the Pine Barrens with a documented reputation that predates the state highway network.',
    description: [
      'Described variously as horse-headed, bat-winged and forked-tailed. Its scream is the most frequently reported feature and is often confused with the equally alarming sound of a fox.',
    ],
    traits: ['hooves', 'wings', 'piercing scream'], habitat: ['pine forest', 'cedar swamp'],
    size: [90, 180], firstRecorded: 1735, threat: 3,
  },
  {
    slug: 'chupacabra', name: 'Chupacabra', codename: 'SUBJECT-CH', category: 'cryptid',
    summary: 'Reported livestock predator. Physical descriptions vary between spined reptile and hairless canine, which the Bureau considers a data-quality problem.',
    description: [
      'Reports concentrate on rural livestock losses. Recovered specimens have so far been identified by veterinary staff as coyotes with advanced mange. The Bureau keeps the file open on procedural grounds.',
    ],
    traits: ['hairless skin', 'spines', 'livestock loss'], habitat: ['farmland', 'scrub'],
    size: [70, 130], firstRecorded: 1995, threat: 2,
  },
  {
    slug: 'loch-ness-monster', name: 'Loch Ness Monster', codename: 'SUBJECT-LN', category: 'cryptid',
    summary: 'Large aquatic animal reported in a Scottish freshwater loch. Photographs are plentiful and, in the Bureau’s view, uniformly unhelpful.',
    description: [
      'Reported length 6 to 15 metres, humped back, long neck. Most sightings occur in calm conditions at a distance greater than 300 metres, which is when a log is most convincing.',
    ],
    traits: ['long neck', 'humped back', 'wake without a boat'], habitat: ['deep freshwater loch'],
    size: [600, 1500], firstRecorded: 565, threat: 1,
  },
  {
    slug: 'skunk-ape', name: 'Skunk Ape', codename: 'SUBJECT-SA', category: 'cryptid',
    summary: 'Swamp-dwelling primate reported in the American south-east. Identified chiefly by its smell, which witnesses describe with unusual precision.',
    description: [
      'Reported height 1.8 to 2.3 metres, reddish-brown hair. The odour is described as sulphurous and is reported to arrive before the subject does.',
    ],
    traits: ['sulphurous odour', 'reddish hair', 'wades'], habitat: ['cypress swamp', 'wetland'],
    size: [180, 230], firstRecorded: 1966, threat: 2,
  },
  {
    slug: 'silent-triangle', name: 'Silent Triangle', codename: 'SUBJECT-TR', category: 'ufo',
    summary: 'Large dark triangular craft, three lights at the corners, no engine noise. Typically reported moving slowly at low altitude.',
    description: [
      'Reported span 30 to 200 metres. Witnesses stress the absence of sound and the way the craft blots out stars rather than reflecting light.',
      'The Bureau notes that the shape is commonly explained by aircraft in formation, and commonly not accepted as an explanation by the person who saw it.',
    ],
    traits: ['triangular', 'three corner lights', 'silent', 'low altitude'], habitat: ['open desert', 'highway corridors'],
    size: [3000, 20000], firstRecorded: 1989, threat: 3,
  },
  {
    slug: 'tic-tac-object', name: 'Tic-Tac Object', codename: 'SUBJECT-TT', category: 'ufo',
    summary: 'Smooth white capsule-shaped object with no visible wings, rotors or exhaust. Reported to accelerate in ways aircraft do not.',
    description: [
      'Reported length 12 metres, uniformly white, no visible control surfaces. Reports come mostly from trained observers, which the Bureau finds both reassuring and unhelpful.',
    ],
    traits: ['capsule shape', 'white', 'no exhaust', 'abrupt acceleration'], habitat: ['restricted airspace', 'open ocean'],
    size: [1200, 1200], firstRecorded: 2004, threat: 3,
  },
  {
    slug: 'classic-disc', name: 'Classic Disc', codename: 'SUBJECT-DS', category: 'ufo',
    summary: 'Saucer-shaped metallic object. The shape that started the filing system.',
    description: [
      'Reported diameter 10 to 40 metres. Metallic finish, occasional rim lights, often a wobble. In practice, most discs on file are weather balloons, lenticular clouds or lens flare, and the Bureau says so cheerfully.',
    ],
    traits: ['disc shape', 'metallic', 'rim lights', 'wobble'], habitat: ['high desert', 'open sky'],
    size: [1000, 4000], firstRecorded: 1947, threat: 2,
  },
  {
    slug: 'luminous-orb-cluster', name: 'Luminous Orb Cluster', codename: 'SUBJECT-OR', category: 'ufo',
    summary: 'Group of glowing lights moving in formation. Frequently a satellite train. Occasionally not.',
    description: [
      'Reported as a line or cluster of 5 to 60 lights moving at constant speed on a straight path. Since the launch of satellite constellations the Bureau receives a wave of these after every deployment and tries to keep an open mind about the remainder.',
    ],
    traits: ['multiple lights', 'formation', 'constant speed'], habitat: ['night sky'],
    size: [50, 500], firstRecorded: 1951, threat: 1,
  },
  {
    slug: 'grey-humanoid', name: 'Grey Humanoid', codename: 'SUBJECT-GR', category: 'extraterrestrial',
    summary: 'Small grey-skinned humanoid with large dark eyes. The most frequently reported non-human figure in the Bureau’s files.',
    description: [
      'Reported height 1.0 to 1.4 metres, large head, large dark eyes, thin limbs. The description has been stable for decades, which the Bureau notes is either evidence or a very durable illustration.',
    ],
    traits: ['grey skin', 'large dark eyes', 'small stature'], habitat: ['near craft sightings', 'remote rural properties'],
    size: [100, 140], firstRecorded: 1961, threat: 3,
  },
  {
    slug: 'nordic-humanoid', name: 'Nordic Humanoid', codename: 'SUBJECT-NH', category: 'extraterrestrial',
    summary: 'Tall, fair-haired humanoid described as calm and human-like. Reports are rare and unusually polite.',
    description: [
      'Reported height 1.9 to 2.2 metres, pale complexion, long hair. Witnesses often describe being reassured. The Bureau treats reassurance from an unidentified being as a data point, not a comfort.',
    ],
    traits: ['tall', 'fair hair', 'calm demeanour'], habitat: ['remote high ground'],
    size: [190, 220], firstRecorded: 1952, threat: 2,
  },
  {
    slug: 'mantis-type-humanoid', name: 'Mantis-type Humanoid', codename: 'SUBJECT-MT', category: 'extraterrestrial',
    summary: 'Tall, thin, insectoid figure with a triangular head. Reported at night, generally in the corner of a room or the edge of a headlight beam.',
    description: [
      'Reported height 1.8 to 2.4 metres, elongated limbs, triangular head, motionless posture. Witnesses report a sense of being observed rather than approached.',
    ],
    traits: ['insectoid', 'elongated limbs', 'motionless'], habitat: ['roadsides at night', 'bedrooms'],
    size: [180, 240], firstRecorded: 1970, threat: 4,
  },
  {
    slug: 'grey-lady', name: 'Grey Lady', codename: 'SUBJECT-GL', category: 'ghost',
    summary: 'Translucent female figure in period dress, reported in old buildings, generally on staircases and generally at the end of a shift.',
    description: [
      'Reported in historic buildings worldwide. Usually silent, usually alone, usually gone before a phone can be located. Accounts are sympathetic in tone and the Bureau records them in the same spirit.',
    ],
    traits: ['period dress', 'translucent', 'staircases'], habitat: ['historic buildings', 'vaults and cellars'],
    size: [150, 175], firstRecorded: 1700, threat: 1,
  },
  {
    slug: 'shadow-figure', name: 'Shadow Figure', codename: 'SUBJECT-SF', category: 'ghost',
    summary: 'Dark human-shaped silhouette seen at the edge of vision, typically at night, typically in a doorway.',
    description: [
      'Reported height 1.7 to 2.1 metres, no features, darker than the surrounding dark. It is reported to withdraw when looked at directly, which makes it difficult to file a description and easy to file a complaint.',
    ],
    traits: ['silhouette', 'no features', 'peripheral vision'], habitat: ['doorways', 'landings', 'bedrooms'],
    size: [170, 210], firstRecorded: 1800, threat: 2,
  },
  {
    slug: 'poltergeist', name: 'Poltergeist', codename: 'SUBJECT-PG', category: 'ghost',
    summary: 'Disturbance phenomenon: knocking, moving objects, doors. Frequently traced to plumbing, settlement or a very determined teenager.',
    description: [
      'Reports centre on a household and a period of weeks. Cases with an identified mundane cause are common. The Bureau keeps them on file as evidence of how much a house can do on its own.',
    ],
    traits: ['knocking', 'moving objects', 'household focus'], habitat: ['family homes', 'older buildings'],
    firstRecorded: 1600, threat: 2,
  },
  {
    slug: 'jinn', name: 'Jinn (reported presence)', codename: 'SUBJECT-JN', category: 'spirit',
    summary: 'Beings described in Islamic tradition. The Bureau takes no position on matters of faith and records only what witnesses report.',
    description: [
      'Jinn are described in the Quran and in Islamic tradition as beings created from smokeless fire. Many families hold this belief as a matter of faith and do not regard an account of a presence as a curiosity.',
      'The Bureau records circumstances as reported, will not characterise any account as mistaken, and does not offer explanations of belief. Any observable factors noted on a file (noise, air movement, building conditions) are recorded for completeness and are never offered in place of a family’s understanding.',
    ],
    traits: ['reported as a presence', 'knocking or voices', 'described in Islamic tradition'], habitat: ['homes', 'empty rooms', 'ruins'],
    firstRecorded: 610, threat: 1,
  },
  {
    slug: 'wandering-spirit', name: 'Wandering Spirit', codename: 'SUBJECT-WS', category: 'spirit',
    summary: 'Reported presence without a fixed form: warmth, a sense of company, a change in the air. Usually described as gentle.',
    description: [
      'Reports are typically brief and typically calm. Witnesses describe warmth, a scent, or the sense of being accompanied. Many families and traditions understand these experiences in their own terms, and the Bureau records them in the witness’s own words.',
    ],
    traits: ['warmth', 'a sense of company', 'gentle'], habitat: ['family homes', 'guest rooms', 'gardens'],
    firstRecorded: 1500, threat: 1,
  },
  {
    slug: 'secret-society-activity', name: 'Secret Society Activity', codename: 'SUBJECT-SS', category: 'occult',
    summary: 'Organised private gatherings of unclear purpose. All societies on file are invented. The paperwork, unfortunately, is very real.',
    description: [
      'Reports concern coordinated gatherings, unlisted premises, and membership records that are difficult to obtain. The Bureau’s files contain only fictional societies and the Bureau makes no claim about any real organisation.',
    ],
    traits: ['unlisted premises', 'coordinated gathering', 'membership records'], habitat: ['lodge halls', 'private clubs', 'basements'],
    firstRecorded: 1717, threat: 2,
  },
  {
    slug: 'ritual-site-activity', name: 'Ritual Site Activity', codename: 'SUBJECT-RS', category: 'occult',
    summary: 'Circles, candles, symbols and other arrangements found at a site with no obvious explanation. Frequently explained. Occasionally not.',
    description: [
      'Reports describe arrangements of candles, salt, stones or markings. A large share resolve to gatherings, art projects or land-use permits. The Bureau records the arrangement, not any belief behind it.',
    ],
    traits: ['candles', 'markings', 'arranged objects'], habitat: ['clearings', 'crossroads', 'disused buildings'],
    firstRecorded: 1692, threat: 2,
  },
]

export interface SeedWitness {
  code: string // 4 hex chars, uppercase
}

export const WITNESSES: SeedWitness[] = [
  '4F2A', '9C1D', 'B07E', '61A8', 'D3F0', '2E9B', '7A44', 'C5D2',
  '18FE', 'A9C3', 'E60B', '53D7', '8B1A', 'F2E4', '3C68', 'D90F',
].map((code) => ({code}))
