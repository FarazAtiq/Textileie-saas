import { useEffect, useMemo, useRef, useState } from "react";

export default function SearchSelect({
  label,
  placeholder = "Search...",
  value,
  options = [],
  required = false,
  disabled = false,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;

    return options.filter((item) =>
      item.label
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOption =
    options.find((o) => o.value === value) || null;
    return (
    <div
      className="field"
      ref={wrapperRef}
      style={{ position: "relative" }}
    >
      {label && (
        <label>
          {label}
          {required && (
            <span style={{ color: "#dc2626" }}> *</span>
          )}
        </label>
      )}

      {/* Selected Value */}

      <div
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
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
          minHeight: 42,
        }}
      >
        <span
          style={{
            color: selectedOption ? "#111827" : "#9ca3af",
          }}
        >
          {selectedOption
            ? selectedOption.label
            : placeholder}
        </span>

        <span>▼</span>
      </div>

      {open && (
        <div
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
            boxShadow:
              "0 10px 25px rgba(0,0,0,.12)",
          }}
        >
          {/* Search */}

          <div
            style={{
              padding: 10,
            }}
          >
            <input
              className="field"
              placeholder={placeholder}
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              autoFocus
            />
          </div>

          {/* Options */}

          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: 12,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              No results found
            </div>
          ) : (
            filteredOptions.map((item) => (
              <div
                key={item.value}
                onClick={() => {
                  onChange(item.value);

                  setSearch("");

                  setOpen(false);
                }}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderTop:
                    "1px solid #f3f4f6",
                  background:
                    item.value === value
                      ? "#eff6ff"
                      : "#fff",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "#f8fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    item.value === value
                      ? "#eff6ff"
                      : "#fff")
                }
              >
                {item.label}
              </div>
            ))
          )}
        </div>
      )}
              )}
      )}
    </div>
  );
}
