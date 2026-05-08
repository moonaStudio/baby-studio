import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: "1",
      name: "Teddy Bear Classic",
      slug: "teddy-bear-classic",
      background_url: "https://cdn.example.com/themes/teddy-bear-classic.jpg",
      thumbnail_url: "https://cdn.example.com/themes/teddy-bear-classic-thumb.jpg",
      is_premium: false,
      template: {
        name: "Teddy Bear Classic",
        slug: "teddy-bear-classic",
        backgroundUrl: "https://cdn.example.com/themes/teddy-bear-classic.jpg",
        isPremium: false,
        babyPosition: { x: 0.5, y: 0.62, width: 0.5, height: 0.6 },
        shadowOffset: { x: 12, y: 20 },
        shadowBlur: 18,
        shadowOpacity: 0.3,
        colorProfile: "warm"
      }
    }
  ]);
}
