---
module: Marketing
date: 2025-12-29
problem_type: performance_issue
component: frontend_stimulus
symptoms:
  - "36MB video file causing slow landing page load"
  - "Video JavaScript loop logic running timeupdate events"
  - "Full 63-second video loaded when only 7.5 seconds used"
root_cause: config_error
resolution_type: code_fix
severity: critical
tags: [video, compression, ffmpeg, performance, landing-page]
---

# Troubleshooting: Hero Video 36MB Causing Slow Page Load

## Problem
The marketing landing page hero video was 36MB (63 seconds), causing extremely slow initial page loads and unnecessary bandwidth usage. Only the first 7.5 seconds were being used via JavaScript loop.

## Environment
- Module: Marketing Landing Page
- Framework: Next.js 16
- Affected Component: `engineering-hero.tsx`
- Date: 2025-12-29

## Symptoms
- 36MB video file at `/public/videos/hero-bg.mp4`
- JavaScript `timeupdate` event listener manually looping video at 7.5 seconds
- Full video downloaded even though only first 7.5 seconds displayed
- Slow Time to First Contentful Paint (TTFCP)

## What Didn't Work

**Direct solution:** The problem was identified and fixed on the first attempt through systematic analysis.

## Solution

**Step 1: Trim and compress video with ffmpeg**

```bash
# Compress to first 7.5 seconds only, scale to 1280p, optimize encoding
ffmpeg -i hero-bg.mp4 -t 7.5 \
  -c:v libx264 -preset slow -crf 26 \
  -c:a aac -b:a 96k \
  -movflags +faststart \
  -vf "scale=1280:-2" \
  hero-bg-optimized.mp4
```

Result: **36MB → 1.6MB** (96% reduction)

**Step 2: Simplify component - remove JS loop logic**

```tsx
// Before (broken):
'use client';
import { memo, useEffect, useRef } from 'react';

export const EngineeringHero = memo(function EngineeringHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= 7.5) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  return (
    <video ref={videoRef} autoPlay muted playsInline>
      <source src="/videos/hero-bg.mp4" type="video/mp4" />
    </video>
  );
});

// After (fixed):
import { memo } from 'react';

export const EngineeringHero = memo(function EngineeringHero() {
  return (
    <video autoPlay muted loop playsInline>
      <source src="/videos/hero-bg.mp4" type="video/mp4" />
    </video>
  );
});
```

**Key changes:**
1. Removed `'use client'` directive (no longer needed without hooks)
2. Removed `useEffect` and `useRef` imports
3. Removed `videoRef` and event listener logic
4. Added native `loop` attribute to video element

## Why This Works

1. **Root cause:** The video file contained 63 seconds of content when only 7.5 seconds were displayed. JavaScript was manually looping the video via `timeupdate` events, which:
   - Required the full video to be downloaded
   - Added unnecessary JavaScript execution on every frame
   - Made the component a client component when it could be simpler

2. **Why the solution works:**
   - Pre-trimming the video to exactly 7.5 seconds eliminates wasted bandwidth
   - Using native HTML5 `loop` attribute is more efficient than JavaScript
   - Lower resolution (1280p vs 1920p) is sufficient for background video
   - CRF 26 provides good quality at smaller file size

3. **Performance impact:**
   - 96% reduction in video file size (36MB → 1.6MB)
   - Eliminated client-side JavaScript for video looping
   - Faster Time to Interactive (TTI)

## Prevention

- **Always trim videos to exact duration needed** before adding to public assets
- **Use appropriate resolution** - background videos don't need 4K
- **Prefer native HTML attributes** over JavaScript for basic functionality
- **Set file size budgets** for media assets (e.g., <5MB for hero videos)
- **Run `ls -lh` on public assets** during code review to catch large files

## Related Issues

No related issues documented yet.
