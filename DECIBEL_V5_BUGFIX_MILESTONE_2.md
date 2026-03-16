# DECIBEL MOBILE v5 — BUGFIX MILESTONE 2 (Pre-TestFlight)

> **Purpose:** Final fixes before TestFlight deployment. After this milestone, the app goes to Brendan for testing.
>
> **Method:** Execute sequentially. Commit after each item. Build and deploy to TestFlight when complete.

---

## 1. OTHER USER'S "VIEW ALL" SHOWS MY FINDS, NOT THEIRS

When viewing Brendan's passport and tapping "View All Finds", it shows MY (swarn2099's) finds instead of Brendan's. The full collection screen is not passing the viewed user's fan_id to the query.

**Fix:**
- The "View All" button must pass the fan_id of the profile being viewed, not the current user
- Check the route/navigation params — when navigating from another user's passport to the full collection screen, include `fan_id` as a param
- The full collection screen query must use the passed `fan_id`, not default to the current user's auth ID
- Test: View Brendan's passport → tap "View All" → should show Brendan's artists, not mine

### Acceptance Criteria
- [ ] "View All" on another user's passport shows THEIR finds
- [ ] "View All" on MY passport still shows my finds
- [ ] The fan_id is correctly passed through navigation params

---

## 2. STAMPS SECTION VISUAL REDESIGN

The stamps section on the passport needs to look better. Each stamp should feel like a real passport stamp with the artist photo incorporated.

