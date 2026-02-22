package handlers

import (
	"encoding/base64"
	"io"
	"mime"
	"mime/multipart"
	"net/mail"
	"strings"
)

// parseRawMIME decodes a base64-encoded MIME message and extracts subject, HTML, and text.
func parseRawMIME(raw string) (subject, html, text string) {
	decoded, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		return "", "", ""
	}

	msg, err := mail.ReadMessage(strings.NewReader(string(decoded)))
	if err != nil {
		return "", "", ""
	}

	subject = msg.Header.Get("Subject")

	contentType := msg.Header.Get("Content-Type")
	mediaType, params, err := mime.ParseMediaType(contentType)
	if err != nil {
		// Try reading body as plain text
		body, _ := io.ReadAll(msg.Body)
		return subject, "", string(body)
	}

	if strings.HasPrefix(mediaType, "multipart/") {
		html, text = parseMIMEParts(msg.Body, params["boundary"])
	} else if strings.Contains(mediaType, "html") {
		body, _ := io.ReadAll(msg.Body)
		html = string(body)
	} else {
		body, _ := io.ReadAll(msg.Body)
		text = string(body)
	}

	return subject, html, text
}

func parseMIMEParts(r io.Reader, boundary string) (html, text string) {
	mr := multipart.NewReader(r, boundary)
	for {
		part, err := mr.NextPart()
		if err != nil {
			break
		}
		ct := part.Header.Get("Content-Type")
		body, err := io.ReadAll(part)
		if err != nil {
			continue
		}

		mediaType, params, _ := mime.ParseMediaType(ct)
		if strings.HasPrefix(mediaType, "multipart/") {
			h, t := parseMIMEParts(strings.NewReader(string(body)), params["boundary"])
			if h != "" {
				html = h
			}
			if t != "" {
				text = t
			}
		} else if strings.Contains(ct, "html") {
			html = string(body)
		} else if strings.Contains(ct, "plain") {
			text = string(body)
		}
	}
	return html, text
}
