# TextileIE UI Standards

## Objective

Every page in TextileIE must follow a consistent enterprise design system.

Users should feel they are using one integrated ERP, not separate applications.

---

# General Layout

Every module should follow this structure:

Page Header
↓
Statistics Cards
↓
Search & Filters
↓
Toolbar
↓
Main Content (Table/Form)
↓
Summary Panel (if required)
↓
Pagination
↓
Footer Actions

---

# Page Header

Include:

- Module Name
- Short Description
- Breadcrumb
- Quick Actions

---

# Statistics Cards

Use summary cards where appropriate.

Examples:

- Total Records
- Active
- Inactive
- Pending
- Draft

---

# Toolbar

Standard actions:

- Add
- Import
- Export
- Refresh
- Search
- Filter

---

# Forms

Rules:

- Required fields marked clearly.
- Related fields grouped together.
- Use section headings.
- Display validation below the field.
- Disable Save while submitting.
- Confirm destructive actions.

---

# Tables

Every master table should support:

- Search
- Sorting
- Filtering
- Pagination
- Column visibility (future)
- Row actions
- Empty state
- Loading state

---

# Buttons

Primary

- Save
- Create
- Continue
- Approve

Secondary

- Previous
- Cancel
- Save Draft

Danger

- Delete
- Deactivate

---

# Status

Use consistent status values.

- Draft
- Active
- Inactive
- Pending
- Approved
- Rejected
- Completed
- Cancelled

---

# Colors

Primary

Blue

Success

Green

Warning

Orange

Danger

Red

Information

Light Blue

---

# Icons

Use one icon library throughout the project.

Current standard:

Lucide React

---

# Typography

Use one font family consistently.

Use clear heading hierarchy.

Avoid inconsistent font sizes.

---

# Responsive Design

Desktop

Laptop

Tablet

Mobile

Large tables may scroll horizontally.

---

# Reusable Components

Prefer reusable components instead of duplicate code.

Examples:

- Search Bar
- Data Table
- Summary Card
- Statistics Card
- Status Badge
- Confirmation Dialog
- Drawer Form
- Empty State
- Loading Spinner

---

# Coding Standards

Every module should follow the same folder structure.

Example:

BuyerMaster/

- BuyerMasterPage.jsx
- BuyerTable.jsx
- BuyerFormDrawer.jsx
- BuyerDetailsDrawer.jsx
- buyerService.js
- buyerValidation.js
- buyerConstants.js
- index.js

---

# Final Rule

Never redesign an existing working page unless there is a clear business requirement.

Consistency is more important than introducing new visual styles.
