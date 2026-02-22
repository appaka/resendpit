package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/appaka/resendpit/store"
	"github.com/appaka/resendpit/types"
	"github.com/google/uuid"
)

// PostEmails handles POST /emails (Resend SDK interceptor)
func PostEmails(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req types.ResendEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, types.ValidationError{
			StatusCode: 422,
			Message:    "Invalid JSON in request body.",
			Name:       "validation_error",
		})
		return
	}

	// Validate required fields
	if req.From == "" {
		writeJSON(w, http.StatusUnprocessableEntity, types.ValidationError{
			StatusCode: 422,
			Message:    "The `from` field is required.",
			Name:       "validation_error",
		})
		return
	}

	to := normalizeToArray(req.To)
	if len(to) == 0 {
		writeJSON(w, http.StatusUnprocessableEntity, types.ValidationError{
			StatusCode: 422,
			Message:    "The `to` field is required.",
			Name:       "validation_error",
		})
		return
	}

	if req.Subject == "" {
		writeJSON(w, http.StatusUnprocessableEntity, types.ValidationError{
			StatusCode: 422,
			Message:    "The `subject` field is required.",
			Name:       "validation_error",
		})
		return
	}

	// Create email
	email := types.Email{
		ID:        uuid.NewString(),
		Provider:  "resend",
		From:      req.From,
		To:        to,
		CC:        normalizeToArray(req.CC),
		BCC:       normalizeToArray(req.BCC),
		Subject:   req.Subject,
		HTML:      req.HTML,
		Text:      req.Text,
		ReplyTo:   req.ReplyTo,
		Headers:   req.Headers,
		Tags:      req.Tags,
		CreatedAt: time.Now().UTC(),
	}

	// Process attachments
	for _, a := range req.Attachments {
		att := types.Attachment{Filename: a.Filename}
		if a.Content != "" {
			size := len(a.Content) * 3 / 4 // Base64 decode size estimate
			att.Size = &size
		}
		email.Attachments = append(email.Attachments, att)
	}

	store.AddEmail(email)

	writeJSON(w, http.StatusOK, map[string]string{"id": email.ID})
}

// normalizeToArray converts string or []interface{} to []string
func normalizeToArray(v interface{}) []string {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case string:
		if val == "" {
			return nil
		}
		return []string{val}
	case []interface{}:
		result := make([]string, 0, len(val))
		for _, item := range val {
			if s, ok := item.(string); ok {
				result = append(result, s)
			}
		}
		return result
	}
	return nil
}
