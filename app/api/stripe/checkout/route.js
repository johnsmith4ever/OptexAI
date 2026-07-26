import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    let priceId = "";
    if (plan === "core") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CORE;
    } else if (plan === "pro") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Usually you would fetch the user's email from Clerk or DB to pass customer_email,
    // but for now we create a session tied to the Clerk userId in metadata.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      managed_payments: {
        enabled: false,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
      metadata: {
        userId, // Ties the Stripe subscription to the Clerk user
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
