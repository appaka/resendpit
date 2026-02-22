package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/appaka/resendpit/handlers"
)

//go:embed static/*
var staticFiles embed.FS

func main() {
	// Healthcheck mode for Docker HEALTHCHECK
	if len(os.Args) > 1 && os.Args[1] == "--healthcheck" {
		resp, err := http.Get("http://localhost:3000/api/health")
		if err != nil || resp.StatusCode != http.StatusOK {
			os.Exit(1)
		}
		os.Exit(0)
	}

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/emails", handlers.PostEmails)
	mux.HandleFunc("/api/emails", handlers.APIEmails)
	mux.HandleFunc("/api/events", handlers.Events)
	mux.HandleFunc("/api/health", handlers.Health)

	// SES v2 route
	mux.HandleFunc("/v2/email/outbound-emails", handlers.PostSESv2Email)

	// Serve embedded static files
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatal(err)
	}

	// SPA handler with SES v1 detection: form-encoded POST to / is SES v1
	spa := spaHandler(http.FS(staticFS))
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/" &&
			strings.HasPrefix(r.Header.Get("Content-Type"), "application/x-www-form-urlencoded") {
			handlers.PostSESv1Email(w, r)
			return
		}
		spa.ServeHTTP(w, r)
	}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Resend-Pit listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// spaHandler serves static files or falls back to index.html for SPA routing
func spaHandler(staticFS http.FileSystem) http.Handler {
	fileServer := http.FileServer(staticFS)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Try to open the file
		f, err := staticFS.Open(strings.TrimPrefix(path, "/"))
		if err == nil {
			defer f.Close()
			// Check if it's a directory
			stat, err := f.Stat()
			if err == nil && !stat.IsDir() {
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// Fallback to index.html for SPA
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})
}
