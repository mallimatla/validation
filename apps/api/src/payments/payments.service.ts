/**
 * Payments Service
 * Razorpay integration for subscriptions and payments
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import * as crypto from 'crypto';

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_start: number;
  current_end: number;
}

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpayKeyId: string | null = null;
  private razorpayKeySecret: string | null = null;
  private baseUrl = 'https://api.razorpay.com/v1';

  // Plan configuration
  private readonly plans: Record<string, { name: string; priceINR: number; priceUSD: number; credits: number; planId?: string }> = {
    STARTER: {
      name: 'Starter',
      priceINR: 2999,
      priceUSD: 39,
      credits: 5,
    },
    PROFESSIONAL: {
      name: 'Professional',
      priceINR: 9999,
      priceUSD: 129,
      credits: 20,
    },
    ENTERPRISE: {
      name: 'Enterprise',
      priceINR: 49999,
      priceUSD: 649,
      credits: 100,
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID') || null;
    this.razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || null;

    // Load plan IDs from config
    this.plans.STARTER.planId = this.configService.get('RAZORPAY_STARTER_PLAN_ID');
    this.plans.PROFESSIONAL.planId = this.configService.get('RAZORPAY_PROFESSIONAL_PLAN_ID');
    this.plans.ENTERPRISE.planId = this.configService.get('RAZORPAY_ENTERPRISE_PLAN_ID');

    if (this.razorpayKeyId) {
      this.logger.log('Razorpay payment gateway configured');
    } else {
      this.logger.warn('Razorpay not configured - payments will fail');
    }
  }

  /**
   * Check if payment gateway is configured
   */
  isConfigured(): boolean {
    return !!(this.razorpayKeyId && this.razorpayKeySecret);
  }

  /**
   * Get available plans
   */
  getPlans() {
    return Object.entries(this.plans).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      priceINR: plan.priceINR,
      priceUSD: plan.priceUSD,
      credits: plan.credits,
      features: this.getPlanFeatures(key),
    }));
  }

  /**
   * Create a Razorpay order for one-time payment
   */
  async createOrder(userId: string, plan: string, currency: 'INR' | 'USD' = 'INR') {
    if (!this.isConfigured()) {
      throw new BadRequestException('Payment gateway not configured');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const planConfig = this.plans[plan];
    if (!planConfig) throw new BadRequestException('Invalid plan');

    const amount = currency === 'INR' ? planConfig.priceINR * 100 : planConfig.priceUSD * 100;

    const order = await this.razorpayRequest<RazorpayOrder>('POST', '/orders', {
      amount,
      currency,
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan,
        userEmail: user.email,
      },
    });

    // Store order in database
    await this.prisma.subscription.create({
      data: {
        userId,
        plan: plan as any,
        status: 'PENDING',
        razorpayOrderId: order.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    this.logger.log(`Created order ${order.id} for user ${userId}, plan ${plan}`);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.razorpayKeyId,
      name: 'Validation Council',
      description: `${planConfig.name} Plan - ${planConfig.credits} validation credits`,
      prefill: {
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Create a Razorpay subscription for recurring payments
   */
  async createSubscription(userId: string, plan: string) {
    if (!this.isConfigured()) {
      throw new BadRequestException('Payment gateway not configured');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const planConfig = this.plans[plan];
    if (!planConfig?.planId) {
      throw new BadRequestException('Subscription plan not configured');
    }

    // Create or get customer
    const customerId = await this.getOrCreateCustomer(user);

    const subscription = await this.razorpayRequest<RazorpaySubscription>('POST', '/subscriptions', {
      plan_id: planConfig.planId,
      customer_id: customerId,
      total_count: 12, // 12 months
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId,
        plan,
      },
    });

    // Store subscription
    await this.prisma.subscription.create({
      data: {
        userId,
        plan: plan as any,
        status: 'PENDING',
        razorpaySubscriptionId: subscription.id,
        razorpayCustomerId: customerId,
        currentPeriodStart: new Date(subscription.current_start * 1000),
        currentPeriodEnd: new Date(subscription.current_end * 1000),
      },
    });

    this.logger.log(`Created subscription ${subscription.id} for user ${userId}`);

    return {
      subscriptionId: subscription.id,
      keyId: this.razorpayKeyId,
    };
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!this.razorpayKeySecret) return false;

    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Verify Razorpay subscription signature
   */
  verifySubscriptionSignature(subscriptionId: string, paymentId: string, signature: string): boolean {
    if (!this.razorpayKeySecret) return false;

    const body = paymentId + '|' + subscriptionId;
    const expectedSignature = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(
    orderId: string,
    paymentId: string,
    signature: string,
  ) {
    // Verify signature
    if (!this.verifyPaymentSignature(orderId, paymentId, signature)) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Get payment details
    const payment = await this.razorpayRequest<RazorpayPayment>('GET', `/payments/${paymentId}`);

    // Update subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        razorpayPaymentId: paymentId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Add credits to user
    const planConfig = this.plans[subscription.plan];
    if (planConfig) {
      await this.prisma.user.update({
        where: { id: subscription.userId },
        data: {
          credits: { increment: planConfig.credits },
        },
      });
    }

    this.logger.log(`Payment ${paymentId} successful for order ${orderId}`);

    return { success: true, credits: planConfig?.credits || 0 };
  }

  /**
   * Handle Razorpay webhook events
   */
  async handleWebhook(event: any, signature: string) {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(event, signature)) {
      this.logger.warn('Invalid webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventType = event.event;
    const payload = event.payload;

    this.logger.log(`Processing webhook event: ${eventType}`);

    switch (eventType) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(payload.payment.entity);
        break;

      case 'subscription.activated':
        await this.handleSubscriptionActivated(payload.subscription.entity);
        break;

      case 'subscription.charged':
        await this.handleSubscriptionCharged(payload.subscription.entity, payload.payment.entity);
        break;

      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(payload.subscription.entity);
        break;

      case 'subscription.halted':
        await this.handleSubscriptionHalted(payload.subscription.entity);
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${eventType}`);
    }

    return { received: true };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!subscription?.razorpaySubscriptionId) {
      throw new NotFoundException('Active subscription not found');
    }

    await this.razorpayRequest('POST', `/subscriptions/${subscription.razorpaySubscriptionId}/cancel`, {
      cancel_at_cycle_end: 1,
    });

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    this.logger.log(`Subscription ${subscription.razorpaySubscriptionId} scheduled for cancellation`);

    return { success: true };
  }

  /**
   * Get user's subscription status
   */
  async getSubscriptionStatus(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        hasSubscription: false,
        plan: 'FREE',
        credits: 0,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    return {
      hasSubscription: subscription.status === 'ACTIVE',
      plan: subscription.plan,
      status: subscription.status,
      credits: user?.credits || 0,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  // Private helper methods

  private async razorpayRequest<T>(method: string, path: string, data?: any): Promise<T> {
    const auth = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Razorpay API error: ${response.status} - ${error}`);
      throw new BadRequestException(`Payment gateway error: ${response.status}`);
    }

    return response.json();
  }

  private async getOrCreateCustomer(user: { id: string; email: string; name?: string | null }): Promise<string> {
    // Check if customer exists
    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId: user.id, razorpayCustomerId: { not: null } },
    });

    if (existingSub?.razorpayCustomerId) {
      return existingSub.razorpayCustomerId;
    }

    // Create new customer
    const customer = await this.razorpayRequest<{ id: string }>('POST', '/customers', {
      name: user.name || user.email.split('@')[0],
      email: user.email,
      fail_existing: 0,
    });

    return customer.id;
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.razorpayKeySecret) return false;

    const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return expectedSignature === signature;
  }

  private async handlePaymentCaptured(payment: RazorpayPayment) {
    this.logger.log(`Payment captured: ${payment.id}`);
    // Additional processing if needed
  }

  private async handlePaymentFailed(payment: RazorpayPayment) {
    this.logger.warn(`Payment failed: ${payment.id}`);

    const subscription = await this.prisma.subscription.findFirst({
      where: { razorpayOrderId: payment.order_id },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' },
      });
    }
  }

  private async handleSubscriptionActivated(subscription: RazorpaySubscription) {
    this.logger.log(`Subscription activated: ${subscription.id}`);

    await this.prisma.subscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_start * 1000),
        currentPeriodEnd: new Date(subscription.current_end * 1000),
      },
    });
  }

  private async handleSubscriptionCharged(subscription: RazorpaySubscription, payment: RazorpayPayment) {
    this.logger.log(`Subscription charged: ${subscription.id}`);

    const sub = await this.prisma.subscription.findFirst({
      where: { razorpaySubscriptionId: subscription.id },
    });

    if (sub) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: new Date(subscription.current_start * 1000),
          currentPeriodEnd: new Date(subscription.current_end * 1000),
        },
      });

      // Add credits
      const planConfig = this.plans[sub.plan];
      if (planConfig) {
        await this.prisma.user.update({
          where: { id: sub.userId },
          data: {
            credits: { increment: planConfig.credits },
          },
        });
      }
    }
  }

  private async handleSubscriptionCancelled(subscription: RazorpaySubscription) {
    this.logger.log(`Subscription cancelled: ${subscription.id}`);

    await this.prisma.subscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: { status: 'CANCELLED' },
    });
  }

  private async handleSubscriptionHalted(subscription: RazorpaySubscription) {
    this.logger.log(`Subscription halted: ${subscription.id}`);

    await this.prisma.subscription.updateMany({
      where: { razorpaySubscriptionId: subscription.id },
      data: { status: 'PAST_DUE' },
    });
  }

  private getPlanFeatures(plan: string): string[] {
    const features: Record<string, string[]> = {
      STARTER: [
        '5 startup validations',
        'All 12 AI agents',
        'Basic reports',
        'Email support',
      ],
      PROFESSIONAL: [
        '20 startup validations',
        'All 12 AI agents',
        'Detailed reports with citations',
        'Priority support',
        'Export to PDF',
        'API access',
      ],
      ENTERPRISE: [
        '100 startup validations',
        'All 12 AI agents',
        'Comprehensive reports',
        'Dedicated support',
        'Custom integrations',
        'Team collaboration',
        'White-label options',
      ],
    };

    return features[plan] || [];
  }
}
