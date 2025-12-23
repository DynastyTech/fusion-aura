package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/stripe/stripe-go/v76"
)

type OrderProcessor struct {
	db    *DB
	redis *RedisClient
}

func NewOrderProcessor(db *DB, redis *RedisClient) *OrderProcessor {
	return &OrderProcessor{
		db:    db,
		redis: redis,
	}
}

// HandleCheckoutSessionCompleted processes completed checkout sessions
func (p *OrderProcessor) HandleCheckoutSessionCompleted(session stripe.CheckoutSession) error {
	ctx := context.Background()

	// Get order ID from metadata
	orderID, ok := session.Metadata["orderId"]
	if !ok {
		return fmt.Errorf("orderId not found in session metadata")
	}

	log.Printf("Processing checkout.session.completed for order: %s", orderID)

	// Update order status to PAID
	query := `
		UPDATE orders 
		SET status = 'PAID', 
		    stripe_payment_intent_id = $1,
		    updated_at = NOW()
		WHERE id = $2 AND stripe_session_id = $3
		RETURNING id
	`

	var updatedOrderID string
	err := p.db.QueryRowContext(ctx, query, session.PaymentIntent.ID, orderID, session.ID).Scan(&updatedOrderID)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("order not found: %s", orderID)
		}
		return fmt.Errorf("failed to update order: %w", err)
	}

	// Decrement inventory for each order item
	if err := p.decrementInventory(ctx, orderID); err != nil {
		log.Printf("Warning: Failed to decrement inventory for order %s: %v", orderID, err)
		// Don't fail the webhook, but log the error
	}

	// Create payment record
	paymentQuery := `
		INSERT INTO payments (id, order_id, user_id, amount, currency, status, method, stripe_payment_intent_id, created_at, updated_at)
		SELECT 
			gen_random_uuid(),
			o.id,
			o.user_id,
			o.total,
			'ZAR',
			'COMPLETED',
			'STRIPE_CHECKOUT',
			$1,
			NOW(),
			NOW()
		FROM orders o
		WHERE o.id = $2
		RETURNING id
	`

	var paymentID string
	err = p.db.QueryRowContext(ctx, paymentQuery, session.PaymentIntent.ID, orderID).Scan(&paymentID)
	if err != nil {
		log.Printf("Warning: Failed to create payment record: %v", err)
	}

	log.Printf("Successfully processed checkout.session.completed for order: %s", orderID)
	return nil
}

// HandlePaymentIntentSucceeded processes successful payment intents
func (p *OrderProcessor) HandlePaymentIntentSucceeded(paymentIntent stripe.PaymentIntent) error {
	ctx := context.Background()

	log.Printf("Processing payment_intent.succeeded: %s", paymentIntent.ID)

	// Find order by payment intent ID
	query := `
		UPDATE orders 
		SET status = 'PAID', 
		    updated_at = NOW()
		WHERE stripe_payment_intent_id = $1 AND status = 'PENDING'
		RETURNING id
	`

	var orderID string
	err := p.db.QueryRowContext(ctx, query, paymentIntent.ID).Scan(&orderID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("No pending order found for payment intent: %s", paymentIntent.ID)
			return nil // Not an error, might have been processed already
		}
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Successfully processed payment_intent.succeeded for order: %s", orderID)
	return nil
}

// HandleChargeFailed processes failed charges
func (p *OrderProcessor) HandleChargeFailed(charge stripe.Charge) error {
	ctx := context.Background()

	log.Printf("Processing charge.failed: %s", charge.ID)

	// Find order by payment intent ID
	query := `
		UPDATE orders o
		SET status = 'CANCELLED',
		    updated_at = NOW()
		WHERE o.stripe_payment_intent_id = $1 AND o.status IN ('PENDING', 'PROCESSING')
		RETURNING o.id
	`

	var orderID string
	err := p.db.QueryRowContext(ctx, query, charge.PaymentIntent.ID).Scan(&orderID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("No order found for failed charge: %s", charge.ID)
			return nil
		}
		return fmt.Errorf("failed to update order: %w", err)
	}

	// Update payment status to FAILED
	paymentQuery := `
		UPDATE payments
		SET status = 'FAILED',
		    updated_at = NOW()
		WHERE stripe_payment_intent_id = $1
	`

	_, err = p.db.ExecContext(ctx, paymentQuery, charge.PaymentIntent.ID)
	if err != nil {
		log.Printf("Warning: Failed to update payment status: %v", err)
	}

	log.Printf("Successfully processed charge.failed for order: %s", orderID)
	return nil
}

// decrementInventory decrements inventory quantities for order items
func (p *OrderProcessor) decrementInventory(ctx context.Context, orderID string) error {
	query := `
		UPDATE inventory i
		SET quantity = i.quantity - oi.quantity,
		    reserved = GREATEST(0, i.reserved - oi.quantity),
		    updated_at = NOW()
		FROM order_items oi
		WHERE oi.order_id = $1
		  AND oi.product_id = i.product_id
		RETURNING i.product_id, i.quantity
	`

	rows, err := p.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return fmt.Errorf("failed to decrement inventory: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var productID string
		var quantity int
		if err := rows.Scan(&productID, &quantity); err != nil {
			return fmt.Errorf("failed to scan inventory result: %w", err)
		}
		log.Printf("Decremented inventory for product %s, remaining: %d", productID, quantity)
	}

	return rows.Err()
}

// ProcessAsyncJob processes async jobs from Redis queue (simple worker pattern)
func (p *OrderProcessor) ProcessAsyncJob(ctx context.Context) error {
	// Simple implementation - can be extended with a proper job queue
	// For now, we process webhooks synchronously
	return nil
}

// StartWorker starts a background worker for processing async jobs
func (p *OrderProcessor) StartWorker(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := p.ProcessAsyncJob(ctx); err != nil {
				log.Printf("Error processing async job: %v", err)
			}
		}
	}
}

