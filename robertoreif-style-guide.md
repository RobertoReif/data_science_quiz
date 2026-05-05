# Roberto Reif Website Style Guide

A comprehensive style reference for robertoreif.com - a minimal, professional portfolio built on Squarespace.

---

## Color Palette

### Primary Colors
- **Background**: `#ffffff` (white) - main page background
- **Text Primary**: `#1a1a1a` to `#333333` (dark gray/black) - body text and headings
- **Text Secondary**: `#666666` (medium gray) - supporting text, captions
- **Text Tertiary**: `#999999` (light gray) - subtle text, metadata

### Accent Colors
- **Link Blue**: `#0077B5` (LinkedIn blue) - primary accent for social links
- **Link Hover**: Typically darker blue or underline effect
- **Borders/Dividers**: `#e0e0e0` to `#cccccc` (light gray)

### Interactive States
- **Hover Background**: `#f5f5f5` to `#fafafa` (subtle light gray)
- **Active/Focus**: Subtle variations of base colors
- **Selection**: Default browser selection (typically blue tint)

---

## Typography

### Font Families
- **Primary Font Stack**: System fonts for optimal performance
  ```css
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
               'Helvetica Neue', Arial, sans-serif;
  ```
- **Monospace** (for code/technical content): `'Courier New', monospace`
- **Google Fonts**: Framework available but not actively implemented

### Heading Hierarchy
- **Site Title/H1**:
  - Desktop: ~2.5rem (40px) to 3rem (48px)
  - Mobile: ~1.8rem (28.8px) - uses TextShrink utility
  - Font weight: 400 (normal) to 500 (medium)
  - Color: `#1a1a1a`

- **H2 Headings**:
  - Desktop: ~1.8rem to 2rem
  - Font weight: 400
  - Color: `#1a1a1a`

- **H3 Headings**:
  - Desktop: ~1.3rem to 1.5rem
  - Font weight: 400
  - Color: `#333333`
  - Example: "I am a scientist with a strong background..."

- **Body Text**:
  - Size: 1rem to 1.1rem (16px to 17.6px)
  - Line height: 1.6 to 1.7
  - Font weight: 300 to 400
  - Color: `#333333` to `#666666`

### Tagline/Subtitle
- Font size: ~1.1rem (17.6px)
- Font weight: 300 (light)
- Color: `#666666`
- Example: "Technology and Data Trainings"

### Font Weights
- **Light**: 300 - for subtitles and less emphasis
- **Normal**: 400 - primary heading and body weight
- **Medium**: 500 - for emphasis (if used)

### Text Properties
- **Line Height**:
  - Headings: 1.2 to 1.4
  - Body: 1.6 to 1.7
- **Letter Spacing**: Default (0) - not customized
- **Text Rendering**: Optimized for legibility

---

## Spacing & Layout

### Container & Padding
- **Max Content Width**: Typically 1000px to 1200px
- **Outer Padding** (Desktop): 100px
- **Page Padding**: 80px
- **Top Padding**: 80px
- **Section Spacing**: 40px to 60px between major sections

### Mobile Spacing (≤640px)
- **Outer Padding**: 20px to 40px
- **Page Padding**: 20px to 40px
- **Top Padding**: 40px
- **Section Spacing**: 30px to 40px

### Component Spacing
- **Element Margins**:
  - Between paragraphs: 20px
  - After headings: 20px to 30px
  - Before headings: 40px to 60px
- **Component Gaps**: 20px to 40px for grid/flex layouts

### Vertical Rhythm
- Consistent use of multiples of 10px or 20px for vertical spacing
- Breathing room prioritized for readability

---

## Layout Structure

### Grid System
- **Layout Type**: Single-column, centered design
- **Asymmetric Padding**: Content may have different left/right padding
- **Responsive**: Mobile-first approach with desktop enhancements
- **Alignment**: Center-aligned for main content area

### Navigation
- **Position**: Top horizontal navigation
- **Links**: About, Images, Blog, Talks, Contact
- **Mobile**: Collapsible menu (hamburger) at ≤640px
- **Spacing**: Adequate spacing between navigation items

### Content Sections
- Header with logo (dual placement - upper and lower sections)
- Main content area
- Horizontal dividers (`* * *` or `<hr>`)
- Footer with privacy policy and social links

---

## Interactive Elements

### Links
- **Default Color**: Blue (likely `#0000EE` or custom blue)
- **Hover**: Color change or underline effect
- **Visited**: Potentially different shade
- **Focus**: Outline for accessibility
- **Transition**: Smooth color/underline transitions (~0.3s)

