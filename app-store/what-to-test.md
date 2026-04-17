# What to Test — CatTracker v1.0.0 (Build 17)

## Build 17 Changes
- **App Store resubmission**: Build 15 was rejected; Build 17 is a clean rebuild with no source code changes
- Built with manual xcodebuild + automatic signing (not EAS cloud)
- buildNumber bumped from 15 → 17 to replace the rejected build in ASC

## Please Verify (Build 17 — same checklist as Build 15)
- [ ] Tab Bar shows cat icon (3rd tab), not person icon
- [ ] Settings → Reminders: "Feeding Reminder" + "Water Change Reminder" (2 items, no dates)
- [ ] Settings → MORE: "Rate App" and "Contact Support" visible with icons
- [ ] Timeline chart shows appetite trend in orange (not bathroom visits in blue)
- [ ] Home page: "Log Daily Health" button visible and tappable (not hidden behind Tab Bar)
- [ ] Paywall: Orange close button, "Start Free Trial" CTA, loading spinner on tap
- [ ] Paywall: Restore Purchase shows spinner while processing

## Core Features
- [ ] Log daily health data: appetite, activity, weight, notes
- [ ] Quick-tap bathroom and water tracking from Home
- [ ] View health timeline with appetite trend chart
- [ ] Manage cat profile (name, breed, birthday, gender, weight)

## Pro Subscription
- [ ] Paywall displays correctly with monthly ($3.99) and yearly ($29.99) options
- [ ] Purchase flow completes (or shows proper error with loading feedback)
- [ ] Pro badge changes to "Active" after purchase
- [ ] Export PDF vet report (Pro feature)
- [ ] Restore purchase works

## Internationalization
- [ ] App detects device language automatically
- [ ] All UI text displays in correct language
- [ ] 12 languages supported: EN, ZH-Hans, ZH-Hant, JA, KO, DE, FR, ES, RU, IT, AR, ID

## Known Limitations
- Free users limited to 1 cat
- Trend charts require at least 2 days of data to show meaningful results
- PDF export requires Pro subscription
