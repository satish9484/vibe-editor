# AI Suggestion Timeout and Lifecycle

## ⏱️ Suggestion Timeout: **5 Seconds**

Your AI suggestions automatically close after **5 seconds** if not accepted.

## How It Works

### Automatic Timeout

When a suggestion is generated:

1. **Suggestion Generated** → User sees the inline suggestion
2. **Timer Starts** → 5-second countdown begins
3. **Action Options**:
   - **Accept (Tab)** → Suggestion is applied to code
   - **Reject** → Suggestion is dismissed
   - **Keep Typing** → Suggestion stays visible
   - **5 Seconds Pass** → Suggestion auto-expires

### Code Implementation

The timeout logic is in `playground-editor.tsx`:

```typescript
// Clear stale suggestions after a delay
const clearStaleSuggestion = useCallback(() => {
  if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
    const now = Date.now();
    const suggestionAge =
      now - parseInt(currentSuggestionRef.current.id.split('-')[1]);

    // Clear suggestions older than 5 seconds
    if (suggestionAge > 5000) {
      console.log('Clearing stale suggestion (older than 5 seconds)');
      clearCurrentSuggestion();
    }
  }
}, [clearCurrentSuggestion]);
```

### Timeout Logic

```typescript
const SUGGESTION_TIMEOUT = 5000; // 5 seconds in milliseconds

// Check every second
setInterval(() => {
  const age = Date.now() - suggestionTimestamp;
  if (age > SUGGESTION_TIMEOUT) {
    // Auto-close stale suggestions
    clearSuggestion();
  }
}, 1000);
```

## Why 5 Seconds?

The 5-second timeout is optimal because:

✅ **Long enough** - Gives users time to read and evaluate the suggestion  
✅ **Short enough** - Prevents stale suggestions from cluttering the editor  
✅ **Performance** - Balances UX with resource management  
✅ **Industry standard** - Similar to GitHub Copilot and VS Code IntelliSense

## Suggestion Lifecycle

### Timeline

```
0s  ──────────── Suggestion Appears
                 [User can accept with Tab]
                 [User can reject with Escape]
                 [User can keep typing]

5s  ──────────── Auto-Close Timer
                 [Suggestion expires if not accepted]
                 [Stale suggestions are cleaned up]
```

### Actions and Timeout

| User Action         | Timeout Impact                           |
| ------------------- | ---------------------------------------- |
| **Accept (Tab)**    | Timeout cancelled - suggestion applied   |
| **Reject (Escape)** | Timeout cancelled - suggestion dismissed |
| **Keep typing**     | Suggestion remains until 5s expires      |
| **No action**       | Auto-closes after 5 seconds              |

## Accepting Before Timeout

The suggestion can be accepted at any time before the 5-second timeout using:

- **Tab** - Accept the suggestion
- **Escape** - Reject the suggestion
- **Keep typing** - Suggestion will auto-expire after 5s

## Toast Notifications

When a suggestion is generated:

```typescript
toast.success('AI Suggestion Generated', {
  description: 'Press Tab to accept the suggestion',
  duration: 3000, // Toast disappears after 3s
});
```

**Note**: The toast lasts 3 seconds, but the suggestion stays for 5 seconds.

## Customizing the Timeout

To change the timeout duration, modify `playground-editor.tsx`:

```typescript
// Current: 5 seconds
if (suggestionAge > 5000) {

// Change to 10 seconds:
if (suggestionAge > 10000) {

// Change to 3 seconds:
if (suggestionAge > 3000) {
```

## Best Practices

### For Users

1. **Quick Decisions** - Evaluate the suggestion within 5 seconds
2. **Use Tab** - Press Tab quickly to accept good suggestions
3. **Keep Typing** - If suggestion doesn't help, just keep typing

### For Developers

1. **Clear Indicators** - The toast notification alerts users
2. **Visual Feedback** - Suggestion appears inline in the editor
3. **Non-Blocking** - Suggestions don't block typing or editing

## Alternative: Manual Dismissal

If you want to dismiss a suggestion before the 5-second timeout:

- Press **Escape** to manually reject
- Or just **keep typing** and it will expire naturally

## Summary

- ⏱️ **Timeout Duration**: 5 seconds
- ✅ **Manual Accept**: Press Tab anytime
- ❌ **Manual Reject**: Press Escape anytime
- 🔄 **Auto-Close**: After 5 seconds if not accepted
- 📝 **Toast Notification**: Displays for 3 seconds
- ⚡ **Non-Blocking**: Doesn't interrupt your typing

Your suggestions are intelligent, time-bounded, and user-friendly!
