# Security Specification: Pension Records System

## 1. Data Invariants
1. **Authenticated Operations**: Write and modification operations must only be performed by authenticated users (`request.auth != null`).
2. **Province Whitelist**: `province` must strictly belong to the 7 designated provinces: ราชบุรี, กาญจนบุรี, นครปฐม, สมุทรสาคร, สมุทรสงคราม, เพชรบุรี, ประจวบคีรีขันธ์.
3. **Approved Count Non-negative**: `approvedCount` must be an integer >= 0 and within realistic limits (<= 1,000,000).
4. **Valid Month and Year**: `month` must be between 1 and 12, `year` must be a valid BE year (2500 to 2600).
5. **Ownership Integrity**: `userId` must match `request.auth.uid` on record creation and cannot be altered on update.
6. **Immortal Fields**: `createdAt`, `userId` are immutable once written.
7. **String Bounds**: `recordedBy` max length 100, `notes` max length 500, `province` max length 50.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Write**: Creating record with `auth = null`.
2. **Identity Spoofing**: Submitting `userId: "attacker_uid"` when authenticated as `"user_123"`.
3. **Invalid Province**: Setting province to `"เชียงใหม่"` or `"กรุงเทพมหานคร"` (outside allowed 7 provinces).
4. **Negative Approved Count**: Setting `approvedCount: -50`.
5. **Invalid Month**: Setting `month: 13` or `month: 0`.
6. **Negative Year**: Setting `year: -100` or `year: 99999`.
7. **Buffer Overflow in RecordedBy**: Setting `recordedBy` with a string > 100 characters.
8. **Buffer Overflow in Notes**: Setting `notes` with a string > 500 characters.
9. **Ghost Field Injection**: Submitting an unlisted key like `isAdmin: true` or `shadowField: "payload"`.
10. **Immutable Field Tampering**: Attempting to alter `userId` on update.
11. **Malicious Document ID**: Attempting to write to an invalid path id containing special characters or oversized key (> 128 chars).
12. **Non-numeric Approved Count**: Setting `approvedCount: "five thousand"`.

## 3. Test Runner Design
All tests ensure that unauthenticated or invalid payload attempts return `PERMISSION_DENIED`.
