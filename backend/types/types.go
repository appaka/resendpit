package types

import "time"

// Email represents a stored email
type Email struct {
	ID          string            `json:"id"`
	Provider    string            `json:"provider"`
	From        string            `json:"from"`
	To          []string          `json:"to"`
	CC          []string          `json:"cc,omitempty"`
	BCC         []string          `json:"bcc,omitempty"`
	Subject     string            `json:"subject"`
	HTML        string            `json:"html,omitempty"`
	Text        string            `json:"text,omitempty"`
	ReplyTo     string            `json:"replyTo,omitempty"`
	Headers     map[string]string `json:"headers,omitempty"`
	Tags        []Tag             `json:"tags,omitempty"`
	Attachments []Attachment      `json:"attachments,omitempty"`
	CreatedAt   time.Time         `json:"createdAt"`
}

// Tag represents email metadata tags
type Tag struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// Attachment represents an email attachment
type Attachment struct {
	Filename string `json:"filename"`
	Size     *int   `json:"size,omitempty"`
}

// ResendEmailRequest represents the incoming request from Resend SDK
type ResendEmailRequest struct {
	From        string            `json:"from"`
	To          interface{}       `json:"to"`
	Subject     string            `json:"subject"`
	HTML        string            `json:"html,omitempty"`
	Text        string            `json:"text,omitempty"`
	CC          interface{}       `json:"cc,omitempty"`
	BCC         interface{}       `json:"bcc,omitempty"`
	ReplyTo     string            `json:"reply_to,omitempty"`
	Headers     map[string]string `json:"headers,omitempty"`
	Tags        []Tag             `json:"tags,omitempty"`
	Attachments []AttachmentReq   `json:"attachments,omitempty"`
}

// AttachmentReq represents an attachment in the request
type AttachmentReq struct {
	Filename string `json:"filename"`
	Content  string `json:"content,omitempty"`
}

// SSEMessage represents a Server-Sent Event message
type SSEMessage struct {
	Type   string  `json:"type"`
	Emails []Email `json:"emails,omitempty"`
	Email  *Email  `json:"email,omitempty"`
}

// ValidationError represents an API validation error
type ValidationError struct {
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message"`
	Name       string `json:"name"`
}
