package store

import (
	"os"
	"strconv"
	"sync"

	"github.com/appaka/resendpit/types"
)

var (
	maxEmails = 50
	mu        sync.RWMutex
	emails    []types.Email

	subscribersMu sync.RWMutex
	subscribers   []chan types.SSEMessage
)

func init() {
	if env := os.Getenv("RESENDPIT_MAX_EMAILS"); env != "" {
		if n, err := strconv.Atoi(env); err == nil && n > 0 {
			maxEmails = n
		}
	}
}

// AddEmail adds a new email to the store (FIFO)
func AddEmail(email types.Email) {
	mu.Lock()
	emails = append([]types.Email{email}, emails...)
	if len(emails) > maxEmails {
		emails = emails[:maxEmails]
	}
	mu.Unlock()

	broadcast(types.SSEMessage{Type: "new-email", Email: &email})
}

// GetEmails returns a copy of all emails
func GetEmails() []types.Email {
	mu.RLock()
	defer mu.RUnlock()
	result := make([]types.Email, len(emails))
	copy(result, emails)
	return result
}

// ClearEmails removes all emails from the store
func ClearEmails() {
	mu.Lock()
	emails = nil
	mu.Unlock()

	broadcast(types.SSEMessage{Type: "clear"})
}

// GetEmailCount returns the current number of emails
func GetEmailCount() int {
	mu.RLock()
	defer mu.RUnlock()
	return len(emails)
}

// GetMaxEmails returns the configured maximum emails limit
func GetMaxEmails() int {
	return maxEmails
}

// Subscribe creates a new SSE subscription channel
func Subscribe() chan types.SSEMessage {
	ch := make(chan types.SSEMessage, 10)
	subscribersMu.Lock()
	subscribers = append(subscribers, ch)
	subscribersMu.Unlock()
	return ch
}

// Unsubscribe removes a subscription channel
func Unsubscribe(ch chan types.SSEMessage) {
	subscribersMu.Lock()
	defer subscribersMu.Unlock()
	for i, sub := range subscribers {
		if sub == ch {
			subscribers = append(subscribers[:i], subscribers[i+1:]...)
			close(ch)
			return
		}
	}
}

// broadcast sends a message to all subscribers
func broadcast(msg types.SSEMessage) {
	subscribersMu.RLock()
	defer subscribersMu.RUnlock()
	for _, ch := range subscribers {
		select {
		case ch <- msg:
		default:
			// Channel full, skip (slow client)
		}
	}
}
