# WebUI Optimizations Plan

## Objective
Implement several specific UX optimizations for the `AgentChattrFlow` frontend to improve command handling, add a clear conversation button, introduce a `#` referencing feature, add syntax highlighting to the chat input, and adjust mobile keyboard behavior.

## Scope & Impact
This plan primarily affects the `frontend/src/components/MessageInput.tsx` component. It will improve user interaction by making commands more intuitive, adding quick actions, providing autocomplete for references, visually distinguishing special keywords, and making the mobile experience more natural.

## Implementation Steps

### 1. Command Optimization
*   **File:** `frontend/src/components/MessageInput.tsx`
*   **Change:** Modify the `handleSubmit` function. Currently, if `activeMentions` exist, they are unconditionally prepended to the message. We will add a condition: if the user's `text` starts with `/` (indicating a command like `/clear` or `/help`), we will **not** prepend the active agent mentions.

### 2. Clear Conversation Button
*   **File:** `frontend/src/components/MessageInput.tsx`
*   **Change:** Add a "Trash" or "Clear" icon button in the toolbar area (next to the attachment button). When clicked, it will use `window.confirm` to ask the user "Are you sure you want to clear the conversation?". If confirmed, it will call `onSendMessage('/clear')`.

### 3. Mention/Reference (#) Feature
*   **File:** `frontend/src/components/MessageInput.tsx`
*   **Change:** 
    *   Update `handleChange` regex to also detect `#`.
    *   Add a new suggestion type `'reference'` when `#` is typed.
    *   Populate the suggestion list with active Jobs (Tasks) and Rules from `useStore`.
    *   *Note regarding Files:* Since a comprehensive file list isn't directly available in the frontend store for this context, we will focus on Rules and Tasks (Jobs) as requested, which are readily available in `useStore()`. We can also add dummy file links if a specific API endpoint exists, but we will start with Rules and Tasks.

### 4. Syntax Highlighting in Input
*   **File:** `frontend/src/components/MessageInput.tsx`
*   **Change:** 
    *   Implement a "fake" syntax highlighter by rendering a `div` perfectly positioned exactly behind (or overlapping with transparent text) the `textarea`.
    *   The `div` will contain the same text as the `textarea`, but with `/commands`, `@mentions`, and `#references` wrapped in styled `span` elements with distinct colors.
    *   Make the `textarea` text color transparent (with visible caret using `caret-color`) so the highlighted text underneath shows through.

### 5. Mobile Behavior (Enter = Newline)
*   **File:** `frontend/src/components/MessageInput.tsx`
*   **Change:** Modify `handleKeyDown`. Before intercepting the `Enter` key to submit the form, detect if the user is on a mobile device (using a simple `navigator.userAgent` regex check for Android/iPhone/iPad). If on mobile, do not call `e.preventDefault()` and do not call `handleSubmit()`, allowing the default newline behavior to occur.

## Verification
*   Test that `/clear` does not send `@agent /clear`.
*   Test that the new clear button shows a confirmation and clears the chat.
*   Test typing `#` and selecting a rule or task.
*   Test that commands, mentions, and references are visually highlighted.
*   Test that pressing Enter on a simulated mobile device adds a newline instead of sending the message.