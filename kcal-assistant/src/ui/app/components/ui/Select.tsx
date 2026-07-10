import * as Select from "@radix-ui/react-select";

export interface SelectOption { value: string; label: string; description?: string; disabled?: boolean }

export function KvittoSelect({ value, options, onChange, placeholder, ariaLabel }: {
  value: string; options: SelectOption[]; onChange: (v: string) => void; placeholder?: string; ariaLabel: string;
}) {
  return (
    <Select.Root value={value || undefined} onValueChange={onChange}>
      <Select.Trigger className="kselect-trigger" aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="kselect-icon">▾</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="kselect-content" position="popper" sideOffset={4}>
          <Select.Viewport>
            {options.map((o) => (
              <Select.Item key={o.value} value={o.value} disabled={o.disabled} className="kselect-item">
                <div>
                  <Select.ItemText>{o.label}</Select.ItemText>
                  {o.description ? <div className="kselect-desc">{o.description}</div> : null}
                </div>
                <Select.ItemIndicator className="kselect-check">✓</Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
