import { prisma } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(`Unathorized`, { status: 401 });
  }

  // Get user info
  const user = await currentUser();

  if (!user) {
    return new NextResponse(`User doesn't exist`, { status: 401 });
  }

  let dbUser = await prisma.user.findUnique({
    where: {
      clerkUserId: user.id,
    },
  });

  if (dbUser) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    await prisma.transfer.deleteMany({
      where: {
        senderId: dbUser.id,
        status: "PENDING",
        createdAt: {
          lt: fourteenDaysAgo,
        },
      },
    });
    await prisma.bTCTransfer.deleteMany({
      where: {
        senderId: dbUser.id,
        status: "PENDING",
        createdAt: {
          lt: fourteenDaysAgo,
        },
      },
    });
  }

  if (!dbUser) {
    const userData = {
      clerkUserId: user?.id ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: (user?.emailAddresses && user.emailAddresses.length > 0)
        ? user.emailAddresses[0].emailAddress
        : '',
      profileImage: `https://picsum.photos/seed/${user?.id}/300/300`,
    };

    // Log the userData object
    console.log("User Data:", userData);

    // Check if a user with the same email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`A user with the email ${userData.email} already exists.`);
      throw new Error(`A user with the email ${userData.email} already exists.`);
    }

    // Create the new user
    await prisma.user.create({
      data: userData,
    });
  }

  // Perform redirect with returned user object

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: "/dashboard",
    },
  });
}
