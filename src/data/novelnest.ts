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
    handle: "sara.between.pages",
    name: "Sara Malik",
    initials: "SM",
    followers: 1320,
    bio: "Annotating everything. Currently lost in classic mysteries.",
    tags: ["Mystery", "Romance", "Thriller"],
  },
  {
    handle: "ali_reads_late",
    name: "Ali Raza",
    initials: "AR",
    followers: 864,
    bio: "Late-night reader. Spiritual fiction and slow-burn drama.",
    tags: ["Spiritual", "Drama", "Historical"],
  },
  {
    handle: "hamzaturnspages",
    name: "Hamza Sheikh",
    initials: "HS",
    followers: 512,
    bio: "Fantasy maps, family sagas, and far too many bookmarks.",
    tags: ["Fantasy", "Historical", "Drama"],
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
    interests: ["🏛 Historical", "🎭 Drama", "📚 Rukhsana Bano"],
  },
];

export const discussion = [
  { name: "Ayesha Khan", initials: "AK", text: "What did everyone think about the ending?" },
  { name: "Sara Malik", initials: "SM", text: "I absolutely loved it!" },
  { name: "Ali Raza", initials: "AR", text: "I personally preferred Jannat Kay Pattay." },
];
