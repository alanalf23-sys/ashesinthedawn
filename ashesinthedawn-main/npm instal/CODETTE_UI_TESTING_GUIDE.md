# Codette UI Testing Guide - Complete Functionality Check

**Last Updated**: November 26, 2025  
**Status**: ✅ All UI Fixes Applied

## Overview

This guide provides step-by-step instructions to verify complete functionality of all Codette AI UI interactions in CoreLogic Studio.

---

## System Requirements

- ✅ Backend running: `http://localhost:8000`
- ✅ Frontend running: `http://localhost:5173`
- ✅ Codette AI engine initialized
- ✅ 0 TypeScript errors

---

## Part 1: Initial Application Load

### Step 1: Open Application
1. Navigate to `http://localhost:5173` in browser
2. **Expected**: DAW loads with welcome modal
3. **Verify**: 
   - No console errors (F12 → Console tab)
   - All main components visible (sidebar, timeline, mixer)
   - Bottom mixer panel shows properly

### Step 2: Create a Project
1. In welcome modal, click "Create New Project"
2. **Expected**: Modal closes, empty DAW opens
3. **Verify**: 
   - Timeline shows grid
   - Mixer shows "Master" strip only
   - Sidebar visible on both sides

---

## Part 2: Mixer Basic Functionality

### Step 3: Add Audio Tracks
1. Right-click in mixer or double-click empty area
2. Select "Add Audio Track" 
3. Repeat to add 3-4 audio tracks
4. **Expected**: 
   - Each track appears in mixer as a vertical strip
   - Tracks numbered sequentially (Audio 1, Audio 2, etc.)
   - Each has volume fader, level meter, color indicator
   - No black screens in mixer area

### Step 4: Test Track Selection
1. Click on each track's header
2. **Expected**:
   - Selected track highlights with blue border
   - "Select a track" message changes to show track name
   - Properties update in mixer controls below

### Step 5: Test Volume Controls
1. Select a track
2. Drag the fader up/down
3. **Expected**:
   - Volume changes smoothly
   - dB value updates below fader
   - Level meter responds (green/yellow/red)
   - No stuttering or lag

---

## Part 3: Codette Suggestions Tab

### Step 6: Access Suggestions Tab
1. Ensure a track is selected (from Step 4)
2. In mixer's Codette section at bottom, click **"💡 Suggestions"** tab
3. **Expected**:
   - Tab becomes highlighted (blue background)
   - Loading indicator appears briefly (spinning "⟳")
   - Panel shows suggestion cards with content (not black!)
   - Clear text on gray background with good contrast

### Step 7: Verify Suggestion Content
1. Look at displayed suggestions
2. Each suggestion card should show:
   - ✅ **Title**: Bold, clear text (e.g., "Enhance Bass Presence")
   - ✅ **Description**: Explanation of suggestion
   - ✅ **Category Badge**: Blue badge showing category (mixing, eq, dynamics, etc.)
   - ✅ **Type & Confidence**: "Type: parameter | Confidence: 85%"
   - ✅ **Parameters Section**: Shows parameter names and values
   - ✅ **Apply Button**: Blue "Apply to [Track Name]" button at bottom

### Step 8: Test Suggestion Application
1. Click "Apply to [Track Name]" on a suggestion
2. **Expected**:
   - Button changes to show confirmation (green "Confirm" + "Cancel")
   - Clicking "Confirm" applies suggestion
   - Button shows "Applying..." briefly
   - Track properties update (volume, pan, etc.)
   - Confirmation section clears

### Step 9: Test Scrolling in Suggestions
1. If many suggestions appear, scroll down in Codette panel
2. **Expected**:
   - Smooth scrolling
   - All cards render with text visible
   - No jumpy rendering or performance issues
   - Scrollbar appears when needed

### ⚠️ Known Behavior
- If no track is selected: "Select a track to see suggestions"
- If Codette not connected: Yellow warning "Codette AI not connected"
- First load may take 2-3 seconds to fetch suggestions

---

## Part 4: Codette Analysis Tab

### Step 10: Access Analysis Tab
1. Ensure a track is still selected
2. Click **"📊 Analysis"** tab in Codette section
3. **Expected**:
   - Tab highlights blue
   - Shows **"Analyze Track"** button prominently
   - Panel displays cleanly (not black!)
   - Good text contrast on gray background

### Step 11: Run Track Analysis
1. Click **"Analyze Track"** button
2. **Expected**:
   - Button shows "Analyzing..." with spinner
   - Loading indicator appears briefly
   - Analysis results display after 2-3 seconds:
     - ✅ **Quality Score**: Progress bar showing percentage
     - ✅ **Recommendations**: List of "✓ " checkmarks with suggestions
     - ✅ **Results**: Key-value pairs (frequency balance, dynamics, etc.)

