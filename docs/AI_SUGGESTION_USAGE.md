# AI Suggestion Usage Guide

## How to Use AI Suggestions

### Visual Indicators

When an AI suggestion is generated, it appears as **inline gray text** in the
Monaco editor, similar to GitHub Copilot.

### Accepting a Suggestion

**Method 1: Press Tab**

- When you see the gray inline suggestion text, simply press the **Tab key**
- The suggestion will be inserted into your code

**Method 2: Keep Typing**

- As you type, the suggestion will automatically disappear after 5 seconds
- You can continue typing your own code

### Rejecting a Suggestion

**Press Escape**

- To dismiss a suggestion immediately, press the **Escape key**
- The suggestion will be removed without inserting it

### Suggestion Auto-Expiry

- Suggestions automatically expire after **5 seconds** if not accepted
- This prevents stale suggestions from cluttering your editor

## Toast Notifications

When a suggestion is generated, you'll see a toast notification:

```
🎉 AI Suggestion Generated
Press Tab to accept • Press Escape to reject
```

The notification stays visible for **5 seconds** to give you time to read the
instructions.

## Keyboard Shortcuts Summary

| Key                  | Action  | Description                           |
| -------------------- | ------- | ------------------------------------- |
| **Tab**              | Accept  | Accepts the current inline suggestion |
| **Escape**           | Reject  | Dismisses the current suggestion      |
| **Ctrl/Cmd + Space** | Trigger | Manually triggers a new suggestion    |

## Visual Feedback

### Inline Suggestion Appearance

```typescript
// Your code here
|    <- cursor position
// Gray suggestion text appears here inline [✓] [✗]
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^buttons here
```

The suggestion appears as:

- **Gray text** inline with your code
- **Green ✓ and Red ✗ buttons** positioned after the suggestion
- Buttons are compact (24x24px) for minimal intrusion
- Hover effects for clear visual feedback

### When Suggestion is Active

1. **Gray inline text** appears in the editor
2. **Accept/Reject buttons** (✓ ✗) appear inline after the suggestion
3. **Toast notification** shows at the top of the screen
4. **Status indicator** on the AI button may change

## Troubleshooting

### Suggestion Not Appearing

- Check that AI suggestions are enabled (AI button is green)
- Ensure you have an active cursor position in the editor
- Wait for the API to generate the suggestion (may take 1-3 seconds)

### Can't Accept Suggestion

- Make sure your cursor is near the suggestion position
- Try moving your cursor and triggering a new suggestion
- The suggestion expires after 5 seconds if not accepted

### Multiple Suggestions

- Only one suggestion is active at a time
- Accepting or rejecting clears the current suggestion
- Trigger a new suggestion with **Ctrl/Cmd + Space**

## Best Practices

1. **Evaluate Quickly** - Suggestions expire after 5 seconds
2. **Use Tab Freely** - Press Tab to quickly accept good suggestions
3. **Press Escape** - Dismiss unwanted suggestions immediately
4. **Keep Typing** - If unsure, just keep typing and the suggestion will
   disappear
5. **Manual Trigger** - Use **Ctrl/Cmd + Space** when you need a suggestion

## Workflow Example

```
1. Type: "const myFunc"
2. Wait 1-3 seconds
3. See gray suggestion: "= () => {}"
4. Toast appears: "Press Tab to accept • Press Escape to reject"
5. Press Tab → Code inserted: "const myFunc = () => {}"
6. Continue coding...
```

## Advanced Tips

### Accepting Partial Suggestions

Monaco inline suggestions work as a whole. You cannot accept part of a
suggestion. Either accept the entire suggestion with Tab or reject it with
Escape.

### Triggering Suggestions

- **Automatic**: Suggestions trigger as you type
- **Manual**: Press **Ctrl/Cmd + Space** to request a suggestion
- **Context-aware**: Suggestions consider surrounding code

### Suggestion Quality

Suggestions are generated based on:

- Current line context
- Surrounding code (10 lines before/after)
- File language
- Detected patterns and framework

## Technical Details

### Suggestion Lifecycle

```
0s  ──── Suggestion Generated
          [Gray text appears inline]
          [Toast notification shows]

0s-5s ── Suggestion Active
          [Tab to accept]
          [Escape to reject]
          [Keep typing to auto-expire]

5s  ──── Suggestion Expires
          [Automatically dismissed]
```

### Internal Implementation

- Suggestions use Monaco's inline completion API
- Provided via `inlineCompletionsProvider`
- Registered per-language (JavaScript, TypeScript, Python, etc.)
- Position-aware and cursor-synchronized

## Accept/Reject Buttons

AI suggestions now include **inline buttons** for easy interaction alongside
keyboard shortcuts!

### Button Features

- **Accept Button** (✓) - Green checkmark button to accept the suggestion
- **Reject Button** (✗) - Red X button to dismiss the suggestion
- **Positioned inline** - Appears right after the gray suggestion text
- **Hover effects** - Buttons highlight when you hover over them
- **Keyboard + Mouse** - Both keyboard shortcuts and button clicks work

### How to Use Buttons

1. **See the suggestion** - Gray inline text appears in the editor
2. **Find the buttons** - Green ✓ and red ✗ buttons appear inline after the
   suggestion
3. **Click to accept** - Click the green ✓ button to insert the suggestion
4. **Click to reject** - Click the red ✗ button to dismiss the suggestion

### Button Styling

Buttons are styled to match your editor theme:

- **Dark theme**: Dark gray background with colored icons
- **Hover effect**: Border highlights and background darkens
- **Compact size**: 24x24px for minimal intrusion
- **High contrast**: Easy to see and click

### Keyboard vs Mouse

You can use **either method**:

| Method       | How                  | When to Use                             |
| ------------ | -------------------- | --------------------------------------- |
| **Keyboard** | Press Tab or Escape  | Fast coding workflow, hands on keyboard |
| **Mouse**    | Click ✓ or ✗ buttons | Visual learners, precise control        |

Both methods work simultaneously for maximum flexibility!
