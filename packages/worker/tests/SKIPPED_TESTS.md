# Skipped Tests Due to mimetext Compatibility

## Issue

Tests in `tests/integration/endpoints.test.ts` that send emails are currently failing because:

1. Email sending requires the `PostEmail` route class
2. `PostEmail` imports `mimetext` package
3. `mimetext` imports `node:os` which doesn't work in Cloudflare Workers test environment

## Affected Tests

The following tests in `endpoints.test.ts` need to be skipped:

### Emails API
- ❌ **"should send an email"** (line 110) - Directly tests POST /emails endpoint
- ❌ **"should get an email"** (line 132) - Creates email first, then gets it
- ❌ **"should update an email"** (line 160) - Creates email first, then updates it
- ❌ **"should delete an email"** (line 198) - Creates email first, then deletes it
- ❌ **"should move an email to a folder"** (line 235) - Creates email first, then moves it

### Attachments API
- ❌ **"should get an attachment"** (line 804) - Creates email with attachment first
- ❌ **"should handle attachments with and without contentId"** (line 852) - Creates emails with attachments

## Tests That Still Work

✅ **Mailboxes API** - All 6 tests work
✅ **Folders API** - All 9 tests work  
✅ **Contacts API** - All 5 tests work
✅ **Search API** - Partially works (can't test with actual emails)
✅ **Auth API** - All 23 tests work

## Total Test Count

- **Working**: ~43 tests (Mailboxes + Folders + Contacts + Auth)
- **Skipped**: ~7 tests (Email sending related)
- **Total**: ~50 tests

## Workarounds

### Option 1: Skip in Test File (Recommended)
Add `.skip` to affected tests:

```typescript
it.skip("should send an email", async () => {
  // Test code...
});
```

### Option 2: Comment Out Tests
Comment out the entire test blocks temporarily.

### Option 3: Separate Test File
Move email sending tests to a separate file that only runs in E2E environment.

## Testing Email Sending

Email sending functionality CAN be tested via:

1. **Manual Testing** - Deploy to Cloudflare and test real email sending
2. **E2E Tests** - Test against deployed worker
3. **Production Monitoring** - Monitor actual email sending in production

## Implementation

To skip these tests, edit `tests/integration/endpoints.test.ts` and add `.skip`:

```typescript
// Line 110
it.skip("should send an email", async () => {

// Line 132  
it.skip("should get an email", async () => {

// Line 160
it.skip("should update an email", async () => {

// Line 198
it.skip("should delete an email", async () => {

// Line 235
it.skip("should move an email to a folder", async () => {

// Line 804
it.skip("should get an attachment", async () => {

// Line 852
it.skip("should handle attachments with and without contentId", async () => {
```

## Future Solution

When replacing `mimetext` with a Workers-compatible library, these tests can be re-enabled.

## Status

⚠️ **Action Required**: These tests need to be skipped manually until a Workers-compatible email composition solution is implemented.
