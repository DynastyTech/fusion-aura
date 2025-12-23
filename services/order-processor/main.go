package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize Stripe
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	if stripe.Key == "" {
		log.Fatal("STRIPE_SECRET_KEY is required")
	}

	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	if webhookSecret == "" {
		log.Fatal("STRIPE_WEBHOOK_SECRET is required")
	}

	// Initialize database connection
	db, err := NewDB(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis connection
	redisClient, err := NewRedis(os.Getenv("REDIS_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize order processor
	processor := NewOrderProcessor(db, redisClient)

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
		})
	})

	// Stripe webhook endpoint
	http.HandleFunc("/webhooks/stripe", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		const maxBodyBytes = int64(65536)
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

		payload, err := webhook.ConstructEvent(r.Body, r.Header.Get("Stripe-Signature"), webhookSecret)
		if err != nil {
			log.Printf("Webhook signature verification failed: %v", err)
			http.Error(w, fmt.Sprintf("Webhook Error: %v", err), http.StatusBadRequest)
			return
		}

		// Handle the event
		switch payload.Type {
		case "checkout.session.completed":
			var session stripe.CheckoutSession
			if err := json.Unmarshal(payload.Data.Raw, &session); err != nil {
				log.Printf("Error parsing checkout.session.completed: %v", err)
				http.Error(w, "Error parsing event", http.StatusBadRequest)
				return
			}
			if err := processor.HandleCheckoutSessionCompleted(session); err != nil {
				log.Printf("Error handling checkout.session.completed: %v", err)
				http.Error(w, "Error processing event", http.StatusInternalServerError)
				return
			}

		case "payment_intent.succeeded":
			var paymentIntent stripe.PaymentIntent
			if err := json.Unmarshal(payload.Data.Raw, &paymentIntent); err != nil {
				log.Printf("Error parsing payment_intent.succeeded: %v", err)
				http.Error(w, "Error parsing event", http.StatusBadRequest)
				return
			}
			if err := processor.HandlePaymentIntentSucceeded(paymentIntent); err != nil {
				log.Printf("Error handling payment_intent.succeeded: %v", err)
				http.Error(w, "Error processing event", http.StatusInternalServerError)
				return
			}

		case "charge.failed":
			var charge stripe.Charge
			if err := json.Unmarshal(payload.Data.Raw, &charge); err != nil {
				log.Printf("Error parsing charge.failed: %v", err)
				http.Error(w, "Error parsing event", http.StatusBadRequest)
				return
			}
			if err := processor.HandleChargeFailed(charge); err != nil {
				log.Printf("Error handling charge.failed: %v", err)
				http.Error(w, "Error processing event", http.StatusInternalServerError)
				return
			}

		default:
			log.Printf("Unhandled event type: %s", payload.Type)
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"received": "true"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 FusionAura Order Processor listening on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

