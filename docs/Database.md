# TextileIE Database Design

## Database Principles

1. Every business record belongs to a Company.
2. Most records also belong to a Workspace.
3. Factory-specific records must contain Factory ID.
4. Use UUID as the primary key for all tables.
5. Use soft delete where possible.
6. Store audit information for important records.

---

# Core Tables

## Company

- companies
- company_users
- company_user_invitations

## Workspace

- workspaces

## Factory

- factories

## Departments

- departments

## Users

- profiles
- roles
- role_permissions

---

# Master Tables

## Buyer

buyers

## Brand

brands

## Supplier

suppliers

## Customer

customers

## Unit

units

## Color

colors

## Size

sizes

## Fabric

fabric_master

## Thread

thread_master

## Accessories

accessories_master

## Stitch

stitch_master

---

# Style Tables

styles

style_colors

style_sizes

style_cost_modules

---

# Engineering Tables

fabric_engineering

thread_engineering

accessories_engineering

embellishment_engineering

smv_templates

---

# Export Order Tables

export_orders

export_order_pos

export_order_po_colors

export_order_sizes

---

# Requirement Tables

fabric_requirements

fabric_requirement_lines

thread_requirements

thread_requirement_lines

accessories_requirements

accessories_requirement_lines

need_to_buy

---

# Inventory Tables

inventory_items

inventory_transactions

stock_balances

stock_reservations

goods_receipts

material_issues

material_returns

stock_transfers

stock_adjustments

---

# Reporting Tables

reports

usage_log

audit_logs

user_report_stats

---

# Relationships

Company
└── Workspace
    └── Factory
        └── Department

Buyer
└── Brand
    └── Style

Style
├── Fabric Engineering
├── Thread Engineering
├── Accessories Engineering
├── Embellishment Engineering
├── SMV
├── Costing

Style
└── Export Orders

Export Orders
└── Requirements

Requirements
└── Need To Buy

Need To Buy
└── Purchasing

Purchasing
└── Inventory

Inventory
└── Reports
