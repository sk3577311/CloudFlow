'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (router) {
      router.replace('/login') // replace prevents back-button redirect loops
    }
  }, [router])

  return (
    <main className="flex h-screen items-center justify-center text-gray-700">
      <p>Redirecting...</p>
    </main>
  )
}
