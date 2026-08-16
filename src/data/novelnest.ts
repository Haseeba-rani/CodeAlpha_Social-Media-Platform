import cover1 from "@/assets/cover-1.jpg";
import cover2 from "@/assets/cover-2.jpg";
import cover3 from "@/assets/cover-3.jpg";
import cover4 from "@/assets/cover-4.jpg";
import type { Novel } from "@/components/NovelCard";

export const novels: Novel[] = [
  {
    slug: "peer-e-kamil",
    title: "Peer-e-Kamil",
    author: "Umera Ahmed",
    genre: "Romance",
    rating: 4.8,
    readers: "1,245",
    cover: cover1,
  },
  {
    slug: "jannat-kay-pattay",
    title: "Jannat Kay Pattay",
    author: "Nimra Ahmed",
    genre: "Drama",
    rating: 4.6,
    readers: "986",
    cover: cover2,
  },
  {
    slug: "the-lamplighter-street",
    title: "The Lamplighter's Street",
    author: "Iman Farooq",
    genre: "Mystery",
    rating: 4.4,
    readers: "742",
    cover: cover3,
  },
  {
    slug: "the-cartographers-daughter",
    title: "The Cartographer's Daughter",
    author: "Elena Marchetti",
    genre: "Fantasy",
    rating: 4.7,
    readers: "1,108",
    cover: cover4,
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
