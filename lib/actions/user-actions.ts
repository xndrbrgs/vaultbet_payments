'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function getCurrentUser() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    })

    return user
  } catch (error) {
    console.error('Error fetching current user:', error)
    throw error
  }
}

