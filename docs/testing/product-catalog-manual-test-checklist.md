# Product Catalog Display System - Manual Test Checklist

## Test Environment Setup
- [ ] Clear browser cache and cookies
- [ ] Test in Chrome, Firefox, Safari (desktop)
- [ ] Test in Chrome, Safari (mobile)
- [ ] Ensure Firebase emulator is running (if testing locally)
- [ ] Verify test data is loaded in Firestore

## 1. Product Catalog Page Tests (`/shop.html`)

### Page Load & Initial Display
- [ ] Page loads within 3 seconds on 3G connection
- [ ] All 3 sample trio products display correctly
- [ ] Product images load properly
- [ ] Loading skeleton appears while fetching data
- [ ] No console errors on page load

### Category Filtering
- [ ] "All Collections" filter shows all products
- [ ] "Digestive Support" filter shows only digestive products
- [ ] "Stress Relief" filter shows only stress relief products
- [ ] "Immunity Boost" filter shows only immunity products
- [ ] Active filter button has correct styling
- [ ] Empty state appears when no products in category

### Product Card Display
- [ ] Product name displays correctly
- [ ] Product price shows in correct format ($XX.XX)
- [ ] Category badge shows correct category
- [ ] Description is properly truncated
- [ ] "Caffeine Free" badge appears for applicable products
- [ ] Inventory warning shows when < 10 items
- [ ] "Out of Stock" state displays correctly

### Responsive Design
- [ ] Grid layout: 3 columns on desktop
- [ ] Grid layout: 2 columns on tablet
- [ ] Grid layout: 1 column on mobile
- [ ] All text remains readable at all sizes
- [ ] Buttons remain clickable on touch devices

## 2. Product Detail Page Tests (`/product.html`)

### Navigation & URL Handling
- [ ] Clicking "View Details" navigates to correct product
- [ ] URL contains correct product ID parameter
- [ ] Invalid product ID shows error message
- [ ] Back to shop link works correctly
- [ ] Breadcrumbs display correctly

### Product Information Display
- [ ] Product images display at correct size
- [ ] Product name appears in title and H1
- [ ] Description displays fully
- [ ] Price displays correctly
- [ ] Category badge shows
- [ ] Organic certification badge displays

### Tabbed Content
- [ ] Ingredients tab shows all ingredients
- [ ] Ingredients have checkmark icons
- [ ] Health benefits tab shows all benefits
- [ ] Benefits have proper icons
- [ ] Brewing instructions tab shows full text
- [ ] Pro tip box displays in brewing tab
- [ ] Tab switching works smoothly
- [ ] Active tab has correct styling

### Add to Cart Functionality
- [ ] Add to Cart button is clickable
- [ ] Button shows loading state (if implemented)
- [ ] Out of stock products show disabled button
- [ ] Click triggers analytics event
- [ ] Success feedback shown to user

### SEO & Meta Tags
- [ ] Page title updates with product name
- [ ] Meta description contains product info
- [ ] Open Graph tags populated correctly
- [ ] Structured data present in page source

## 3. Analytics Tracking Tests

### Page View Tracking
- [ ] Shop page view tracked on load
- [ ] Product detail page view tracked
- [ ] Correct page paths recorded

### User Interaction Tracking
- [ ] Category filter clicks tracked
- [ ] Product view clicks tracked
- [ ] Add to cart clicks tracked
- [ ] Scroll depth tracked (25%, 50%, 75%, 100%)

### Event Data Validation
- [ ] Product ID included in events
- [ ] Product name included in events
- [ ] Price data formatted correctly
- [ ] Category data included
- [ ] Source parameter correct (catalog/product_detail)

## 4. Performance Tests

### Load Time Metrics
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ✓ ] Total page size < 2MB
- [ ] Images use lazy loading
- [ ] No render-blocking resources

### JavaScript Performance
- [ ] No memory leaks on repeated navigation
- [ ] Smooth scrolling performance
- [ ] Filter transitions are smooth
- [ ] No jank during interactions

## 5. Accessibility Tests

### Keyboard Navigation
- [ ] All interactive elements reachable via keyboard
- [ ] Focus indicators visible
- [ ] Tab order is logical
- [ ] Skip links available (if implemented)

### Screen Reader Compatibility
- [ ] Images have alt text
- [ ] Buttons have descriptive labels
- [ ] Form inputs properly labeled
- [ ] ARIA attributes used correctly
- [ ] Heading hierarchy is correct

### Color & Contrast
- [ ] Text meets WCAG AA contrast ratios
- [ ] Interactive elements have sufficient contrast
- [ ] Color not sole indicator of state

## 6. Cross-Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest): Full functionality
- [ ] Firefox (latest): Full functionality
- [ ] Safari (latest): Full functionality
- [ ] Edge (latest): Full functionality

### Mobile Browsers
- [ ] iOS Safari: Touch interactions work
- [ ] Chrome Android: Touch interactions work
- [ ] Firefox Android: Basic functionality

## 7. Error Handling

### Network Issues
- [ ] Offline message displays appropriately
- [ ] Failed requests show error state
- [ ] Retry mechanisms work (if implemented)

### Data Issues
- [ ] Missing product images handled gracefully
- [ ] Missing product data shows placeholders
- [ ] Invalid data doesn't break the page

## 8. Security Considerations

### Data Validation
- [ ] XSS: Product names with HTML are escaped
- [ ] URL parameters are validated
- [ ] No sensitive data in console logs
- [ ] HTTPS enforced in production

## Test Results Summary

- **Date Tested**: _____________________
- **Tester Name**: _____________________
- **Browser/Device**: _____________________
- **Pass Rate**: _____ / _____ tests passed
- **Critical Issues Found**: _____________________
- **Notes**: _____________________

## Known Issues / Limitations

1. Cart functionality shows placeholder message (to be implemented in future story)
2. Related products section is placeholder only
3. Product reviews/ratings are hardcoded in structured data