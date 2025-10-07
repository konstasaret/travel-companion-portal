import { NextResponse } from 'next/server'

// Simple Wikimedia image search using Wikipedia PageImages
// Given a query (?q=Munich Germany), returns the first thumbnail URL if available
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json({ error: 'Missing q' }, { status: 400 })
  }

  try {
    const apiUrl = new URL('https://en.wikipedia.org/w/api.php')
    apiUrl.searchParams.set('action', 'query')
    apiUrl.searchParams.set('format', 'json')
    apiUrl.searchParams.set('origin', '*')
    apiUrl.searchParams.set('prop', 'pageimages|pageterms')
    apiUrl.searchParams.set('generator', 'search')
    apiUrl.searchParams.set('gsrsearch', query)
    apiUrl.searchParams.set('gsrlimit', '1')
    apiUrl.searchParams.set('pithumbsize', '800')
    apiUrl.searchParams.set('pilicense', 'any')

    const res = await fetch(apiUrl.toString(), { next: { revalidate: 60 * 60 } })
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    }
    const data = await res.json() as any
    const pages = data?.query?.pages
    let imageUrl: string | null = null
    if (pages && typeof pages === 'object') {
      const firstPage = Object.values(pages)[0] as any
      imageUrl = firstPage?.thumbnail?.source || null
    }

    return NextResponse.json({ imageUrl })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


