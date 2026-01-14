package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/appaka/resendpit/store"
	"github.com/appaka/resendpit/types"
)

// Events handles GET /api/events (SSE stream)
func Events(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check SSE support
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Subscribe to events
	ch := store.Subscribe()
	defer store.Unsubscribe(ch)

	// Send initial state
	initMsg := types.SSEMessage{
		Type:   "init",
		Emails: store.GetEmails(),
	}
	sendSSE(w, flusher, initMsg)

	// Keepalive ticker
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	ctx := r.Context()

	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-ch:
			sendSSE(w, flusher, msg)
		case <-ticker.C:
			// Keepalive comment
			fmt.Fprintf(w, ": keepalive\n\n")
			flusher.Flush()
		}
	}
}

func sendSSE(w http.ResponseWriter, flusher http.Flusher, msg types.SSEMessage) {
	data, _ := json.Marshal(msg)
	fmt.Fprintf(w, "data: %s\n\n", data)
	flusher.Flush()
}
