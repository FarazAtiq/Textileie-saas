# TextileIE Business Rules

## General Rules

1. Every business record belongs to a Company.
2. Factory-specific records must also belong to a Factory.
3. Duplicate business codes are not allowed within the same company.
4. Inactive records cannot be selected in new transactions.
5. Important business records should use soft delete.
6. Important changes must be recorded in the audit log.

---

# Buyer Rules

1. Buyer Code must be unique.
2. One Buyer can have multiple Brands.
3. A Buyer cannot be deleted if it is used by any Style or Export Order.
4. Buyer currency is the default currency for new orders but may be overridden if required.

---

# Brand Rules

1. Every Brand belongs to one Buyer.
2. Duplicate Brand names are not allowed for the same Buyer.
3. Brands become selectable only when Active.

---

# Style Master Rules

1. Style Article is the primary identifier.
2. Duplicate Style Articles are not allowed within the same Buyer.
3. Every Style belongs to one Buyer and one Brand.
4. Engineering data must always be linked to the Style.
5. Export Orders must select an existing Style.
6. Manual style entry is not allowed where Style selection is available.

---

# Fabric Engineering Rules

1. Fabric Engineering is saved Style-wise.
2. Multiple fabrics can be assigned to one Style.
3. Consumption includes shrinkage and wastage.
4. Fabric Cost flows automatically into Garment Costing.
5. Saved engineering data is reused for repeat orders.

---

# Thread Engineering Rules

1. Stitch operations are imported from Stitch Master.
2. SPI is maintained only in Stitch Master.
3. Thread Engineering receives SPI as a read-only auto-filled value.
4. Multiple thread types may be used in one Style.
5. Needle and looper threads may share or use different thread codes.
6. Thread Cost flows automatically into Garment Costing.

---

# Accessories Engineering Rules

1. Accessories Master stores reusable accessory definitions.
2. Accessories Engineering stores Style-specific consumption.
3. Accessories Cost automatically updates Garment Costing.
4. Accessories Requirements are generated from Export Orders.

---

# Embellishment Rules

1. Printing, Embroidery, Washing, and Heat Transfer are managed as Embellishment or Outsource Processes.
2. Outsource processes are linked to the Style.
3. Outsource costs automatically update Garment Costing.
4. Requirements are generated only when the process is enabled.

---

# Export Order Rules

1. Export Orders are created from approved Styles.
2. Every PO may contain multiple Colors.
3. Every Color may contain multiple Sizes.
4. The same Color cannot be entered twice within the same PO.
5. Saving an Export Order automatically generates Fabric, Thread, Accessories, and Embellishment Requirements.
6. Requirements always use the approved Engineering data of the selected Style.

---

# Requirement Rules

Gross Requirement

=

Engineering Consumption

×

PO Quantity

Need To Buy

=

Gross Requirement

− Available Stock

− Reserved Stock

− Approved Incoming Quantity

---

# Inventory Rules

1. Stock must never be edited directly.
2. Stock changes only through:
   - Goods Receipt
   - Issue
   - Return
   - Transfer
   - Adjustment
3. Negative stock is not allowed without authorization.
4. Reserved stock remains separate from available stock.

---

# Costing Rules

Garment Cost includes:

- Fabric
- Thread
- Accessories
- Embellishment
- CMT
- Overheads
- Freight
- Commission
- Duty
- Profit

All costs are calculated automatically from Engineering and Master data.

---

# Security Rules

1. Users can only access Companies they belong to.
2. Roles determine module permissions.
3. Every important action should be recorded in the audit log.
4. Deleted records should remain traceable through audit history.

---

# Core Principle

Engineering information is entered once.

Every downstream module reuses that information.

Duplicate engineering data is never entered manually.
