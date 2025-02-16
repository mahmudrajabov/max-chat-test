'use client'
import "../home.css">;
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter
    return (
     <div className="homepage-container">
          <h1>Blog page </h1>
          <button onClick={() => router.push('/blog/oneblog')}>Go to Blog Post 1</button>
        </div>
    )
}