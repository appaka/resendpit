package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/appaka/resendpit/store"
	"github.com/appaka/resendpit/types"
	"github.com/google/uuid"
)

// SES v2 request types

type sesV2Request struct {
	FromEmailAddress string          `json:"FromEmailAddress"`
	Destination      sesDestination  `json:"Destination"`
	ReplyToAddresses []string        `json:"ReplyToAddresses"`
	Content          sesContent      `json:"Content"`
	EmailTags        []sesEmailTag   `json:"EmailTags"`
}

type sesDestination struct {
	ToAddresses  []string `json:"ToAddresses"`
	CcAddresses  []string `json:"CcAddresses"`
	BccAddresses []string `json:"BccAddresses"`
}

type sesContent struct {
	Simple *sesSimpleContent `json:"Simple"`
	Raw    *sesRawContent    `json:"Raw"`
}

type sesSimpleContent struct {
	Subject sesBodyField `json:"Subject"`
	Body    sesBody      `json:"Body"`
}

type sesBody struct {
	Html *sesBodyField `json:"Html"`
	Text *sesBodyField `json:"Text"`
}

type sesBodyField struct {
	Data string `json:"Data"`
}

type sesRawContent struct {
	Data string `json:"Data"`
}

type sesEmailTag struct {
	Name  string `json:"Name"`
	Value string `json:"Value"`
}

// PostSESv2Email handles POST /v2/email/outbound-emails (SES v2 API)
func PostSESv2Email(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req sesV2Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeSESv2Error(w, http.StatusBadRequest, "Invalid JSON in request body")
		return
	}

	if req.FromEmailAddress == "" {
		writeSESv2Error(w, http.StatusBadRequest, "FromEmailAddress is required")
		return
	}

	if len(req.Destination.ToAddresses) == 0 {
		writeSESv2Error(w, http.StatusBadRequest, "Destination.ToAddresses is required")
		return
	}

	if req.Content.Simple == nil && req.Content.Raw == nil {
		writeSESv2Error(w, http.StatusBadRequest, "Content.Simple or Content.Raw is required")
		return
	}

	var subject, html, text string

	if req.Content.Simple != nil {
		subject = req.Content.Simple.Subject.Data
		if req.Content.Simple.Body.Html != nil {
			html = req.Content.Simple.Body.Html.Data
		}
		if req.Content.Simple.Body.Text != nil {
			text = req.Content.Simple.Body.Text.Data
		}
	} else if req.Content.Raw != nil {
		subject, html, text = parseRawMIME(req.Content.Raw.Data)
	}

	var replyTo string
	if len(req.ReplyToAddresses) > 0 {
		replyTo = req.ReplyToAddresses[0]
	}

	var tags []types.Tag
	for _, t := range req.EmailTags {
		tags = append(tags, types.Tag{Name: t.Name, Value: t.Value})
	}

	email := types.Email{
		ID:        uuid.NewString(),
		Provider:  "ses",
		From:      req.FromEmailAddress,
		To:        req.Destination.ToAddresses,
		CC:        req.Destination.CcAddresses,
		BCC:       req.Destination.BccAddresses,
		Subject:   subject,
		HTML:      html,
		Text:      text,
		ReplyTo:   replyTo,
		Tags:      tags,
		CreatedAt: time.Now().UTC(),
	}

	store.AddEmail(email)

	writeJSON(w, http.StatusOK, map[string]string{"MessageId": email.ID})
}

func writeSESv2Error(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"__type":  "ValidationException",
		"message": message,
	})
}
