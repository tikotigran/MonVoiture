import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { getDocs, collection } from 'firebase/firestore'

export async function GET(req: NextRequest) {
  try {
    // Проверяем что находится в корневых коллекциях
    const collections = ['users', 'cars', 'garages', 'userData', 'profiles', 'drivers', 'vehicles']
    const results: Record<string, any> = {}

    for (const collName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collName))
        results[collName] = {
          count: snapshot.docs.length,
          ids: snapshot.docs.map(d => d.id),
          sample: snapshot.docs.length > 0 ? snapshot.docs[0].data() : null
        }
      } catch (e) {
        results[collName] = {
          error: e instanceof Error ? e.message : String(e),
          count: 0
        }
      }
    }

    return NextResponse.json({
      success: true,
      firebaseCollections: results,
      message: 'Проверьте какие коллекции содержат данные'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