### Step 12: Test Analysis Display
1. Verify all analysis results show properly:
   - Quality score bar fills to correct percentage
   - Recommendations display with green checkmarks
   - Results show numerical values formatted to 2 decimals
   - Colors are visible (green for quality, blue for labels)

### Step 13: Test Analysis Scrolling
1. Scroll down if analysis results are long
2. **Expected**:
   - Smooth scrolling within analysis panel
   - Text remains readable
   - No cutoff or overlapping content

---

## Part 5: Codette Control Tab

### Step 14: Access Control Tab
1. Click **"⚙️ Control"** tab in Codette section
2. **Expected**:
   - Tab highlights blue
   - Panel shows collapsible sections (Connection Status, Production Checklist, AI Perspectives, Conversation)
   - All sections render with visible text (not black!)
   - Good color contrast

### Step 15: Check Connection Status
1. Look at **"Connection Status"** section at top
2. **Expected**:
   - Shows green dot and "Connected" if backend is running
   - Shows REST: ✓ and WebSocket: ✓
   - Reconnect count and resyncing status visible

### Step 16: Test Production Checklist
1. Click **"Production Checklist"** header to expand
2. **Expected**:
   - Section expands showing progress bar
   - Shows 6 production tasks with descriptions
   - Each task has priority label (high/medium/low in different colors)
   - Tasks have unchecked circle icons
   - Progress bar shows 0% initially

### Step 17: Test Checklist Interaction
1. Click on a task to toggle completion
2. **Expected**:
   - Icon changes from circle to checkmark (green)
   - Text shows strikethrough
   - Progress bar updates percentage
   - Can toggle multiple tasks on/off

### Step 18: Test AI Perspectives
1. Click **"AI Perspectives"** header to expand
2. **Expected**:
   - Shows 3 perspective options:
     - Audio Engineer (technical perspective)
     - Music Producer (creative focus)
     - Mastering Engineer (loudness & clarity)
   - One perspective active (purple highlight)
   - Can click to switch active perspective

### Step 19: Test Conversation Panel
1. Click **"Conversation"** header to expand
2. **Expected**:
   - Shows initial greeting message from Codette
   - Message displays with confidence score
   - Input field at bottom with "Ask Codette..." placeholder
   - Send button active when text entered

### Step 20: Send Conversation Message
1. Type a message in the input (e.g., "How are you?")
2. Press Enter or click Send
3. **Expected**:
   - Message appears as blue bubble on right (user)
   - Input clears
   - Assistant response appears as gray bubble on left
   - Response shows "Confidence: XX%" below message

---

## Part 6: Mixer Layout Verification

### Step 21: Verify Mixer Sections
1. Look at bottom mixer panel with all three sections visible:
   - **Top**: Master strip with fader (yellow border) - should be ~64px tall
   - **Middle**: Audio track strips - should be ~64px tall
   - **Bottom**: Three tabs (Suggestions, Analysis, Control) - should take remaining space
2. **Expected**:
   - Master strip clearly visible
   - All track strips fit horizontally
   - Horizontal scrollbar appears if many tracks
   - Codette section below shows selected tab content

### Step 22: Test Tab Switching
1. Rapidly click between Suggestions, Analysis, and Control tabs
2. **Expected**:
   - Tab switches instantly
   - No flickering or black screens
   - Content displays immediately
   - Tab header highlights update correctly

### Step 23: Test Mixer with Large Content
1. If suggestions/analysis/control panels have lots of content
2. Try to scroll within the Codette panel
3. **Expected**:
   - Scroll works smoothly
   - Mixer tracks remain visible above
   - Plugin rack visible above Codette section
   - No overlap or layout breaking

---

## Part 7: Responsive Layout Testing

### Step 24: Resize Browser Window
1. Resize window by dragging edges smaller
2. **Expected**:
   - UI responds gracefully
   - Mixer strips shrink proportionally
   - Text remains readable
   - Scrollbars appear as needed
   - No content hidden or cut off

### Step 25: Test on Different Screen Sizes
1. Try resizing to:
   - Narrow (1024px wide) - should show scrollbars
   - Very wide (1920px) - all tracks visible horizontally
   - Tall (1080px) - all sections visible vertically
   - Short (600px) - should still be usable with scrolling
2. **Expected**:
   - UI adapts smoothly
   - No broken layouts
   - All functionality remains accessible

---

## Part 8: Visual Inspection Checklist

### Step 26: Color & Contrast Check
- [ ] **Suggestions panel**: Text visible on gray background
- [ ] **Analysis panel**: Quality score bar is green
- [ ] **Control panel**: All sections have proper contrast
- [ ] **Buttons**: Blue "Apply" buttons clearly visible
- [ ] **Status indicators**: Green/red dots show connection status
- [ ] **Text**: All text is readable (not blurry or too small)

