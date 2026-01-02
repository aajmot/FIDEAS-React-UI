# Theme Variables - Quick Reference

## 🎯 One Place to Rule Them All
**File:** `src/index.css` (`:root` section)

## 📏 Most Common Variables

```css
/* Change these to adjust app density */
--erp-font-size: 13px;           /* Body text size */
--erp-input-height: 28px;        /* All input fields */
--erp-button-height: 28px;       /* All buttons */
--erp-row-padding: 4px 8px;      /* Table rows & menus */
--erp-header-height: 48px;       /* Top header bar */
```

## 🔧 Usage in Components

### Inline Styles (Recommended for Dynamic Values)
```tsx
<div style={{ padding: 'var(--erp-section-padding)' }}>
  <input style={{ height: 'var(--erp-input-height)' }} />
</div>
```

### CSS Classes (For Reusable Patterns)
```css
.my-component {
  padding: var(--erp-row-padding);
  font-size: var(--erp-font-size);
}
```

## 📦 Variable Categories

### Typography
- `--erp-font-size` (13px) - Base
- `--erp-font-size-xs` (11px) - Labels
- `--erp-font-size-sm` (12px) - Small
- `--erp-font-size-lg` (14px) - Headings

### Heights
- `--erp-input-height` (28px)
- `--erp-button-height` (28px)
- `--erp-header-height` (48px)
- `--erp-table-row-height` (32px)

### Spacing
- `--erp-spacing-xs` (2px)
- `--erp-spacing-sm` (4px)
- `--erp-spacing-md` (6px)
- `--erp-spacing-lg` (8px)
- `--erp-spacing-xl` (12px)

### Padding
- `--erp-row-padding` (4px 8px)
- `--erp-cell-padding` (4px 8px)
- `--erp-input-padding` (4px 8px)
- `--erp-button-padding` (4px 12px)
- `--erp-section-padding` (8px 12px)
- `--erp-card-padding` (12px)

### Margins
- `--erp-margin-bottom` (8px)
- `--erp-section-margin` (12px)

## 🎨 Preset Configurations

### Current (Compact)
```css
--erp-font-size: 13px;
--erp-input-height: 28px;
--erp-row-padding: 4px 8px;
```

### Extra Compact
```css
--erp-font-size: 12px;
--erp-input-height: 24px;
--erp-row-padding: 2px 6px;
```

### Standard
```css
--erp-font-size: 14px;
--erp-input-height: 32px;
--erp-row-padding: 6px 12px;
```

### Comfortable
```css
--erp-font-size: 15px;
--erp-input-height: 36px;
--erp-row-padding: 8px 16px;
```

## ✅ Best Practices

1. **Always use variables** instead of hardcoded values
2. **Use inline styles** for component-specific sizing
3. **Use CSS classes** for reusable patterns
4. **Test changes** across all screen sizes
5. **Maintain proportions** when adjusting values

## 🚫 Don't Do This

```tsx
// ❌ Bad - Hardcoded values
<input className="h-10 px-4 py-2" />
<button className="text-sm px-6 py-3" />

// ✅ Good - Use theme variables
<input style={{ height: 'var(--erp-input-height)', padding: 'var(--erp-input-padding)' }} />
<button style={{ height: 'var(--erp-button-height)', padding: 'var(--erp-button-padding)' }} />
```

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Text cut off | Increase `--erp-input-height` |
| Too cramped | Increase padding variables |
| Too much scrolling | Decrease padding/margin variables |
| Hard to click | Increase `--erp-button-height` |
| Text too small | Increase `--erp-font-size` |

## 📚 Full Documentation
See `THEME_CONFIG.md` for complete documentation.
