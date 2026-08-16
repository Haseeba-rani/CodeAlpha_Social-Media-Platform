import type { Novel } from "@/components/NovelCard";

export const novels: Novel[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "peer-e-kamil",
    title: "Peer-e-Kamil",
    author: "Umera Ahmed",
    genres: ["Romance"],
    rating: 4.8,
    readers_label: "1,245",
    cover_url: "/cover-1.jpg",
    description:
      "A story readers keep returning to — as much for the conversations it starts as for the pages themselves.",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "jannat-kay-pattay",
    title: "Jannat Kay Pattay",
    author: "Nimra Ahmed",
    genres: ["Drama"],
    rating: 4.6,
    readers_label: "986",
    cover_url: "/cover-2.jpg",
    description:
      "A story readers keep returning to — as much for the conversations it starts as for the pages themselves.",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    slug: "the-lamplighter-street",
    title: "The Lamplighter's Street",
    author: "Iman Farooq",
    genres: ["Mystery"],
    rating: 4.4,
    readers_label: "742",
    cover_url: "/cover-3.jpg",
    description:
      "A story readers keep returning to — as much for the conversations it starts as for the pages themselves.",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    slug: "the-cartographers-daughter",
    title: "The Cartographer's Daughter",
    author: "Elena Marchetti",
    genres: ["Fantasy"],
    rating: 4.7,
    readers_label: "1,108",
    cover_url: "/cover-4.jpg",
    description:
      "A story readers keep returning to — as much for the conversations it starts as for the pages themselves.",
  },
];

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
