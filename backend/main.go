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
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/emails", handlers.PostEmails)
	mux.HandleFunc("/api/emails", handlers.APIEmails)
	mux.HandleFunc("/api/events", handlers.Events)
	mux.HandleFunc("/api/health", handlers.Health)

	// Serve embedded static files
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatal(err)
	}

	// SPA handler: serve static files or fallback to index.html
	mux.Handle("/", spaHandler(http.FS(staticFS)))

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
