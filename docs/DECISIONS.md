# TextileIE Architectural Decisions

## Decision 001

### Style Master is the single source of engineering data.

Reason:

Avoid duplicate engineering information and ensure consistency across all modules.

---

## Decision 002

### Export Orders never store engineering data.

Reason:

Export Orders should always reference approved engineering from Style Master.

---

## Decision 003

### Thread Engineering receives SPI from Stitch Master.

Reason:

SPI should be maintained in only one location to prevent inconsistencies.

---

## Decision 004

### Requirements are generated automatically.

Reason:

Material planning should always use approved engineering multiplied by order quantity.

---

## Decision 005

### Engineering data is reusable.

Reason:

Repeat orders should not require engineering to be entered again.

---

## Decision 006

### Consistent UI across all modules.

Reason:

Enterprise users should experience one unified system rather than separate applications.
