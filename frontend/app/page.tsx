'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <main className="flex h-screen items-center justify-center text-gray-700">
      <p>Redirecting...</p>
    </main>
  )
}
