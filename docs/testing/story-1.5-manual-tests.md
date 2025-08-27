# Manual Test Checklist - Story 1.5: Landing Page and Navigation

## Test Environment Setup
- [ ] Clear browser cache and cookies
- [ ] Disable any ad blockers or extensions
- [ ] Have network throttling tools ready (Chrome DevTools)

## Desktop Testing (1920x1080, 1366x768)

### Homepage Load
- [ ] Page loads in under 3 seconds on broadband
- [ ] All images load correctly with proper aspect ratios
- [ ] Fonts (Playfair Display and Inter) load correctly
- [ ] No console errors on page load

### Navigation Component
- [ ] Logo links to homepage
- [ ] Shop dropdown shows on hover with smooth animation
- [ ] All navigation links work correctly
- [ ] Active page is highlighted in navigation
- [ ] Auth section shows "Sign In" and "Sign Up" when logged out
- [ ] Auth section shows "My Account" and "Sign Out" when logged in
- [ ] Admin link appears for admin@vita-tea.com user

### Hero Section
- [ ] Hero image loads with parallax effect on scroll
- [ ] Text is readable over hero image
- [ ] Both CTA buttons are clickable
- [ ] "Take the Wellness Quiz" button shows disabled state

### Dual Entry Section
- [ ] Both cards have hover effects
- [ ] "Shop Now" button links to /shop.html
- [ ] "Coming Soon" button is properly disabled

### Category Cards
- [ ] All three cards link to correct filtered shop pages
- [ ] Hover effects work on all cards
- [ ] Icons animate on hover

### Sample Trio Section
- [ ] Image loads correctly
- [ ] Price badge is visible
- [ ] CTA links to shop with correct product parameter

### Educational Content
- [ ] All benefit icons display correctly
- [ ] Text is readable and properly spaced

### Social Proof
- [ ] Star ratings display correctly
- [ ] Testimonials are readable

### Footer
- [ ] All links have hover states
- [ ] Newsletter form shows validation for empty email
- [ ] Newsletter form accepts valid email format
- [ ] Subscribe button shows loading state
- [ ] Success message appears after subscription

## Mobile Testing (iPhone 12, Pixel 5)

### Responsive Design
- [ ] Navigation collapses to hamburger menu
- [ ] Hamburger menu opens/closes smoothly
- [ ] Mobile menu shows all navigation items
- [ ] Hero text scales appropriately
- [ ] All sections stack vertically
- [ ] Images maintain aspect ratio
- [ ] CTAs are tap-friendly (min 44x44px)

### Touch Interactions
- [ ] Hamburger menu responds to tap
- [ ] All buttons have touch feedback
- [ ] Scrolling is smooth
- [ ] No horizontal scroll appears

## Tablet Testing (iPad, 768x1024)

### Layout
- [ ] Navigation shows desktop or mobile version appropriately
- [ ] Grid layouts adjust to 2 columns where applicable
- [ ] Images scale correctly
- [ ] Text remains readable

## Performance Testing

### Page Load (Chrome DevTools Network Tab)
- [ ] Total page weight under 3MB
- [ ] Hero image loads with priority
- [ ] Other images lazy load correctly
- [ ] No render-blocking resources

### 3G Simulation
- [ ] Page loads under 3 seconds
- [ ] Critical content appears first
- [ ] Images load progressively

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible on all elements
- [ ] Skip to main content link works
- [ ] Escape key closes mobile menu

### Screen Reader (NVDA/JAWS)
- [ ] Page title announced correctly
- [ ] Navigation landmarks identified
- [ ] Headings create logical structure
- [ ] Images have meaningful alt text
- [ ] Form labels announced correctly
- [ ] Button purposes clear

### Color Contrast
- [ ] Text meets WCAG AA standards
- [ ] Buttons have sufficient contrast
- [ ] Links distinguishable from text

## Cross-Browser Testing

### Chrome (Latest)
- [ ] All features work as expected
- [ ] No console errors
- [ ] Smooth animations

### Firefox (Latest)
- [ ] All features work as expected
- [ ] CSS renders correctly
- [ ] Web fonts load

### Safari (Latest)
- [ ] All features work as expected
- [ ] No iOS-specific issues
- [ ] Touch events work correctly

### Edge (Latest)
- [ ] All features work as expected
- [ ] No rendering issues

## Analytics Testing

### Event Tracking (Check Network Tab)
- [ ] Page view tracked on load
- [ ] CTA clicks tracked with correct labels
- [ ] Category card clicks tracked
- [ ] Newsletter subscription attempt tracked
- [ ] Section views tracked on scroll

## Error Scenarios

### Network Issues
- [ ] Page shows appropriate error if Firebase fails
- [ ] Images have proper fallbacks
- [ ] Analytics failures don't break functionality

### JavaScript Disabled
- [ ] Basic content still accessible
- [ ] Navigation links work
- [ ] Reasonable fallback experience

## Security Testing

### Content Security
- [ ] No sensitive data in console logs
- [ ] External resources loaded over HTTPS
- [ ] No exposed API keys

## Regression Testing

### Existing Features
- [ ] Authentication flow still works
- [ ] Firebase connection maintained
- [ ] No conflicts with existing services

## Sign-Off Checklist

- [ ] All test scenarios pass
- [ ] No critical bugs found
- [ ] Performance meets requirements
- [ ] Accessibility standards met
- [ ] Cross-browser compatibility confirmed
- [ ] Analytics tracking verified

---

**Tester:** ________________  
**Date:** ________________  
**Environment:** ________________  
**Notes:** ________________