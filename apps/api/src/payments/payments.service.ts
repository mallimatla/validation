/**
 * Payments Service
 * Stripe integration for subscriptions
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });
    }
  }

  async createCheckoutSession(userId: string, plan: string) {
    if (!this.stripe) throw new Error('Stripe not configured');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const priceIds: Record<string, string> = {
      STARTER: this.configService.get('STRIPE_STARTER_PRICE_ID', ''),
      PROFESSIONAL: this.configService.get('STRIPE_PROFESSIONAL_PRICE_ID', ''),
      ENTERPRISE: this.configService.get('STRIPE_ENTERPRISE_PRICE_ID', ''),
    };

    const priceId = priceIds[plan];
    if (!priceId) throw new Error('Invalid plan');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.configService.get('APP_URL')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('APP_URL')}/pricing`,
      metadata: { userId, plan },
    });

    return { url: session.url };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    if (!userId || !plan) return;

    await this.prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: {
        plan: plan as any,
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: session.customer as string,
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'CANCELLED' },
    });
  }
}
