# FIDEAS ERP - Compact Theme Configuration

## Overview
The FIDEAS ERP application uses a centralized CSS variable system for managing visual density and spacing throughout the entire application. All theme variables are defined in `src/index.css` and can be adjusted from a single location.

## Quick Adjustment Guide

To change the density of the entire application, edit the CSS variables in `src/index.css`:

### Current Configuration (Compact)
```css
:root {
  --erp-font-size: 12px;
  --erp-font-size-xs: 10px;
  --erp-header-font-size: 12px;
  --erp-line-height: 1.1;
  --erp-table-line-height: 1.0;
  --erp-input-height: 26px;
  --erp-row-padding: 3px 6px;
  --erp-header-height: 40px;
  --erp-table-row-height: 24px;
  --erp-margin-bottom: 6px;
}
```

### Alternative Configurations

#### Extra Compact (Maximum Density)
```css
:root {
  --erp-font-size: 12px;
  --erp-input-height: 24px;
  --erp-row-padding: 2px 6px;
  --erp-header-height: 40px;
  --erp-margin-bottom: 6px;
}
```

#### Standard (Balanced)
```css
:root {
  --erp-font-size: 14px;
  --erp-input-height: 32px;
  --erp-row-padding: 6px 12px;
  --erp-header-height: 56px;
  --erp-margin-bottom: 12px;
}
```

#### Comfortable (More Spacing)
```css
:root {
  --erp-font-size: 15px;
  --erp-input-height: 36px;
  --erp-row-padding: 8px 16px;
  --erp-header-height: 64px;
  --erp-margin-bottom: 16px;
}
```

## CSS Variables Reference

### Typography
| Variable | Purpose | Default |
|----------|---------|---------|
| `--erp-font-size` | Base font size for body text | 12px |
| `--erp-font-size-xs` | Extra small text (labels, captions) | 10px |
| `--erp-font-size-sm` | Small text | 11px |
| `--erp-font-size-lg` | Large text (headings) | 13px |
| `--erp-header-font-size` | Header/title font size | 12px |
| `--erp-line-height` | Base line height | 1.1 |
| `--erp-table-line-height` | Table row line height | 1.0 |

### Spacing
| Variable | Purpose | Default |
|----------|---------|---------|
| `--erp-spacing-xs` | Extra small gap | 2px |
| `--erp-spacing-sm` | Small gap | 4px |
| `--erp-spacing-md` | Medium gap | 6px |
| `--erp-spacing-lg` | Large gap | 8px |
| `--erp-spacing-xl` | Extra large gap | 12px |

### Component Heights
| Variable | Purpose | Default |
|----------|---------|---------|
| `--erp-input-height` | Height of input fields | 26px |
| `--erp-button-height` | Height of buttons | 26px |
| `--erp-header-height` | Height of page header | 40px |
| `--erp-table-row-height` | Height of table rows | 20px |

### DataTable Specific
| Variable | Purpose | Default |
|----------|---------|---------|
| `--erp-datatable-font-size` | DataTable body text | 11px |
| `--erp-datatable-header-font-size` | DataTable header text | 10px |
| `--erp-datatable-icon-size` | DataTable icon size | 12px |

### Padding
| Variable | Purpose | Default |
|----------|---------|---------|
| `--erp-row-padding` | Padding for table rows and menu items | 2px 4px |
| `--erp-cell-padding` | Padding for table cells | 2px 4px |
| `--erp-input-padding` | Padding inside input fields | 3px 6px |
| `--erp-button-padding` | Padding inside buttons | 3px 10px |
| `--erp-section-padding` | Padding for sections/cards | 6px 10px |
| `--erp-card-padding` | Padding for card bodies | 10px |

### Margins
| Variable | Purpose | Default |
|----------|---------|---------|
| `--erp-margin-bottom` | Bottom margin for form groups | 6px |
| `--erp-section-margin` | Margin between sections | 10px |

## Where Variables Are Applied

### Components Using Theme Variables

1. **Header** (`src/components/layout/Header.tsx`)
   - Header height
   - Button sizing and padding
   - Menu item padding
   - Font sizes

2. **DataTable** (`src/components/common/DataTable.tsx`)
   - Table row heights
   - Cell padding
   - Search input sizing
   - Button heights
   - Pagination controls

3. **Layout** (`src/components/layout/Layout.tsx`)
   - Main content padding
   - Footer padding

4. **Global Form Controls** (`src/index.css`)
   - All input fields
   - All buttons
   - All select dropdowns
   - All textareas

## How to Customize

### Step 1: Edit Variables
Open `src/index.css` and modify the `:root` section with your desired values.

### Step 2: Test Changes
The changes will apply immediately in development mode. Refresh your browser to see the updates.

### Step 3: Fine-tune
Adjust individual variables as needed. You don't need to change all variables at once.

## Best Practices

1. **Maintain Proportions**: When changing font size, adjust heights proportionally
2. **Test Responsiveness**: Verify changes work on different screen sizes
3. **Check Readability**: Ensure text remains readable at smaller sizes
4. **Verify Clickability**: Ensure buttons and interactive elements remain easy to click

## Examples

### Making the App More Compact
To fit more data on screen, reduce:
- Font sizes (12-13px)
- Padding values (2-4px)
- Heights (24-28px)

### Making the App More Comfortable
To improve readability and touch targets, increase:
- Font sizes (15-16px)
- Padding values (8-12px)
- Heights (36-40px)

## Troubleshooting

### Text is Cut Off
Increase `--erp-input-height` and `--erp-table-row-height`

### Too Much Scrolling
Decrease padding and margin variables

### Hard to Click Buttons
Increase `--erp-button-height` and `--erp-button-padding`

### Text Too Small
Increase `--erp-font-size` and related font size variables

## Additional Notes

- All measurements use `px` units for consistency
- Variables cascade throughout the application
- Changes apply to all modules (Admin, Inventory, Account, Clinic, etc.)
- No code changes required - only CSS variable adjustments
- Compatible with all modern browsers
