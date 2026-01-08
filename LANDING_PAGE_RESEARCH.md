# Modern Landing Page Research: Premium Component Libraries & Patterns

**Research Date:** January 8, 2026
**Focus:** Showcasing complex tech products with premium design patterns

---

## Table of Contents

1. [Component Patterns for Artifact Showcase](#1-component-patterns-for-artifact-showcase)
2. [Animation & Interaction Patterns](#2-animation--interaction-patterns)
3. [Typography & Visual Hierarchy](#3-typography--visual-hierarchy)
4. [Modern Landing Page Frameworks](#4-modern-landing-page-frameworks)
5. [Specific Company Examples](#5-specific-company-examples)
6. [Implementation Recommendations](#6-implementation-recommendations)

---

## 1. Component Patterns for Artifact Showcase

### Interactive Code/Output Viewers

#### Top Libraries for Code Viewing:

**1. react-code-view** (by simonguo)
- Built with CodeMirror 6 and Shiki
- Native Markdown parsing - import `.md` files and render embedded code blocks
- Live Preview - Execute and preview React code in real-time
- Editable Code with syntax highlighting
- Universal Plugin - Works with Webpack, Vite, Rollup, esbuild, and Rspack
- Full TypeScript support
- [GitHub](https://github.com/simonguo/react-code-view)

**2. react-view** (by Uber)
- Interactive playground, documentation, and code generator
- Uses Babel for TypeScript support
- `useView` hook for playground state management
- Exports default UI parts (Editor, ActionButtons, Compiler, Knobs, Error)
- [GitHub](https://github.com/uber/react-view) | [npm](https://www.npmjs.com/package/react-view)

**3. JS-Notebook** (react-typescript-code-editor)
- Browser-based coding environment
- Monaco Editor with IntelliSense (VS Code editor)
- NPM Package Support via unpkg.com
- ESBuild Integration for fast in-browser bundling
- JSX Support with security through isolated iframes
- [GitHub](https://github.com/ymw0331/react-typescript-code-editor)

**4. @uiw/react-code-preview**
- Code edit preview for React documentation
- Run sample code to view rendering interface
- [npm](https://www.npmjs.com/package/@uiw/react-code-preview)

### Terminal/Console Output Styling

#### shadcn/ui Terminal Component

Official animated terminal emulator component with:
- macOS-inspired design with traffic light controls
- Typing animations with configurable speeds
- Responsive layout with Tailwind CSS
- Motion animations
- Polymorphic elements and custom styling

**Example Usage:**
```jsx
import { Terminal, TypingAnimation, AnimatedSpan } from '@/components/ui/terminal';

<Terminal>
  <TypingAnimation delay={0}>$ ls</TypingAnimation>
  <AnimatedSpan delay={800} className="text-blue-500">
    Documents Downloads Pictures
  </AnimatedSpan>
  <TypingAnimation delay={1600}>$ cd Documents</TypingAnimation>
</Terminal>
```

**Resources:**
- [shadcn.io Terminal](https://www.shadcn.io/components/visualization/terminal)
- [Magic UI Terminal](https://magicui.design/docs/components/terminal)

### Before/After Comparison Components

#### Premium Solutions:

**1. shadcn/ui Comparison Component**
- Interactive slider comparison for React and Next.js
- TypeScript support with Tailwind CSS styling
- Drag controls, hover modes, smooth animations
- Motion-powered with touch and mouse event support
- Progress tracking for dashboards
- [shadcn Comparison](https://www.shadcn.io/components/visualization/comparison)

**2. Magic UI Pro - CodeComparison**
- Compare code snippets side-by-side
- 50+ premium components
- Next.js 15 + TypeScript ready
- $199 lifetime access
- [Magic UI](https://magicui.design/docs/components/code-comparison)

**3. React Compare Slider**
- Zero dependencies
- Responsive images and any React components
- Supports picture, video, canvas, iframe
- [Croct Blog Review](https://blog.croct.com/post/best-react-before-after-image-comparison-slider-libraries)

### Expandable/Accordion Components (Premium Feel)

#### Best Practices:
- Keep labels clear with intuitive icons
- Allow multiple sections open at once
- Provide "Expand/Collapse All" options
- Smooth animations with strong accessibility (ARIA roles, keyboard navigation)
- Mobile-friendly touch targets

#### Libraries:

**1. shadcn/ui Accordion**
- Built on Radix UI primitives
- Follows WAI-ARIA accordion design pattern
- Full keyboard navigation and screen reader support
- TypeScript and Tailwind CSS
- [shadcn Accordion](https://ui.shadcn.com/docs/components/accordion)

**2. Material UI Accordion**
- Mounted by default for SEO
- Server-side rendering friendly

**3. HeroUI (formerly NextUI) Accordion**
- Controlled component with `selectedKeys` property
- Keyboard support: Space, Enter, Arrow Up/Down, Home/End
- [HeroUI Docs](https://www.heroui.com/docs/components/accordion)

**Real-World Examples:**
- Spotify's pricing table with expandable plans
- Stripe's FAQ sections
- Apple's product feature accordions

### Bento Grid Layouts (Feature Showcase)

Inspired by Japanese bento box aesthetic, these asymmetric layouts create visually dynamic experiences.

#### Available Components:

**1. Magic UI Bento Grid**
- Showcases product features elegantly
- Install via shadcn CLI
- [Magic UI Bento](https://magicui.design/docs/components/bento-grid)

**2. Shadcn Studio**
- Multiple variants for flexible layouts
- `npx shadcn add bento-grid-07`
- [Shadcn Studio](https://shadcnstudio.com/blocks/bento-grid/bento-grid)

**3. Launch UI Bento Grid**
- Built with Tailwind CSS and React
- Modern web layouts foundation
- [Launch UI](https://www.launchuicomponents.com/docs/sections/bento-grid)

**4. Aceternity UI**
- Skewed grid with title, description, header
- `npx shadcn@latest add @aceternity/bento-grid`
- [Aceternity UI](https://ui.aceternity.com/components/bento-grid)

**Key Features:**
- Customizable columns, rows, spacing with Tailwind
- Responsive design for desktop and mobile
- Combine stats, cards, images side-by-side
- Different tile sizes for visual hierarchy

---

## 2. Animation & Interaction Patterns

### Scroll-Triggered Animations

#### Framer Motion / Motion Approaches:

**Two Main Types:**
1. **Scroll-triggered** - Animations activate when elements enter viewport
2. **Scroll-linked** - Values linked directly to scroll progress

**Key Hooks:**
- `useScroll()` - Track scroll position
- `whileInView` - Animate when in viewport
- `useInView` - Detect viewport visibility
- `useSpring()` - Physics-based animations

**Implementation Example:**
```jsx
import { motion, useScroll } from 'framer-motion';

// Scroll-triggered fade-in
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

**Best Practices:**
- Animations should serve content, not distract
- Test across different devices and browsers
- Motion runs animations off main thread when possible
- Subtle animations work better than dramatic ones

**Resources:**
- [Framer Motion 2025 Animation Stack](https://dev.to/manukumar07/framer-motion-tailwind-the-2025-animation-stack-1801)
- [FreeCodeCamp Tutorial](https://www.freecodecamp.org/news/create-scroll-animations-with-framer-motion-and-react/)
- [Motion Docs](https://motion.dev/docs/react-scroll-animations)

### Parallax Effects

#### react-scroll-parallax
- React hooks and components for parallax scroll effects
- Vertical or horizontal scrolling effects
- Optimized to reduce jank
- Works with SSR and SSG
- [GitHub](https://github.com/jscottsmith/react-scroll-parallax) | [npm](https://www.npmjs.com/package/react-scroll-parallax)

#### simpleParallax.js
- Set orientation: up, right, down, left, up-left, up-right, down-left, down-right
- Diagonal translations when combining directions
- [simpleParallax.com](https://simpleparallax.com/)

#### Motion useScroll
- Create scroll-linked animations like progress bars
- Parallax effects with physics-based motion
- [Motion Scroll Docs](https://motion.dev/docs/react-scroll-animations)

**Implementation with GSAP:**
```jsx
// Using GSAP ScrollTrigger with timeline
const timeline = gsap.timeline({
  scrollTrigger: {
    trigger: element,
    start: "top center",
    end: "bottom center",
    scrub: true
  }
});
```

### Micro-interactions & Polish

#### Libraries:

**1. react-spring**
- Hooks-based, physics-based animations
- Natural and fluid motion (not robotic/linear)
- Mimics real-world physics
- [Stack Overflow Tutorial](https://stackoverflow.blog/2020/01/16/how-to-create-micro-interactions-with-react-spring-part-1/)

**2. Framer Motion**
- Specializes in micro-interactions
- Immediate user feedback
- Smooth effects and interactions

**3. Skiper UI**
- 70+ motion-ready React components
- Built on shadcn/ui
- Polished UIs for Next.js
- [Tailkits Skiper](https://tailkits.com/components/skiper-ui/)

**Best Practices:**
- Quick animations (200-300ms) for small interactions
- Longer animations (500-800ms) for page transitions
- Provide off switch for accessibility
- Shopping cart bounce when item added
- Search bar smooth expansion on click

### Number/Metric Counter Animations

#### Motion AnimateNumber (Premium)
- Lightweight (2.5kb) React component
- Built on Motion's layout animations
- Spring and tween transitions
- Perfect for counters, pricing, countdowns
- Motion+ exclusive (one-time lifetime payment)
- [Motion AnimateNumber](https://motion.dev/docs/react-animate-number)

#### Free Alternatives:

**useMotionValue + animate:**
```jsx
import { useMotionValue, animate } from "motion/react";

const count = useMotionValue(0);
animate(count, targetValue, { duration: 2 });
```

**BuildUI Animated Counter:**
- Uses spring and absolute positioning
- Smoothly animates digits as they change
- [BuildUI Recipe](https://buildui.com/recipes/animated-counter)

**Implementation Pattern:**
```jsx
import { useSpring, useTransform } from "framer-motion";

const spring = useSpring(value, {
  mass: 0.8,
  stiffness: 75,
  damping: 15
});

const display = useTransform(spring, current =>
  Math.round(current).toLocaleString()
);
```

### 3D Hover Effects & Depth

#### Atropos.js
- Lightweight, free and open-source
- Stunning touch-friendly 3D parallax hover effects
- Available for JavaScript, React, and WebComponent
- Works with Angular, Vue, Svelte, Solid
- [atroposjs.com](https://atroposjs.com/)

#### CSS 3D Transforms:
```css
.card:hover {
  transform: perspective(500px)
             scale(1.1)
             rotateX(10deg)
             rotateY(10deg);
  transition: transform 0.3s ease;
}
```

**Techniques:**
- Calculate rotation based on mouse position
- Use `rotateX`, `rotateY`, `rotateZ` for 3D effect
- Apply `perspective()` for depth
- Combine with `translateZ()` for layering

**Josh Comeau's "Boop" Effect:**
- Uses react-spring for hover animations
- Configurable spring physics (tension: 300, friction: 10)
- Transforms: translate, rotate, scale
- [Josh W. Comeau](https://www.joshwcomeau.com/react/boop/)

### Loading States & Skeletons

#### react-loading-skeleton
- Automatically sized to correct dimensions
- No need to craft matching skeleton screens
- Customize with props or `SkeletonTheme`
- Support for decimal counts (3.5 = 3 full + 1 half-width)
- Circular option with 50% border-radius
- [GitHub](https://github.com/dvtng/react-loading-skeleton) | [npm](https://www.npmjs.com/package/react-loading-skeleton)

#### Material UI Skeleton
- Placeholder preview before data loads
- Circular, rectangular, rounded variants
- Customizable colors via background-color
- [Material UI Docs](https://mui.com/material-ui/react-skeleton/)

#### Microsoft Fluent 2 Skeleton
- Two animation styles: wave (default) and pulse
- Wave provides smoothest transition
- Great for lots of skeletons on screen
- Reduces loading-time frustration
- [Fluent 2 Docs](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage)

**Why Use Skeleton Loaders:**
- Better UX than spinners
- Focus on progress instead of wait times
- Illusion of incremental content display
- Modern replacement for traditional loaders

---

## 3. Typography & Visual Hierarchy

### Monospace vs Proportional

#### When to Use Monospace:
- Code snippets and technical documentation
- Developer-focused brands
- Terminal/console output
- Creating distinctive tech aesthetic

**Popular Monospace Fonts:**
- JetBrains Mono (recommended for code blocks)
- Courier
- Monaco
- Inter (used by Linear for professional engineer look)

**Examples:**
- Linear uses Inter dark gray sans-serif on black
- 69 mono font landing pages on [Lapa Ninja](https://www.lapa.ninja/collection/mono-fonts/)
- The Monospace Web - responsive grid using monospace [owickstrom.github.io](https://owickstrom.github.io/the-monospace-web/)

#### Best Practices:
- Use monospace sparingly for technical content
- 2-3 font families maximum
- Minimum 16px for body text
- 1.5-1.8 line height
- 50-75 characters per line
- Optimize font loading with variable fonts
- Implement `font-display: swap`

### Code Syntax Highlighting

#### Top Libraries:

**1. react-syntax-highlighter**
- 2,146+ projects using it
- Prism or Highlight.js under the hood
- Uses syntax tree for dynamic DOM building
- Updates only changing DOM (not complete overwrite)
- **Note:** Not actively maintained, bugs with Next.js static generation
- [GitHub](https://github.com/react-syntax-highlighter/react-syntax-highlighter) | [npm](https://www.npmjs.com/package/react-syntax-highlighter)

**2. Prism.js** (Recommended)
- 10,000+ GitHub stars
- Small footprint (~2kB minified + gzipped)
- Supports numerous languages
- Rich ecosystem of themes and plugins
- Works with webpack via `babel-plugin-prismjs`
- React packages: `prism-react-renderer`, `react-syntax-highlighter`

**3. Highlight.js** (Best for Next.js)
- Lightweight with wide support
- ~200 programming languages
- Regular updates and good support
- Works with Next.js static generation out of the box
- Highly performant with low footprint

**4. React Code Block**
- Core functionality without styling
- Compose primitive components
- Line numbers, line highlighting
- Full styling control
- [React Code Block](https://react-code-block.netlify.app/)

**5. Rainbow**
- Super lightweight and new
- Easily customizable colors
- Solidly built

**Key Considerations:**
- Bundle size and PurgeCSS compatibility
- Active community and maintenance
- Performance with optimization tools

### Number/Metric Presentation

See [Number/Metric Counter Animations](#numbermetric-counter-animations) above for animated counters.

**Static Presentation Patterns:**
- Large, bold numbers with descriptive labels below
- Use color to emphasize positive metrics
- Separate thousands with locale-specific formatting
- Monospace for technical/data-heavy metrics
- Proportional for business metrics
- Consider animated count-up on scroll into view

---

## 4. Modern Landing Page Frameworks

### shadcn/ui Ecosystem

**Key Resources:**

1. **Launch UI** - [launchuicomponents.com](https://www.launchuicomponents.com/)
   - 100+ components, blocks, templates
   - React, shadcn/ui, Tailwind
   - Free and open source forever

2. **Page UI** - [pageui.shipixen.com](https://pageui.shipixen.com/)
   - Copy & paste landing page components
   - React + TailwindCSS
   - AI builds production-ready websites

3. **Shadcn Landing Page Template** - [shadcn.io](https://www.shadcn.io/template/category/landing-page)
   - 16 pre-designed sections
   - Fully responsive
   - TypeScript, Tailwind, Vite

4. **Shadcn Studio** - [shadcnstudio.com](https://shadcnstudio.com/)
   - Components, Blocks, UI Kits, Boilerplates
   - Full code ownership
   - Copy-paste or CLI install

5. **Convertfast UI**
   - CLI tool for creating landing pages
   - Based on shadcn-ui and Tailwind
   - Responsive, dark/light mode
   - MIT licensed

### Tailwind UI Patterns

**Official:**
- **Salient** - Official Tailwind UI SaaS template
  - Built by Tailwind CSS team
  - Production-ready with Next.js
  - Follows best practices
  - [tailwindui.com/templates/salient](https://tailwindui.com/templates/salient)

**Community Resources:**

1. **TailGrids** - [tailgrids.com](https://tailgrids.com/templates)
   - Templates for Startup, SaaS, Marketing
   - 13 ready-to-use examples
   - Dashboard, E-Commerce, Apps

2. **Tailkits** - [tailkits.com](https://tailkits.com/templates/categories/saas/)
   - 70+ SaaS website templates
   - Pre-designed layouts
   - Essential components (pricing, features, forms)
   - Optimized for performance, accessibility, SEO

3. **Flowbite** - [flowbite.com](https://flowbite.com/marketing-ui/demo/landing/saas/)
   - 53+ page templates
   - Marketing UI focus
   - Landing, contact, about pages

4. **Free Options:**
   - **Startup** - Free Next.js template
   - TypeScript support
   - Light and dark modes
   - HTMLrev free templates

### Vercel Patterns

Vercel's own sites showcase:
- Subtle gradient backgrounds
- Clean typography with Inter font
- Smooth page transitions
- Optimized images with next/image
- Edge functions for dynamic content
- Clean animation patterns with Motion

---

## 5. Specific Company Examples

### Linear Design System

**Visual Design:**
- Dark gray sans-serif (Inter) on black background
- Gradient purple sphere logo
- Professional "coding environment" aesthetic
- Minimizes battery drain and eye strain
- 85% opacity header bar on scroll
- Team randomly sorted on page load
- [onepagelove.com/linear](https://onepagelove.com/linear) | [lapa.ninja/post/linear-2](https://www.lapa.ninja/post/linear-2/)

**Animation Characteristics:**
- Small elegant motion
- Subtle animations and transitions
- Engaging without overwhelming
- Professional working software vibe
- Attention to detail with small motions

**Resources:**
- [Figma Linear Landing Page](https://www.figma.com/community/file/1291026707017577404)
- [Breakdance + motion.page tutorial](https://breakdance.com/tutorial/build-linear-app-with-breakdance-and-animate-with-motion-page/)
- [50+ sections collection](https://www.figma.com/community/file/1367670334751609522)

**Websites Inspired by Linear:**
- **Reflect** - Excellent motion, page looks like art
- **Twingate** - Great attention to detail, professional motions

### Raycast Landing Page

**Design Patterns:**
- Elegant dark tone with fresh, modern look
- Captivating illustrations
- Features, Call To Action, Newsletter components
- Strongly typed API with hot-reloading
- [Lapa Ninja Raycast](https://www.lapa.ninja/tag/raycast/) | [SaaSFrame](https://www.saasframe.io/examples/raycast-landing-page)

**UI Component Library:**
- React-based UI
- High-level components: List, Grid, Detail, Form
- ActionPanel with keyboard shortcuts
- No mouse required for interaction
- Design system approach

**Figma Resources:**
- Fully editable templates available
- [Raycast Landing Page](https://www.figma.com/community/file/1367033642784738353)
- [Web Pages UI](https://www.figma.com/community/file/1367387900890415538)

### Arc Browser

**Visual Identity:**
- Clean with soft gradients
- Purposeful typography
- Layout that respects space
- Creates mental calm (tab overload solution)
- Soft rounded corners
- Subtle animations and smooth transitions
- [landingfolio.com/arc](https://www.landingfolio.com/inspiration/post/arc) | [lapa.ninja/post/arc](https://www.lapa.ninja/post/arc/)

**Design Philosophy:**
- "A calmer, more personal internet"
- Limited distractions
- Design aesthetic appeals to Mac users
- Minimalism for target demographic

**Productivity Features:**
- Spaces, Sidebar, Split View
- Task-switching without chaos
- Deep focus and rapid context switching
- Thinks like a power user

**Polish & Attention to Detail:**
- Impressive on every interaction
- Small flourishes and animations
- Controls and navigation delight
- Always responsive and smooth

**Resources:**
- [Figma Arc Browser](https://www.figma.com/community/file/1409253055098186951)
- [Redesign case study](https://www.nikhilville.com/arc)
- [Medium analysis](https://medium.com/design-bootcamp/arc-browser-rethinking-the-web-through-a-designers-lens-f3922ef2133e)

### Stripe API Documentation

**Design Patterns:**
- Complete reference with code snippets
- Multiple language examples (Python, Java, PHP, Node.js, Go, Ruby, .NET)
- Inline components (equivalent to HTML span)
- Box and Inline components for styling
- [docs.stripe.com](https://docs.stripe.com) | [API Reference](https://docs.stripe.com/api)

**Inline Presentation:**
- Styleable inline elements
- Custom styles support
- Box component for block-level elements
- State machine pattern for process tracking

**Historical Landing Page:**
- 2011: 9-line code snippet (visually 7 lines)
- Focus on simplicity and clarity
- Remove optional parameters for visual brevity

**Design Pattern Documentation:**
- Navigation patterns
- Primary action emphasis
- Request status communication
- Empty states, loading states
- Step-by-step progress tracking
- [Stripe Apps patterns](https://docs.stripe.com/stripe-apps/patterns)

### Notion Template Gallery

**Gallery Patterns:**
- 30,000+ templates
- Database-driven organization
- Categories: Design, HR, Marketing, Personal, Enterprise
- Meeting notes, docs, tasks, projects
- [notion.com/templates](https://www.notion.com/templates)

**Design System Templates:**
- UI Component Library
- Style Guide (typography, colors, usage)
- Detailed documentation
- Integration with design tools
- Atomic Design methodology (atoms, molecules, organisms)
- Design Tokens for visual attributes
- [Notion Marketplace Design System](https://www.notion.com/templates/design-system)

**Gallery View:**
- Visual preview cards
- Filtering and categorization
- Inline galleries on pages
- `/Gallery view` command
- 130+ widgets available

---

## 6. Implementation Recommendations

### Stack Recommendation

**Core Framework:**
- **Next.js 15** + React 19
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling

**Component Library:**
- **shadcn/ui** as foundation
  - Radix UI primitives
  - Customizable, accessible
  - Copy/paste or CLI install

**Animation:**
- **Motion** (Framer Motion) for animations
  - Scroll-triggered effects
  - Micro-interactions
  - Physics-based motion
- **react-spring** for complex physics animations

**Specialized Components:**
- **react-code-view** for code display
- **react-scroll-parallax** for parallax effects
- **Atropos.js** for 3D hover effects
- **react-loading-skeleton** for loading states

**Syntax Highlighting:**
- **Highlight.js** (Next.js compatibility)
- Or **Prism.js** with React wrapper

### Development Workflow

1. **Component Development:**
   ```bash
   npx shadcn@latest add [component]
   ```

2. **Animation Implementation:**
   ```jsx
   import { motion } from 'framer-motion';

   <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ duration: 0.6 }}
   >
     Content
   </motion.div>
   ```

3. **Responsive Design:**
   - Mobile-first approach
   - Tailwind breakpoints: sm, md, lg, xl, 2xl
   - Test on real devices

4. **Performance:**
   - Lazy load components
   - Use next/image for images
   - Implement skeleton loaders
   - Monitor bundle size

### Design Principles for Premium Feel

**Visual:**
- Ample whitespace
- Subtle gradients (not harsh)
- Soft shadows (neumorphism/glassmorphism)
- Consistent color palette
- Dark mode consideration

**Motion:**
- Subtle, purposeful animations
- 200-300ms for small interactions
- 500-800ms for transitions
- Spring physics for natural feel
- Test on lower-end devices

**Typography:**
- Clear hierarchy (sizes, weights, spacing)
- Inter or similar for UI
- JetBrains Mono for code
- 16px minimum body text
- 1.5-1.8 line height

**Interaction:**
- Immediate feedback on actions
- Loading states for all async operations
- Hover states on interactive elements
- Keyboard navigation support
- ARIA labels for accessibility

**Content:**
- Scannable with clear sections
- Progressive disclosure (accordions)
- Visual hierarchy through size and color
- Code examples in context
- Real-world use cases

### Avoiding Generic AI Aesthetic

**Do:**
- Study real products (Linear, Raycast, Arc)
- Use authentic brand colors
- Implement unique interaction patterns
- Add personality through micro-interactions
- Create custom illustrations

**Don't:**
- Generic gradient backgrounds
- Overuse of purple/blue
- Stock photo heroes
- Generic "modern" icons
- Cookie-cutter layouts

### Testing & Iteration

1. **Accessibility:**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader testing
   - Color contrast ratios

2. **Performance:**
   - Lighthouse scores
   - Core Web Vitals
   - Mobile performance
   - Animation jank

3. **Browser Testing:**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers
   - Different screen sizes

4. **User Testing:**
   - First impressions (5-second test)
   - Task completion
   - Comprehension of features
   - Call-to-action effectiveness

---

## Quick Reference: Component Source Files

When implementing, you'll likely need to reference these locations:

**shadcn/ui components:**
```
/components/ui/accordion.tsx
/components/ui/terminal.tsx
/components/ui/comparison.tsx
/components/ui/skeleton.tsx
```

**Animation utilities:**
```
/lib/animations/scroll-triggered.ts
/lib/animations/parallax.ts
/lib/animations/micro-interactions.ts
```

**Layout components:**
```
/components/layout/bento-grid.tsx
/components/layout/hero-section.tsx
/components/layout/feature-showcase.tsx
```

---

## Sources

### Component Libraries & Frameworks
- [Launch UI](https://www.launchuicomponents.com/)
- [Page UI](https://pageui.shipixen.com/)
- [shadcn/ui Templates](https://www.shadcn.io/template/category/landing-page)
- [Shadcn Studio](https://shadcnstudio.com/)
- [Tailwind UI Salient](https://tailwindui.com/templates/salient)
- [TailGrids](https://tailgrids.com/templates)
- [Flowbite](https://flowbite.com/marketing-ui/demo/landing/saas/)

### Animation & Motion
- [Framer Motion Animation Stack 2025](https://dev.to/manukumar07/framer-motion-tailwind-the-2025-animation-stack-1801)
- [Motion Docs](https://motion.dev/)
- [FreeCodeCamp Scroll Animations](https://www.freecodecamp.org/news/create-scroll-animations-with-framer-motion-and-react/)
- [react-scroll-parallax GitHub](https://github.com/jscottsmith/react-scroll-parallax)
- [Atropos.js](https://atroposjs.com/)

### Code Viewing & Syntax
- [react-code-view GitHub](https://github.com/simonguo/react-code-view)
- [react-view GitHub](https://github.com/uber/react-view)
- [JS-Notebook GitHub](https://github.com/ymw0331/react-typescript-code-editor)
- [Front End Engineering - Best Code Highlighting](https://www.frontendeng.dev/blog/2-best-code-highlighting-libraries-for-react)

### Company Design Analysis
- [Linear - One Page Love](https://onepagelove.com/linear)
- [Linear - Lapa Ninja](https://www.lapa.ninja/post/linear-2/)
- [Raycast - Lapa Ninja](https://www.lapa.ninja/tag/raycast/)
- [Arc Browser - Landingfolio](https://www.landingfolio.com/inspiration/post/arc)
- [Stripe Documentation](https://docs.stripe.com)
- [Notion Templates](https://www.notion.com/templates)

### UI Components
- [shadcn/ui Terminal](https://www.shadcn.io/components/visualization/terminal)
- [shadcn/ui Accordion](https://ui.shadcn.com/docs/components/accordion)
- [Magic UI Bento Grid](https://magicui.design/docs/components/bento-grid)
- [Material UI Skeleton](https://mui.com/material-ui/react-skeleton/)
- [react-loading-skeleton GitHub](https://github.com/dvtng/react-loading-skeleton)

### Typography & Design
- [Lapa Ninja Mono Fonts](https://www.lapa.ninja/collection/mono-fonts/)
- [The Monospace Web](https://owickstrom.github.io/the-monospace-web/)
- [Shakuro - Best Fonts 2025](https://shakuro.com/blog/best-fonts-for-web-design)

### Micro-interactions & Polish
- [Stack Overflow - react-spring Tutorial](https://stackoverflow.blog/2020/01/16/how-to-create-micro-interactions-with-react-spring-part-1/)
- [Skiper UI](https://tailkits.com/components/skiper-ui/)
- [Josh Comeau - Boop Effect](https://www.joshwcomeau.com/react/boop/)

### Numbers & Counters
- [Motion AnimateNumber](https://motion.dev/docs/react-animate-number)
- [BuildUI Animated Counter](https://buildui.com/recipes/animated-counter)
- [animated-counter GitHub](https://github.com/driaug/animated-counter)

### Loading States
- [LogRocket - React Loading Skeleton](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/)
- [Fluent 2 Skeleton](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage)

### Comparison Components
- [shadcn Comparison](https://www.shadcn.io/components/visualization/comparison)
- [Croct - Best Before/After Libraries](https://blog.croct.com/post/best-react-before-after-image-comparison-slider-libraries)

### Accordion Components
- [Eleken - Accordion UI Examples](https://www.eleken.co/blog-posts/accordion-ui)
- [Component Gallery - Accordion](https://component.gallery/components/accordion/)

---

**End of Research Document**

*This research provides a comprehensive foundation for building premium, modern landing pages that showcase complex tech products. Focus on subtlety, performance, and authentic design that serves your specific brand and product narrative.*