**Design for each stamp entry:**
- Card with subtle dark background (#15151C in dark, #FFFFFF in light)
- Left side: artist photo (56px circle) with a pink border ring (2px, #FF4D6A)
- Right side: 
  - Artist name (Poppins SemiBold, 15px, primary text color)
  - Venue name below (Poppins Regular, 12px, secondary text color)
  - Date in monospace font (10px, muted color) — format: "MAR 8, 2026"
  - "COLLECTED" label in pink, small caps, monospace
- Far right: a small stamp graphic/icon — use a subtle circular stamp mark with the venue initial inside, rotated slightly (-3° to +3°), in pink with low opacity (like a faded ink stamp)
- Each card has 12px vertical spacing between entries
- Subtle left border accent (3px, pink) on each card for visual rhythm

**Empty state (no stamps yet):**
- Show a centered illustration or icon (stamp/ticket icon in muted color)
- Text: "No stamps yet"
- Subtext: "Check in at a live show to earn your first stamp"
- Pink CTA button: "Find a Show" → navigates to the map/events screen

**Section header:** "Stamps" with stamp count on the right ("3 shows")

### Acceptance Criteria
- [ ] Each stamp has artist photo, name, venue, date, and collection label
- [ ] Subtle stamp graphic on each entry
- [ ] Proper spacing between stamp entries
- [ ] Empty state when no stamps exist
- [ ] Works in both dark and light mode

---

## 3. APP ICON — Use Volume Knob Logo

The app icon needs to use the Decibel volume knob logo that was previously designed. The dark version PNG is at `~/decibel-mobile-v4/../` or can be copied from the outputs.

**Steps:**
1. Copy the logo file to the project: the 1024x1024 PNG is the app icon source
   - The file should be at one of these locations on the VM — find it:
     - `~/decibel-mobile-v4/assets/` 
     - Or download from the outputs directory
   - The filename is `decibel-logo-dark-1024.png`
2. Place it as `assets/icon.png` in the Expo project (1024x1024, no transparency, no rounded corners — Expo/iOS handles the rounding)
3. Also set it as the adaptive icon for Android: `assets/adaptive-icon.png`
4. Update `app.json` or `app.config.ts`:
   ```json
   {
     "expo": {
       "icon": "./assets/icon.png",
       "ios": {
         "icon": "./assets/icon.png"
       },
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#0B0B0F"
         }
       }
     }
   }
   ```
5. The dark logo (deep purple/black background with the volume knob arc) is the one to use — it looks correct on both iOS and Android home screens

### Acceptance Criteria
- [ ] App icon shows the Decibel volume knob logo
- [ ] Icon is 1024x1024 and properly configured in app.json
- [ ] Looks correct on iOS home screen (rounded corners applied by OS)

---

## 4. ONBOARDING FLOW REDESIGN

The onboarding flow (first-time user experience after signup) needs to be polished for TestFlight.

**Onboarding screens (3 swipeable pages + final action):**

**Screen 1: "Your Music Passport"**
- Large illustration or icon: passport/stamp visual
- Headline: "Your Live Music Passport"
- Subtext: "Track every show. Collect every artist. Build your music identity."
- Decibel branding at top

**Screen 2: "Find Artists First"**
- Large illustration or icon: gold star / crown
- Headline: "Be the Founder"
- Subtext: "Discover underground artists before anyone else. Paste a link from Spotify, Apple Music, or SoundCloud to claim your Founder badge."

**Screen 3: "Check In at Shows"**
- Large illustration or icon: location pin / venue
- Headline: "Stamp Your Passport"
- Subtext: "When you're at a show, check in to collect the artists and build your live music diary."

**Final screen: Sign Up / Sign In**
- Email input with OTP flow (already built — reuse the auth components)
- "Get Started" button
- Skip option for browsing (if applicable)

**Design guidelines:**
- Dark background (#0B0B0F)
- Pink accent for CTAs and highlights
- Gold accent for the Founder screen
- Poppins font throughout
- Page indicator dots at the bottom (pink for active, muted for inactive)
- Swipe between pages + "Next" button + "Skip" text link
- Smooth transitions between pages (use PagerView or FlatList with horizontal paging)

### Acceptance Criteria
- [ ] 3 onboarding pages + auth screen
- [ ] Swipeable with page indicator dots
- [ ] Clean, branded design matching the app aesthetic
- [ ] Auth flow works (email OTP)
- [ ] Only shows on first launch (check `hasSeenOnboarding` in uiStore)
- [ ] Works in both themes (but dark is the primary design)

---

## 5. TESTFLIGHT DEPLOYMENT PREP

After all fixes are complete, prepare for TestFlight deployment.

**Steps:**
1. Ensure `eas.json` has a `production` or `preview` profile configured for iOS
2. Ensure the bundle ID is `com.decibel.app`
3. Ensure the EAS project ID is `44471fff-8ba1-46a0-9901-bdaf6ebef534`
4. Run `eas build --platform ios --profile preview` (or `production`)
5. Once the build completes, submit to TestFlight: `eas submit --platform ios`
6. Add Brendan's Apple ID to the TestFlight testers list in App Store Connect
7. Send a Telegram message: "🚀 TestFlight build submitted. Brendan can test once Apple approves (usually 24-48hrs)."

**Pre-build checklist:**
- [ ] All 4 bugs above are fixed and committed
- [ ] App icon is set to volume knob logo
- [ ] Onboarding flow works on fresh install
- [ ] Auth persists after force quit
- [ ] Activity feed loads
- [ ] Finds grid shows on passport
- [ ] Artist profile loads correctly
- [ ] Add Artist (link paste) works for SoundCloud and Apple Music
- [ ] Spotify link paste works
- [ ] Artists over 1M listeners are rejected
- [ ] Search for users works
- [ ] Other user's profile shows their data
- [ ] Both dark and light mode look correct
- [ ] No crashes on any screen

---

## Execution Notes

- **Item 1 is the quickest fix** — just a navigation param bug
- **Item 2 (stamps redesign) is visual work** — take time to make it look good
- **Item 3 (app icon) is a 2-minute config change**
- **Item 4 (onboarding) is the biggest task** — build it clean
- **Item 5 is deployment** — only do this after everything else passes
- **Commit after each item:** `fix(mobile): v5-bugfix-2 — [description]`
- **Test both themes after every change**
- **Push to origin after all fixes**
- **Build for TestFlight after all items complete**
