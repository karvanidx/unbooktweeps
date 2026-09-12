# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-09-12

### Added
- Click anywhere on a row to toggle its checkbox
- Close button (✕) in the modal header; Escape key also closes the modal
- Button hover/press feedback via CSS transitions

### Changed
- Reworked confirmation modal UX: header with title and subtitle, centered rows, hover highlight, cleaner spacing
- All user-facing copy switched to English and made concise
- Primary button label is dynamic ("Unbookmark N") and disabled when nothing is selected
- Softer backdrop (60% black)

## [0.3.0] - 2026-09-11

### Added
- "Invert selection" button in the modal footer
- Selected counter ("X of Y selected") that updates on every change

## [0.2.0] - 2026-09-11

### Added
- Runner for DevTools Snippets: prompts for the number of tweets when the script runs
- README with features, usage instructions, and options

## [0.1.0] - 2026-09-11

### Added
- Initial version: bulk-unbookmark script for X/Twitter bookmarks
- Collects the top N bookmarked tweets via infinite scroll
- Confirmation modal with thumbnails and checkboxes (all checked by default)
- Fallback that re-finds buttons unmounted by X's virtual scrolling
