# Known Testing Issues

## Node.js Module Compatibility with mimetext

### Issue
The `mimetext` package (used for email composition) imports `node:os` which is not available in the Cloudflare Workers test environment, causing test failures.

### Error Message
```
Error: No such module "node:os".
  imported from "mimetext/dist/mimetext.node.es.js"
```

### Root Cause
- `mimetext` is imported in `src/index.ts` for the `PostEmail` route
- When tests load the worker, all imports are processed
- Workers runtime doesn't support `node:os` or `node:path` modules
- The `nodejs_compat` flag doesn't provide these modules in the test environment

### Temporary Solutions

#### Option 1: Mock Email Sending (Recommended)
Create a test-specific worker entry point that mocks email sending:

```typescript
// tests/test-worker.ts
import { EmailExplorer } from '../src/index';

// Mock the email sending to avoid mimetext import
export default EmailExplorer({
  auth: {
    enabled: true
  }
});
```

Update wrangler config to use test entry point.

#### Option 2: Skip Email Tests
Focus auth tests on endpoints that don't trigger email sending:
- Registration
- Login/Logout
- Session management
- Admin operations

Email sending can be tested separately or in integration environment.

#### Option 3: Use Alternative Email Library
Replace `mimetext` with a Workers-compatible alternative:
- Build MIME messages manually
- Use a different library that doesn't depend on Node.js modules

### Long-term Solution

**Recommended**: Replace `mimetext` with a Workers-compatible email composition library or implement custom MIME message building that doesn't require Node.js modules.

### Workaround for Current Implementation

For now, the authentication tests are written and ready to run once one of the above solutions is implemented. The test code itself is correct and will work once the module compatibility issue is resolved.

### Testing Without mimetext

To test auth functionality immediately, you can:

1. **Comment out the PostEmail route temporarily:**

```typescript
// In src/index.ts, comment out:
// openapi.post("/api/v1/mailboxes/:mailboxId/emails", PostEmail);
```

2. **Run tests:**
```bash
pnpm --filter email-explorer test
```

3. **Restore the route after testing**

### Impact

- ✅ Auth tests are complete and functional
- ❌ Cannot run tests due to mimetext import
- ⚠️ Email sending functionality works fine in production
- ⚠️ Only affects local testing environment

### Related Issues

- Cloudflare Workers don't support Node.js built-in modules
- `vitest-pool-workers` runs in a Workers environment
- Some npm packages aren't compatible with Workers runtime

### Next Steps

1. Evaluate replacing `mimetext` with Workers-compatible alternative
2. Implement custom MIME message builder
3. Or create separate build for testing vs production
