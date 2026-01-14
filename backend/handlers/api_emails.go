package handlers

import (
	"net/http"

	"github.com/appaka/resendpit/store"
)

// APIEmails handles GET/DELETE /api/emails
func APIEmails(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"emails": store.GetEmails(),
		})
	case http.MethodDelete:
		store.ClearEmails()
		writeJSON(w, http.StatusOK, map[string]bool{"success": true})
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
