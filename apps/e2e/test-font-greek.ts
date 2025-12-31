/**
 * Font Greek Character Test
 *
 * Tests that the Noto Sans font correctly renders Greek characters (τ, η, σ, etc.)
 * Run: cd apps/e2e && npx tsx test-font-greek.ts
 */

import React from 'react';
import { Document, Page, Text, View, Font, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import * as fs from 'fs';
import * as path from 'path';

// Register Noto Sans font - same configuration as the PDF export
Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/full/ttf/NotoSans-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/full/ttf/NotoSans-Bold.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSans',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontWeight: 700,
    marginBottom: 5,
  },
  text: {
    marginBottom: 10,
    lineHeight: 1.5,
  },
  greekBox: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
});

// Test document with Greek characters
function TestDocument() {
  return React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.title }, 'Greek Character Rendering Test'),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.label }, 'Greek Letters:'),
        React.createElement(View, { style: styles.greekBox },
          React.createElement(Text, { style: styles.text }, 'τ (tau) - τ_breakup'),
          React.createElement(Text, { style: styles.text }, 'η (eta) - η_B'),
          React.createElement(Text, { style: styles.text }, 'σ (sigma) - σ_y'),
          React.createElement(Text, { style: styles.text }, 'γ (gamma) - γ_dot'),
          React.createElement(Text, { style: styles.text }, 'μ (mu) - μm'),
          React.createElement(Text, { style: styles.text }, 'ρ (rho) - ρ_fluid')
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.label }, 'Formula Examples:'),
        React.createElement(View, { style: styles.greekBox },
          React.createElement(Text, { style: styles.text }, 'τ_breakup ~ (μ × η × d) / (σ × v)'),
          React.createElement(Text, { style: styles.text }, 'η_B = f(γ_dot, T)'),
          React.createElement(Text, { style: styles.text }, 'σ_y = σ_0 + k × γ^n')
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.label }, 'Full Greek Alphabet:'),
        React.createElement(View, { style: styles.greekBox },
          React.createElement(Text, { style: styles.text }, 'Lowercase: α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω'),
          React.createElement(Text, { style: styles.text }, 'Uppercase: Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω')
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.label }, 'Mixed Content (Engineering Report Style):'),
        React.createElement(Text, { style: styles.text },
          'The breakup time τ_breakup is determined by the viscosity η and surface tension σ. ' +
          'For high-viscosity fluids (η > 1000 mPa·s), the relationship τ_breakup ~ η × d / (σ × v) holds. ' +
          'The yield stress σ_y follows a power law σ_y = σ_0 + k × γ^n where γ_dot is the shear rate.'
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.label }, 'Test Result:'),
        React.createElement(Text, { style: styles.text },
          'If you can read all Greek characters above correctly (not as Ä, H, ³, etc.), ' +
          'the font configuration is working properly.'
        )
      )
    )
  );
}

async function main() {
  console.log('🧪 Greek Character Font Test\n');
  console.log('Generating PDF with Greek characters using Noto Sans font...\n');

  try {
    const outputDir = path.join(__dirname, 'pdf-test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Render PDF to buffer
    const buffer = await renderToBuffer(TestDocument());

    // Save PDF
    const pdfPath = path.join(outputDir, 'greek-font-test.pdf');
    fs.writeFileSync(pdfPath, buffer);

    console.log(`✅ PDF generated successfully!`);
    console.log(`📄 Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    console.log(`📁 Saved to: ${pdfPath}\n`);

    // Analyze for garbled patterns
    const pdfString = buffer.toString('latin1');

    const garbledPatterns = [
      { pattern: /Ä[Hh]|ÄH/g, desc: 'Garbled η (eta)' },
      { pattern: /Ã¤|Ã„/g, desc: 'Garbled ä/Ä encoding' },
      { pattern: /Ã³|³=/g, desc: 'Garbled σ (sigma)' },
      { pattern: /Ã/g, desc: 'UTF-8 mojibake (Ã)' },
    ];

    const issues: string[] = [];
    for (const { pattern, desc } of garbledPatterns) {
      if (pattern.test(pdfString)) {
        issues.push(desc);
      }
    }

    // Check for proper Greek letters
    const greekChars = ['τ', 'η', 'σ', 'γ', 'μ', 'ρ'];
    const foundGreek: string[] = [];
    for (const char of greekChars) {
      if (pdfString.includes(char)) {
        foundGreek.push(char);
      }
    }

    console.log('Analysis Results:');
    console.log('─────────────────');

    if (foundGreek.length > 0) {
      console.log(`✅ Found Greek characters in PDF: ${foundGreek.join(', ')}`);
    } else {
      console.log('⚠️  No Greek characters found in raw PDF bytes (may be encoded)');
    }

    if (issues.length > 0) {
      console.log(`\n❌ Found ${issues.length} potential encoding issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ No garbled character patterns detected');
    }

    console.log(`\n📖 Please open the PDF to visually verify:`);
    console.log(`   open "${pdfPath}"`);

  } catch (error) {
    console.error('❌ Failed to generate PDF:', error);
  }
}

main();
