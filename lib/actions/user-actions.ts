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

export async function getUserEmail({ userId }: { userId: string }) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    })

    return user?.email
  } catch (error) {
    console.error('Error fetching user by email:', error)
    throw error
  }
}

export async function getAdminUser({ userId }: { userId: string }) {
  try {
    const adminUser = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
        isAdmin: true
      },
    })

    return adminUser
  } catch (error) {
    console.error('Error fetching admin user:', error)
    throw error
  }
}

export async function getStores() {
  try {
    const stores = await prisma.stores.findMany()

    return stores
  } catch (error) {
    console.error('Error fetching stores:', error)
    throw error
  }
}