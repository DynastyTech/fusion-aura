package main

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	*redis.Client
}

func NewRedis(redisURL string) (*RedisClient, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opt)

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	return &RedisClient{client}, nil
}

