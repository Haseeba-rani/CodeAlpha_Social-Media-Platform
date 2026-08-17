export const novels = [];

export type Reader = {
  handle: string;
  name: string;
  initials: string;
  followers: number;
  bio: string;
  tags: string[];
};

export const readers: Reader[] = [
  {
    handle: "sara_between_pages",
    name: "Sara Malik",
    initials: "SM",
    followers: 1320,
    bio: "Annotating margins with ink and warm tea. Obsessed with Urdu classics, psychological twists, and slow-burn mysteries.",
    tags: ["Mystery", "Romance", "Thriller"],
  },
  {
    handle: "hamza_turns_pages",
    name: "Hamza Sheikh",
    initials: "HS",
    followers: 864,
    bio: "History buff, fantasy worldbuilder, and collector of well-worn paperbacks. Always reading two books at the same time.",
    tags: ["Fantasy", "Historical", "Drama"],
  },
  {
    handle: "mariam_reads",
    name: "Mariam Yousaf",
    initials: "MY",
    followers: 512,
    bio: "Quiet evenings with spiritual literature, poetry, and character-driven drama. Living in the quiet stories that heal.",
    tags: ["Spiritual", "Poetry", "Drama"],
  },
];

export const soulmates = [
  {
    name: "Sara Malik",
    initials: "SM",
    match: 87,
    interests: ["❤️ Romance", "🕵️ Mystery", "📚 Umera Ahmed"],
  },
  {
    name: "Mariam Yousaf",
    initials: "MY",
    match: 81,
    interests: ["❤️ Romance", "🎭 Drama", "📚 Nimra Ahmed"],
  },
  {
    name: "Zoya Iqbal",
    initials: "ZI",
    match: 74,
    interests: ["🏛 Historical", "🎭 Drama", "📚 Rukhsana Nigar"],
  },
];

export const discussion = [
  { name: "Ayla Farooq", initials: "AF", text: "What did everyone think about the ending of Peer-e-Kamil?" },
  { name: "Sara Malik", initials: "SM", text: "I absolutely loved it! Salar's transformation is so touching." },
  { name: "Hamza Sheikh", initials: "HS", text: "The European arc in Jannat Kay Pattay remains my absolute favorite." },
];

