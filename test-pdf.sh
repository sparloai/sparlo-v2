#!/bin/bash

# PDF Export Test Script
# Usage: ./test-pdf.sh <report-id> [base-url]
#
# Example:
#   ./test-pdf.sh rpt_abc123 https://sparlo.ai
#   ./test-pdf.sh rpt_abc123 http://localhost:3000

REPORT_ID=${1:-""}
BASE_URL=${2:-"https://sparlo.ai"}

if [ -z "$REPORT_ID" ]; then
    echo "Usage: ./test-pdf.sh <report-id> [base-url]"
    echo "Example: ./test-pdf.sh rpt_abc123 https://sparlo.ai"
    exit 1
fi

PDF_URL="${BASE_URL}/api/reports/${REPORT_ID}/pdf"
OUTPUT_DIR="./test-pdf-output"
PDF_FILE="${OUTPUT_DIR}/${REPORT_ID}.pdf"

mkdir -p "$OUTPUT_DIR"

echo "=========================================="
echo "PDF Export Test"
echo "=========================================="
echo "Report ID: $REPORT_ID"
echo "PDF URL:   $PDF_URL"
echo ""

echo "Downloading PDF..."
HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$PDF_FILE" "$PDF_URL")

if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ Failed to download PDF (HTTP $HTTP_STATUS)"
    exit 1
fi

PDF_SIZE=$(wc -c < "$PDF_FILE" | tr -d ' ')
echo "✓ Downloaded PDF (${PDF_SIZE} bytes)"
echo "  Saved to: $PDF_FILE"
echo ""

echo "Checking for garbled character patterns..."

# Check for common garbled Greek character patterns
GARBLED_FOUND=0

if grep -q 'Ãbreakup\|Ä[Hh]\|Ã¤\|Ã³' "$PDF_FILE" 2>/dev/null; then
    echo "⚠️  Found potential garbled characters in PDF binary"
    GARBLED_FOUND=1
fi

# Extract text using pdftotext if available
if command -v pdftotext &> /dev/null; then
    echo ""
    echo "Extracting text with pdftotext..."
    TEXT_FILE="${OUTPUT_DIR}/${REPORT_ID}.txt"
    pdftotext "$PDF_FILE" "$TEXT_FILE" 2>/dev/null

    if [ -f "$TEXT_FILE" ]; then
        echo "  Text saved to: $TEXT_FILE"

        # Check for proper Greek characters
        if grep -q '[τηστ]' "$TEXT_FILE" 2>/dev/null; then
            echo "✓ Found Greek characters (τ, η, σ) - Font appears to be working!"
        else
            echo "⚠️  No Greek characters found in extracted text"
        fi

        # Check for garbled patterns in text
        if grep -q 'ÄH\|Ã\|breakup Ä' "$TEXT_FILE" 2>/dev/null; then
            echo "❌ Found garbled character patterns in extracted text!"
            echo "   This indicates Greek characters are not rendering correctly."
            GARBLED_FOUND=1
        fi
    fi
else
    echo "(pdftotext not available - install poppler-utils for text extraction)"
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="

if [ $GARBLED_FOUND -eq 1 ]; then
    echo "❌ POTENTIAL ISSUES DETECTED"
    echo "   Please open the PDF and visually verify Greek characters."
else
    echo "✓ No obvious issues detected in binary scan"
    echo "  Please open the PDF to visually confirm rendering."
fi

echo ""
echo "PDF saved to: $PDF_FILE"
echo "Open it to visually check for:"
echo "  1. Greek characters (τ, η, σ) rendering correctly"
echo "  2. No text overlapping"
echo "  3. Cards not split across pages"
