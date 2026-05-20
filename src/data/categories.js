// Niche categories — optional flavor layer on top of (situation × intensity × tone).
// `context` is the prompt fragment passed to Gemini; English is fine — the model handles localization.
export const CATEGORIES = [
  {
    id: 'none',
    emoji: '🎲',
    labelKey: 'category.none',
    context: null,
  },
  {
    id: 'austrian-boss',
    emoji: '🇦🇹',
    labelKey: 'category.austrianBoss',
    context: 'an Austrian corporate boss with strict workplace formality, a sharp memory, and zero patience for vague excuses',
  },
  {
    id: 'german-mil',
    emoji: '👵',
    labelKey: 'category.germanMil',
    context: 'a German mother-in-law with high expectations about punctuality, politeness, and dietary commentary',
  },
  {
    id: 'ukrainian-mom',
    emoji: '🇺🇦',
    labelKey: 'category.ukrainianMom',
    context: 'a Ukrainian mom who worries about whether you ate, dressed warmly enough, and called your grandma this week',
  },
  {
    id: 'russian-babushka',
    emoji: '👵🏻',
    labelKey: 'category.russianBabushka',
    context: 'a Russian babushka whose entire emotional response stems from whether you have eaten enough',
  },
  {
    id: 'gym-trainer',
    emoji: '🏋️',
    labelKey: 'category.gymTrainer',
    context: 'a personal trainer who tracks every missed session and asks performance-coded follow-up questions',
  },
  {
    id: 'teacher',
    emoji: '🎓',
    labelKey: 'category.teacher',
    context: 'a strict teacher or professor who has heard every excuse already and is bored',
  },
  {
    id: 'gen-z-friends',
    emoji: '🤳',
    labelKey: 'category.genZFriends',
    context: 'a group chat of Gen-Z friends who will roast you mercilessly if the excuse is mid',
  },
]
