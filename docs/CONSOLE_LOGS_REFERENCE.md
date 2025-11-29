# 🎯 Console Log Reference - Integration Functions Active

**These console logs appear when each integration function executes:**

---

## 1️⃣ Genre Template Application

**Console Output**:
```
[CODETTE→DAW] Detected genre: Electronic (89% confidence)
[CODETTE→DAW] Applying genre template: Electronic
```

**Trigger**: User clicks "Analyze Genre (Real API)" → Codette AI detects genre → Auto-applies to track

---

## 2️⃣ Delay Sync to Effects

**Console Output**:
```
[CODETTE→DAW] Applied delay sync to effect: 500ms
```

**Trigger**: User clicks a delay value (e.g., "Quarter Note: 500ms") → Auto-applied to delay plugin

---

## 3️⃣ Production Progress Tracking

**Console Output**:
```
[CODETTE→DAW] Production stage: mixing, Tasks completed: 0
[CODETTE→DAW] Production stage: mastering, Tasks completed: 0
```

**Trigger**: User selects production stage → Loads checklist → Session metadata updated

---

## 4️⃣ Smart EQ Recommendations

**Console Output**:
```
[CODETTE→DAW] Applying smart EQ recommendations from instrument data
```

**Trigger**: User selects instrument (e.g., "Kick Drum") → Loads data → Suggested EQ auto-applied

---

## 5️⃣ Ear Training Integration

**Console Output**:
```
[CODETTE→DAW] Playing frequency pair for ear training: 440Hz → 550Hz (1000ms)
[CODETTE→DAW] Ear training loaded: Reference frequency 440Hz
```

**Trigger**: User loads ear training exercise → Frequency data ready → Audio playback prepared

---

## 🔍 How to Monitor Console Logs

### In Browser DevTools:
1. Press **F12** to open DevTools
2. Click **Console** tab
3. Watch for messages starting with `[CODETTE→DAW]`

### Example Console Session:
```
[CodetteAdvancedTools] Delay sync loaded: 9 note divisions
[CODETTE→DAW] Applied delay sync to effect: 500ms
[CodetteAPI] Ear training data loaded
[CODETTE→DAW] Ear training loaded: Reference frequency 440Hz
[CODETTE→DAW] Production stage: mixing, Tasks completed: 0
[CODETTE→DAW] Detected genre: Electronic (89% confidence)
[CODETTE→DAW] Applying genre template: Electronic
[CODETTE→DAW] Applying smart EQ recommendations from instrument data
```

---

## 🎬 Real Usage Scenario

**Step 1: Detect Genre**
```
User → Codette Tools → Genre Detection tab → Click "Analyze Genre"
Console Output:
  [CODETTE→DAW] Detected genre: Electronic (89% confidence)
  [CODETTE→DAW] Applying genre template: Electronic
Result: Track's genre metadata updated to "Electronic"
```

**Step 2: Load Production Checklist**
```
User → Codette Tools → Checklist tab → Select "Mixing" → Click "Load Real Checklist"
Console Output:
  [CODETTE→DAW] Production stage: mixing, Tasks completed: 0
Result: Session knows we're in mixing phase, can save this state
```

**Step 3: Apply Instrument EQ**
```
User → Codette Tools → Instruments tab → Select "Kick Drum" → Click "Load Real Instrument Data"
Console Output:
  [CODETTE→DAW] Applying smart EQ recommendations from instrument data
Result: EQ plugin on track auto-configured with kick drum presets
```

**Step 4: Copy Delay Sync Value**
```
User → Codette Tools → Delay Sync tab → Click "Quarter Note: 500ms"
Console Output:
  [CODETTE→DAW] Applied delay sync to effect: 500ms
Result: Delay plugin time set to 500ms, value copied to clipboard
```

**Step 5: Load Ear Training**
```
User → Codette Tools → Ear Training tab → Select "Interval Recognition" → Load Data
Console Output:
  [CODETTE→DAW] Ear training loaded: Reference frequency 440Hz
  [CODETTE→DAW] Playing frequency pair for ear training: 440Hz → 550Hz (1000ms)
Result: Ready to play interval pairs through DAW audio engine
```

---

## ✅ Verification Checklist

Check these console logs appear when using CodetteAdvancedTools:

- [ ] `[CODETTE→DAW] Applying genre template:` appears after genre detection
- [ ] `[CODETTE→DAW] Applied delay sync to effect:` appears after clicking delay value
- [ ] `[CODETTE→DAW] Production stage:` appears after loading checklist
- [ ] `[CODETTE→DAW] Applying smart EQ recommendations:` appears after loading instrument
- [ ] `[CODETTE→DAW] Ear training loaded:` appears after loading exercise
- [ ] `[CODETTE→DAW] Playing frequency pair:` appears in ear training

If all logs appear → **All 5 integrations working correctly** ✅

---

## 🔧 Troubleshooting

**If logs don't appear:**
1. Check DevTools Console is open (F12)
2. Make sure "Verbose" logging is enabled
3. Verify backend is running (codette_server.py)
4. Check Network tab for API responses
5. Verify no error messages in console

**If track isn't updated:**
1. Make sure a track is selected
2. Check track has audio plugins loaded
3. Verify selectedTrack !== null in component
4. Check browser console for errors

---

**All integration functions logged and ready for testing!** 🚀