### Step 27: No Black Screens Verification
- [ ] Clicking "💡 Suggestions" shows content (not black)
- [ ] Clicking "📊 Analysis" shows content (not black)
- [ ] Clicking "⚙️ Control" shows content (not black)
- [ ] Scrolling in any section works smoothly
- [ ] No flashing or flickering when switching tabs

### Step 28: Performance Check
- [ ] Tab switching is instant (no lag)
- [ ] Scrolling is smooth (60fps feel)
- [ ] Loading indicators appear briefly (2-3 sec max)
- [ ] No console errors when interacting with UI
- [ ] CPU usage stays reasonable (<50%)

---

## Part 9: Edge Case Testing

### Step 29: Test No Track Selected
1. Delete all tracks (right-click → Delete)
2. Try to access Codette tabs
3. **Expected**:
   - Suggestions shows: "Select a track to see suggestions"
   - Analysis shows: "Select a track to analyze"
   - Control panel still works

### Step 30: Test with No Backend
1. Stop Python backend (Ctrl+C in backend terminal)
2. Check Codette connection status
3. **Expected**:
   - Connection Status shows red dot "Offline"
   - Suggestions shows: "Codette AI not connected"
   - Graceful error handling (no crashes)

### Step 31: Test Rapid Tab Clicking
1. Rapidly click between tabs 10+ times
2. **Expected**:
   - No lag or stuttering
   - Content displays consistently
   - No memory leaks or performance degradation

---

## Part 10: Console Error Verification

### Step 32: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. **Expected**: 
   - ✅ No red error messages
   - ✅ No warnings about "undefined" or "null"
   - ✅ Blue "i" info messages only (normal logging)

### Step 33: Check Network Requests
1. In DevTools, go to Network tab
2. Switch between Codette tabs
3. **Expected**:
   - GET requests to `/codette/status` (200 OK)
   - POST requests to `/codette/suggest` (200 OK)
   - POST requests to `/codette/analyze` (200 OK)
   - No 404 or 500 errors

---

## Completion Checklist

- [ ] Part 1: Application loads without errors
- [ ] Part 2: Mixer controls work smoothly
- [ ] Part 3: Suggestions tab shows content and applies suggestions
- [ ] Part 4: Analysis tab analyzes and displays results
- [ ] Part 5: Control tab shows all sections with interaction
- [ ] Part 6: Mixer layout is properly proportioned
- [ ] Part 7: Responsive layout works at different sizes
- [ ] Part 8: All visual elements are visible and properly colored
- [ ] Part 9: Edge cases handled gracefully
- [ ] Part 10: No console errors or network failures

---

## Troubleshooting

### Issue: Black screen on Suggestions tab
**Solution**: 
- Check browser console for errors (F12)
- Verify backend is running: `http://localhost:8000/health`
- Try clearing browser cache (Ctrl+Shift+Delete)
- Refresh page (Ctrl+R)

### Issue: Scrolling not working in Codette panel
**Solution**:
- Check if content actually exceeds container height
- Try scrolling with mouse wheel instead of scrollbar
- Check CSS class `.overflow-y-auto` is applied

### Issue: Text not visible (rendering as white-on-white or black-on-black)
**Solution**:
- Check Tailwind color classes are correct
- Verify `text-gray-100`, `text-gray-300`, `text-gray-400` are used
- Check background colors are `bg-gray-800`, `bg-gray-900`

### Issue: Suggestions not loading
**Solution**:
- Ensure track is selected (blue border around track)
- Check backend logs for errors
- Try analyzing different track
- Restart backend server

---

## Notes for Developers

### Key Layout Fixes Applied (Nov 26, 2025)

1. **Mixer Container**: Changed from `flex-1` to fixed height `h-64` for track strips section
2. **Codette Section**: Changed from `max-h-64` to `flex-1 min-h-0` for dynamic height
3. **Tab Content**: Changed from static `p-4 max-h-64` to `flex-1 overflow-y-auto` for proper scrolling
4. **All Panels**: Added `flex flex-col` and `min-h-0` for proper flex children layout

### CSS Classes to Remember

- **Flex Container**: Always add `min-h-0` to flex children that scroll
- **Overflow Scroll**: Use `overflow-y-auto` with `flex-1` for content areas
- **Fixed Heights**: Use when content size is known (strips, headers)
- **Dynamic Heights**: Use `flex-1` when content fills available space

### Future Improvements

- Add tab persistence (remember last selected tab)
- Add keyboard shortcuts for tab navigation
- Add "keyboard" floating panels outside mixer
- Add drag-to-resize between sections

---

**Last Verified**: November 26, 2025  
**Status**: ✅ All tests passing