### Buttons (if present)
- **Background**: Dark (`#333333` or similar)
- **Text Color**: White (`#ffffff`)
- **Padding**: ~12px to 15px vertical, 30px to 40px horizontal
- **Border Radius**: Minimal (~4px) or sharp corners
- **Hover**: Darker background (`#1a1a1a`)
- **Transition**: 0.3s ease on background-color

### Social Icons
- **Border Effect**: `box-shadow: 0 0 0 2px inset` for outline style
- **Hover**: Likely subtle scale or opacity change
- **Size**: Consistent sizing for all icons
- **Spacing**: Even gaps between icons

### Forms (if present)
- Clean, minimal styling
- Subtle borders
- Focus states with border color change
- reCAPTCHA integration support

---

## Visual Effects

### Shadows
- **Minimal Use**: No heavy drop shadows
- **Subtle Depth**: `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` for cards/images
- **Icon Borders**: `box-shadow: 0 0 0 2px inset` for outlined icons

### Borders
- **Color**: `#e0e0e0` to `#cccccc` (light gray)
- **Width**: 1px to 2px
- **Radius**: Minimal to none (0px to 4px for modern touch)
- **Style**: Solid, clean lines

### Hover Effects
- **Subtle Transforms**: `translateY(-2px to -5px)` for lift effect
- **Opacity Changes**: 0.7 to 1.0 transitions
- **Color Transitions**: 0.2s to 0.3s ease
- **No Heavy Animations**: Keeps professional aesthetic

### Images
- **No explicit borders**: Clean presentation
- **Aspect Ratio**: Preserved naturally
- **Background Removal**: Some images use no-background PNGs
- **File Formats**: JPG for photos, PNG for logos/transparency

---

## Responsive Design

### Breakpoints
- **Mobile**: ≤640px (primary breakpoint)
- **Tablet**: 641px to 1024px (likely uses desktop styles with adjustments)
- **Desktop**: >1024px (full padding and spacing)

### Responsive Patterns
- **TextShrink Utility**: Dynamically reduces font sizes on mobile
- **Collapsible Navigation**: Hamburger menu on mobile
- **Flexible Images**: Scale to container width
- **Stacked Layout**: Single column on all devices
- **Touch-Friendly**: Adequate tap target sizes (minimum 44px)

### Mobile Optimizations
- Reduced padding (20px vs 80-100px)
- Smaller font sizes (scaling via TextShrink)
- Simplified navigation
- Optimized image loading

---

## Design Patterns

### Minimalism
- White space as a design element
- Limited color palette (mostly monochrome + accent)
- Clean typography without decorative fonts
- No gradients or complex patterns

### Content Hierarchy
- Clear visual hierarchy through size and spacing
- Important content gets more space
- Consistent heading sizes
- Strategic use of color for emphasis

### Accessibility
- Sufficient color contrast ratios
- Focus states on interactive elements
- Semantic HTML structure
- Readable font sizes (minimum 16px body)

### Performance
- System fonts (no web font loading)
- Optimized images
- Minimal JavaScript for core functionality
- CDN-delivered assets (Squarespace)

---

## Technical Implementation

### Framework
- **Platform**: Squarespace (managed CMS)
- **CSS Delivery**: Minified, CDN-hosted
- **JavaScript**: Minimal, utility-based (TextShrink, menu toggle)
- **Analytics**: Google Analytics integrated

### Third-Party Integrations
- **Google Fonts**: Framework available (TypeKit)
- **reCAPTCHA**: Form validation support
- **Social Media**: LinkedIn profile integration
- **Privacy**: GDPR-compliant privacy policy

### Best Practices
- Mobile-first responsive design
- Semantic HTML5 markup
- Progressive enhancement
- Clean, maintainable code structure

---

## Design Philosophy

The website embodies a clean, minimal aesthetic that prioritizes:

1. **Content Readability**: Clear typography and ample white space
2. **Professional Presentation**: Understated elegance over flashy design
3. **User Experience**: Intuitive navigation and fast loading
4. **Responsive Design**: Seamless experience across all devices
5. **Accessibility**: Inclusive design for all users
6. **Performance**: Optimized assets and minimal dependencies
7. **Maintainability**: Simple, clean codebase

### Key Principles
- Less is more - remove unnecessary elements
- Hierarchy through spacing and size, not decoration
- Consistency in spacing and typography
- Subtle interactions over dramatic effects
- Content-first approach
