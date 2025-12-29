# fix: Report Export & Share UX Improvements

## Overview

The report export to PDF and share link functionality has UX issues that need to be addressed:

1. **PDF Export**: Uses `window.print()` fallback which is clunky and poorly formatted
2. **Share Link Mobile UX**: Export/Share buttons don't have responsive layout, no native share integration
3. **Button Layout**: Buttons overflow on mobile screens

## Problem Statement

**PDF Export Issues:**
- Current implementation at `apps/web/app/api/reports/[id]/pdf/route.tsx` uses `@react-pdf/renderer`
- The `handleExport` in `report-display.tsx:134-160` fetches from the API endpoint
- Print styles exist (`report-base.css:556-621`) but @react-pdf/renderer doesn't use them
- PDF may not render all report sections consistently

**Share Link Mobile Issues:**
- Export/Share buttons at `report-display.tsx:929-951` use `flex gap-2` with no responsive classes
- Buttons can overflow or become hard to tap on small screens
- No native share sheet integration (Web Share API) on mobile
- Share modal works but could be more mobile-friendly

## Proposed Solution

### Phase 1: Fix Mobile Button Layout (Quick Win)

Update button layout to be responsive:

```tsx
// report-display.tsx - Change button container
<div className="flex flex-col gap-2 sm:flex-row">
  <button className="btn w-full sm:w-auto">Export</button>
  <button className="btn w-full sm:w-auto">Share</button>
</div>
```

### Phase 2: Add Web Share API for Mobile

Use native share sheet on mobile devices:

```tsx
// share-button.tsx
const handleShare = async () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    try {
      await navigator.share({
        title: report.title,
        url: shareUrl,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setShowModal(true); // Fallback to modal
      }
    }
  } else {
    setShowModal(true);
  }
};
```

### Phase 3: Improve PDF Export UX

1. **Add loading state with progress indication**
2. **Show clear error messages on failure**
3. **Add retry button on error**

```tsx
// ExportButton component
const [exportState, setExportState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

const handleExport = async () => {
  setExportState('loading');
  try {
    const response = await fetch(`/api/reports/${report.id}/pdf`);
    if (!response.ok) throw new Error('PDF generation failed');
    // ... download logic
    setExportState('success');
    toast.success('PDF downloaded');
  } catch (error) {
    setExportState('error');
    toast.error('Failed to export PDF. Try again.');
  }
};
```

### Phase 4: Enhance Print Styles (Browser Print Fallback)

Improve `@media print` styles so browser print-to-PDF looks professional:

```css
/* report-base.css additions */
@media print {
  /* Force single-column layout */
  .report-content {
    max-width: 100% !important;
    margin: 0 !important;
  }

  /* Clean page breaks */
  section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Hide all interactive elements */
  .chat-button, .export-button, .share-button,
  .toc-sidebar, .mobile-nav {
    display: none !important;
  }

  /* Ensure readable typography */
  body {
    font-size: 11pt;
    line-height: 1.6;
  }
}
```

## Acceptance Criteria

### Mobile Button Layout
- [ ] Export/Share buttons stack vertically on mobile (<640px)
- [ ] Buttons are side-by-side on desktop (≥640px)
- [ ] Buttons are easily tappable (min 44px touch target)

### Web Share API
- [ ] Mobile devices use native share sheet when available
- [ ] Falls back to modal if Web Share API unavailable
- [ ] User cancellation handled gracefully (no error toast)

### PDF Export
- [ ] Loading spinner shown during PDF generation
- [ ] Success toast on successful download
- [ ] Error toast with clear message on failure
- [ ] Retry option available after failure

### Print Styles
- [ ] Browser print (Cmd+P) produces clean single-column layout
- [ ] No interactive elements visible in print
- [ ] Proper page breaks (no mid-section splits)
- [ ] Readable font sizes for A4/Letter paper

## Technical Considerations

### Files to Modify

| File | Changes |
|------|---------|
| `report-display.tsx:929-951` | Responsive button layout |
| `report-display.tsx:134-160` | Enhanced export with states |
| `share-modal.tsx` | Web Share API integration |
| `report-base.css:556-621` | Enhanced print styles |

### Dependencies
- No new dependencies required
- Web Share API is native browser feature
- Print styles are pure CSS

## MVP Implementation

### 1. `report-display.tsx` - Button Layout Fix

```tsx
// Lines ~929-951
<div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
  <button
    className="btn w-full sm:w-auto"
    onClick={handleExport}
    disabled={isExporting}
  >
    {isExporting ? (
      <Loader2 className="btn-icon animate-spin" />
    ) : (
      <Download className="btn-icon" />
    )}
    {isExporting ? 'Exporting...' : 'Export PDF'}
  </button>
  <button
    className="btn w-full sm:w-auto"
    onClick={handleShare}
  >
    <Share2 className="btn-icon" />
    Share
  </button>
</div>
```

### 2. `share-modal.tsx` - Web Share API

```tsx
// New handleShare function with Web Share API
const handleShare = async () => {
  const shareUrl = `${window.location.origin}/share/${shareToken}`;

  // Check if mobile and Web Share API available
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    try {
      await navigator.share({
        title: 'Check out this report',
        url: shareUrl,
      });
      return; // Success - native share handled it
    } catch (err) {
      if (err.name === 'AbortError') return; // User cancelled
      // Fall through to modal
    }
  }

  // Desktop or fallback: show modal
  setShowShareModal(true);
};
```

### 3. `report-base.css` - Print Enhancements

```css
@media print {
  /* Hide app chrome */
  .app-sidebar,
  .toc-sidebar,
  .chat-drawer,
  .chat-button,
  .export-button,
  .share-button,
  header nav,
  footer {
    display: none !important;
  }

  /* Full-width content */
  .report-content,
  .report-page {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Prevent awkward breaks */
  h1, h2, h3, h4 {
    break-after: avoid;
    page-break-after: avoid;
  }

  section, .module, .callout {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Print typography */
  body {
    font-size: 11pt;
    line-height: 1.5;
    color: black !important;
    background: white !important;
  }

  /* Show link URLs in print */
  a[href^="http"]:after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }
}
```

## References

### Internal Files
- `apps/web/app/api/reports/[id]/pdf/route.tsx:1-96` - PDF generation endpoint
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx:134-160` - Export handler
- `apps/web/app/home/(user)/reports/[id]/_components/share-modal.tsx:26-132` - Share modal
- `apps/web/styles/report-base.css:556-621` - Existing print styles

### External References
- [Web Share API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [CSS Print Styles Best Practices](https://www.sitepoint.com/css-printer-friendly-pages/)
- [@react-pdf/renderer Documentation](https://react-pdf.org/)

## Success Metrics

- Mobile users can easily tap Export/Share buttons
- 90%+ of mobile share actions use native share sheet
- PDF export completes with clear feedback in <5 seconds
- Browser print produces clean, readable output
