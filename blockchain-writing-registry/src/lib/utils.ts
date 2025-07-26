import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TwitterAPI } from '@campnetwork/origin';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Origin API: Generate AI Remix Images
export async function generateImage(model: "bear" | "fox" | "goat", jwt: string) {
  const res = await fetch(`${process.env.VITE_ORIGIN_API}/auth/merv/generate-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model_type: model }),
  });
  const { data } = await res.json();
  return data.images as { id: string; url: string }[];
}

// Origin API: Check Generation Credits
export async function getCredits(jwt: string) {
  const res = await fetch(`${process.env.VITE_ORIGIN_API}/auth/merv/check-generations`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const { data } = await res.json();
  return data.generations_left as number;
}

// Origin API: Assign Image After Mint
export async function assignImage(imageId: string, jwt: string) {
  await fetch(`${process.env.VITE_ORIGIN_API}/auth/merv/assign-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_id: imageId }),
  });
}

const twitterApiKey = process.env.VITE_ORIGIN_CLIENT_ID || '';

export const twitterApi = new TwitterAPI({ apiKey: twitterApiKey });

export async function fetchUserByUsername(username: string) {
  return twitterApi.fetchUserByUsername(username);
}

// Note: These methods may not exist on the current TwitterAPI version
// Commenting out to prevent build errors
/*
export async function fetchTweetsByUsername(username: string, page = 1, limit = 10) {
  return twitterApi.fetchTweetsByUsername(username, page, limit);
}
export async function fetchFollowersByUsername(username: string, page = 1, limit = 10) {
  return twitterApi.fetchFollowersByUsername(username, page, limit);
}
export async function fetchFollowingByUsername(username: string, page = 1, limit = 10) {
  return twitterApi.fetchFollowingByUsername(username, page, limit);
}
export async function fetchTweetById(tweetId: string) {
  return twitterApi.fetchTweetById(tweetId);
}
export async function fetchUserByWalletAddress(walletAddress: string, page = 1, limit = 10) {
  return twitterApi.fetchUserByWalletAddress(walletAddress, page, limit);
}
export async function fetchRepostedByUsername(username: string, page = 1, limit = 10) {
  return twitterApi.fetchRepostedByUsername(username, page, limit);
}
export async function fetchRepliesByUsername(username: string, page = 1, limit = 10) {
  return twitterApi.fetchRepliesByUsername(username, page, limit);
}
export async function fetchLikesByUsername(username: string, page = 1, limit = 10) {
  return twitterApi.fetchLikesByUsername(username, page, limit);
}
export async function fetchFollowsByUsername(username: string, page = 1, limit = 10) {
  return twitterApi.fetchFollowsByUsername(username, page, limit);
}
export async function fetchViewedTweetsByUsername(username: string, page = 1, limit = 10) {
  return twitterApi.fetchViewedTweetsByUsername(username, page, limit);
}
*/

// Helper: Assign animal name based on content length
const INSECTS = ["Ant", "Fly", "Bee", "Mosquito", "Gnat", "Mite", "Flea", "Aphid", "Weevil", "Moth"];
const SMALL_ANIMALS = ["Mouse", "Sparrow", "Rabbit", "Squirrel", "Frog", "Hedgehog", "Pigeon", "Rat", "Chipmunk", "Guinea Pig"];
const MEDIUM_ANIMALS = ["Cat", "Dog", "Goose", "Chicken", "Duck", "Raccoon", "Otter", "Fox", "Badger", "Goat"];
const LARGE_ANIMALS = ["Horse", "Cow", "Sheep", "Pig", "Deer", "Wolf", "Kangaroo", "Cheetah", "Panther", "Leopard"];
const GIANT_ANIMALS = ["Elephant", "Giraffe", "Hippopotamus", "Rhinoceros", "Whale", "Moose", "Camel", "Buffalo", "Bear", "Gorilla"];

export function getAnimalNameByContentLength(length: number): string {
  if (length < 100) {
    return INSECTS[Math.floor(Math.random() * INSECTS.length)];
  } else if (length < 500) {
    return SMALL_ANIMALS[Math.floor(Math.random() * SMALL_ANIMALS.length)];
  } else if (length < 2000) {
    return MEDIUM_ANIMALS[Math.floor(Math.random() * MEDIUM_ANIMALS.length)];
  } else if (length < 5000) {
    return LARGE_ANIMALS[Math.floor(Math.random() * LARGE_ANIMALS.length)];
  } else {
    return GIANT_ANIMALS[Math.floor(Math.random() * GIANT_ANIMALS.length)];
  }
} 