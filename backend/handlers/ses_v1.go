package handlers

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/appaka/resendpit/store"
	"github.com/appaka/resendpit/types"
	"github.com/google/uuid"
)

// PostSESv1Email handles POST / with form-encoded SES v1 API requests
func PostSESv1Email(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		writeSESv1Error(w, http.StatusBadRequest, "InvalidParameterValue", "Failed to parse form body")
		return
	}

	action := r.FormValue("Action")
	switch action {
	case "SendEmail":
		handleSendEmail(w, r.Form)
	case "SendRawEmail":
		handleSendRawEmail(w, r.Form)
	default:
		writeSESv1Error(w, http.StatusBadRequest, "InvalidAction", fmt.Sprintf("Unknown action: %s", action))
	}
}

func handleSendEmail(w http.ResponseWriter, form url.Values) {
	from := form.Get("Source")
	if from == "" {
		writeSESv1Error(w, http.StatusBadRequest, "ValidationError", "Source is required")
		return
	}

	to := extractIndexedFormValues(form, "Destination.ToAddresses.member.")
	if len(to) == 0 {
		writeSESv1Error(w, http.StatusBadRequest, "ValidationError", "Destination.ToAddresses is required")
		return
	}

	subject := form.Get("Message.Subject.Data")
	html := form.Get("Message.Body.Html.Data")
	text := form.Get("Message.Body.Text.Data")
	cc := extractIndexedFormValues(form, "Destination.CcAddresses.member.")
	bcc := extractIndexedFormValues(form, "Destination.BccAddresses.member.")
	replyTo := form.Get("ReplyToAddresses.member.1")

	email := types.Email{
		ID:        uuid.NewString(),
		Provider:  "ses",
		From:      from,
		To:        to,
		CC:        cc,
		BCC:       bcc,
		Subject:   subject,
		HTML:      html,
		Text:      text,
		ReplyTo:   replyTo,
		CreatedAt: time.Now().UTC(),
	}

	store.AddEmail(email)

	writeSESv1Response(w, "SendEmailResponse", email.ID)
}

func handleSendRawEmail(w http.ResponseWriter, form url.Values) {
	rawData := form.Get("RawMessage.Data")
	if rawData == "" {
		writeSESv1Error(w, http.StatusBadRequest, "ValidationError", "RawMessage.Data is required")
		return
	}

	subject, html, text := parseRawMIME(rawData)

	// Try to get From from the form, fall back to parsed MIME
	from := form.Get("Source")

	email := types.Email{
		ID:        uuid.NewString(),
		Provider:  "ses",
		From:      from,
		Subject:   subject,
		HTML:      html,
		Text:      text,
		CreatedAt: time.Now().UTC(),
	}

	// Extract destinations from form if provided
	to := extractIndexedFormValues(form, "Destinations.member.")
	if len(to) > 0 {
		email.To = to
	}

	store.AddEmail(email)

	writeSESv1Response(w, "SendRawEmailResponse", email.ID)
}

// extractIndexedFormValues extracts values from indexed form params like "Prefix.1", "Prefix.2", etc.
func extractIndexedFormValues(form url.Values, prefix string) []string {
	var values []string
	for i := 1; ; i++ {
		key := fmt.Sprintf("%s%d", prefix, i)
		val := form.Get(key)
		if val == "" {
			break
		}
		values = append(values, val)
	}
	return values
}

func writeSESv1Response(w http.ResponseWriter, responseType string, messageID string) {
	w.Header().Set("Content-Type", "text/xml")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `<%s xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
  <%s>
    <MessageId>%s</MessageId>
  </%s>
  <ResponseMetadata>
    <RequestId>%s</RequestId>
  </ResponseMetadata>
</%s>`,
		responseType,
		responseType[:len(responseType)-len("Response")]+"Result",
		messageID,
		responseType[:len(responseType)-len("Response")]+"Result",
		uuid.NewString(),
		responseType,
	)
}

func writeSESv1Error(w http.ResponseWriter, status int, code string, message string) {
	w.Header().Set("Content-Type", "text/xml")
	w.WriteHeader(status)
	fmt.Fprintf(w, `<ErrorResponse xmlns="http://ses.amazonaws.com/doc/2010-12-01/">
  <Error>
    <Type>Sender</Type>
    <Code>%s</Code>
    <Message>%s</Message>
  </Error>
  <RequestId>%s</RequestId>
</ErrorResponse>`, code, message, uuid.NewString())
}
