---
name: Buslingo
colors:
  surface: '#131318'
  surface-dim: '#131318'
  surface-bright: '#39383e'
  surface-container-lowest: '#0e0e13'
  surface-container-low: '#1b1b20'
  surface-container: '#1f1f25'
  surface-container-high: '#2a292f'
  surface-container-highest: '#35343a'
  on-surface: '#e4e1e9'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e4e1e9'
  inverse-on-surface: '#303036'
  outline: '#908f9e'
  outline-variant: '#454653'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#131e8c'
  primary-container: '#818cf8'
  on-primary-container: '#101b8a'
  inverse-primary: '#4953bc'
  secondary: '#c7c5d5'
  on-secondary: '#2f2f3c'
  secondary-container: '#464553'
  on-secondary-container: '#b5b3c3'
  tertiary: '#f7bd3e'
  on-tertiary: '#402d00'
  tertiary-container: '#c08d00'
  on-tertiary-container: '#3e2b00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000767'
  on-primary-fixed-variant: '#2f3aa3'
  secondary-fixed: '#e3e1f1'
  secondary-fixed-dim: '#c7c5d5'
  on-secondary-fixed: '#1a1b26'
  on-secondary-fixed-variant: '#464553'
  tertiary-fixed: '#ffdea3'
  tertiary-fixed-dim: '#f7bd3e'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#131318'
  on-background: '#e4e1e9'
  surface-variant: '#35343a'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base_grid: 4px
  margin_desktop: 64px
  margin_tablet: 32px
  margin_mobile: 20px
  gutter: 24px
  card_padding_std: 20px
  card_padding_feat: 28px
---

## Brand & Style

The design system is engineered for **Buslingo**, an AI-powered Business English platform. The brand personality is authoritative yet modern, positioning itself as a high-performance tool rather than a casual game. It targets global professionals who value efficiency, precision, and clarity.

The visual direction follows a **Modern Corporate / Minimalist** aesthetic, heavily influenced by developer-centric tools. It utilizes a deep dark-mode palette to reduce eye strain during long study sessions. The interface is strictly functional and systematic, avoiding all stock photography or whimsical illustrations in favor of **abstract geometric shapes** and data visualizations. The emotional response should be one of "controlled focus" and "professional advancement."

## Colors

This design system uses a **monochromatic dark foundation** with a single high-saturation Indigo accent to direct user attention.

- **Primary Accent**: Indigo (#818CF8) is used exclusively for interactive elements, progress indicators, and brand highlights.
- **Surface Hierarchy**: We use three tiers of darkness to create depth: Base (#0A0A0F), Elevated Card (#131318), and Interactive Input (#1C1C23).
- **Semantics**: Standardized colors for feedback loops. These should be used sparingly as text or thin borders to maintain the dark aesthetic without becoming "noisy."

## Typography

The design system relies entirely on **Inter** to achieve a systematic, neutral look. 

- **Weight Usage**: Use Bold (700) for large display text, Semibold (600) for UI headings, and Regular (400) for all body text.
- **Readability**: For long-form business articles or lesson text, use `body-lg` with increased line-height to ensure maximum comprehension.
- **Micro-copy**: Labels and metadata should use `label-sm` with slightly increased letter spacing for clarity against dark backgrounds.

## Layout & Spacing

This design system is built on a **4px geometric grid**. All dimensions, padding, and margins must be multiples of 4.

- **Grid System**: A 12-column fluid grid is used for desktop (breakpoint 1280px+). 
- **Page Composition**: Standard pages utilize a wide 64px outer margin to provide breathing room, reinforcing the "minimalist" feel.
- **Reflow**: On mobile, the 12-column layout collapses to a single column with 20px side margins. Cards should transition from horizontal layouts to vertical stacks.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy drop shadows.

- **Layer 0 (Base)**: #0A0A0F — The primary canvas.
- **Layer 1 (Cards)**: #131318 — Used for content blocks. These feature a 1px solid border (#242430) to define edges against the background.
- **Layer 2 (Overlays/Popovers)**: #1C1C23 — Used for modals or tooltips. These should have a very subtle, diffused shadow (Black, 40% opacity, 20px blur) to provide separation.
- **Interactions**: On hover, cards may increase their border brightness to #3F3F4E or add a subtle Indigo glow at the base.

## Shapes

The shape language is structured and "squircle" adjacent, avoiding perfectly circular edges for a more professional tone.

- **Standard Elements**: Buttons and inputs use a 10px radius to appear modern but grounded.
- **Containers**: Content cards use a 14px radius, creating a clear nesting relationship when 10px elements are placed inside them.
- **Icons**: Lucide Icons should be used with a 1.5px stroke width. All icons must be framed in square containers (24x24px or 32x32px) to maintain the grid.

## Components

### Buttons
- **Primary**: Indigo (#818CF8) background with dark (#0A0A0F) text. For Hero sections, use a 14px radius and 56px height. For standard UI, use a 10px radius and 40px height.
- **Secondary**: Transparent background with an Indigo border and text. 
- **Ghost**: No background/border; Indigo or White text. Used for less prominent actions.

### Inputs
- **Text Fields**: Background #1C1C23, 1px border #242430. Height is fixed at 48px. Placeholder text should be #52525B. Focus state should change the border color to Indigo (#818CF8).

### Cards
- **Standard**: 14px radius, 20px padding.
- **Featured/Hero**: 14px radius, 28px padding. These may include a very subtle gradient stroke or an abstract geometric pattern in the background.

### Lessons & AI Elements
- **Progress Bars**: 4px height, track color #242430, fill color #818CF8.
- **Abstract Graphics**: Use wireframe-style geometric shapes (lines, circles, grids) in #242430 to fill empty states or section headers. No photography allowed.