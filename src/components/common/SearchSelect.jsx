import { useEffect, useMemo, useRef, useState, useId } from "react";
import { ChevronDown, X, Loader2 } from "lucide-react";

/**
 * Reusable searchable select — single source-of-truth pattern for
 * picking from master data (countries, currencies, timezones,
 * languages, and future master lists) instead of every page
 * building its own dropdown.
 *
 * onChange(value, option) — value is option.value (matches plain
 * <select> ergonomics for easy adoption in existing forms);
 * option is the full row (useful for auto-defaults, e.g. selecting
 * a country to also read its currency/timezone/language).
 */
export default function SearchSelect({
  label,
  placeholder = "Search...",
  value,
  options = [],
  required = false,
  disabled = false,
  loading = false,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      // let the dropdown render before focusing its search input
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((item) => item.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedOption = options.find((o) => o.value === value) || null;

  const commit = (option) => {
    onChange?.(option.value, option);
    setSearch("");
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange?.(null, null);
    setSearch("");
  };

  const toggleOpen = () => {
    if (disabled || loading) return;
    setOpen((o) => !o);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[activeIndex]) commit(filteredOptions[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setSearch("");
    }
  };

  return (
    <div className="field" ref={wrapperRef} style={{ position: "relative" }}>
      {label && (
        <label>
          {label}
          {required && <span style={{ color: "#dc2626" }}> *</span>}
        </label>
      )}

      <div
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            setOpen(true);
          } else {
            onKeyDown(e);
          }
        }}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: "10px 12px",
          background: disabled ? "#f3f4f6" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          minHeight: 42,
        }}
      >
        <span style={{ color: selectedOption ? "#111827" : "#9ca3af", flex: 1 }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {loading && <Loader2 size={14} className="spin" />}
        {!loading && selectedOption && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear selection"
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", opacity: 0.5 }}
          >
            <X size={13} />
          </button>
        )}
        <ChevronDown size={14} style={{ opacity: 0.5 }} />
      </div>

      {open && !disabled && !loading && (
        <div
          id={listId}
          role="listbox"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            zIndex: 999,
            maxHeight: 280,
            overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0,0,0,.12)",
          }}
        >
          <div style={{ padding: 10 }}>
            <input
              ref={searchInputRef}
              className="field"
              placeholder={placeholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
            />
          </div>

          {filteredOptions.length === 0 ? (
            <div style={{ padding: 12, color: "#6b7280", textAlign: "center" }}>
              No results found
            </div>
          ) : (
            filteredOptions.map((item, i) => (
              <div
                key={item.value}
                role="option"
                aria-selected={item.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(item);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderTop: "1px solid #f3f4f6",
                  background:
                    item.value === value ? "#eff6ff" : i === activeIndex ? "#f8fafc" : "#fff",
                }}
              >
                {item.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
        }
