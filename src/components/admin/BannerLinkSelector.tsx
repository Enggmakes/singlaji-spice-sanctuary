import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Compass, ExternalLink } from 'lucide-react';

export interface BannerLinkOption {
  label: string;
  value: string;
  suggestedButtonText: string;
  group: 'display' | 'pages' | 'categories' | 'products' | 'custom';
}

interface BannerLinkSelectorProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (url: string, suggestedText?: string) => void;
  categories?: Array<{ id: string; name: string; slug?: string }>;
  products?: Array<{ id: string; name: string; slug?: string; price?: number }>;
  defaultSuggestedText?: string;
}

export default function BannerLinkSelector({
  id = 'banner-link-selector',
  label = 'Destination Page / Link',
  value,
  onChange,
  categories = [],
  products = [],
  defaultSuggestedText,
}: BannerLinkSelectorProps) {
  // Option for display-only banners (no link, no button, no text)
  const displayOnlyOption: BannerLinkOption = {
    label: '🚫 No Link, No Buttons, No Text (Display Only)',
    value: 'none',
    suggestedButtonText: '',
    group: 'display',
  };

  // Build dynamic standard pages
  const standardPages: BannerLinkOption[] = [
    { label: 'All Products (Catalog)', value: '/products', suggestedButtonText: 'Shop Now', group: 'pages' },
    { label: 'Our Story / About Singlaji', value: '/about', suggestedButtonText: 'Our Story', group: 'pages' },
    { label: 'Shopping Cart', value: '/cart', suggestedButtonText: 'View Cart', group: 'pages' },
    { label: 'Checkout Page', value: '/checkout', suggestedButtonText: 'Order Now', group: 'pages' },
    { label: 'Track Orders', value: '/orders', suggestedButtonText: 'Track Orders', group: 'pages' },
  ];

  // Build dynamic category options
  const categoryOptions: BannerLinkOption[] = categories.map((c) => {
    const slug = c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      label: `Category: ${c.name}`,
      value: `/products?category=${slug}`,
      suggestedButtonText: `Shop ${c.name}`,
      group: 'categories',
    };
  });

  // Build dynamic product options
  const productOptions: BannerLinkOption[] = products.map((p) => {
    const identifier = p.slug || p.id;
    return {
      label: `Product: ${p.name}${p.price ? ` (₹${p.price})` : ''}`,
      value: `/product/${identifier}`,
      suggestedButtonText: `Buy ${p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name}`,
      group: 'products',
    };
  });

  const allPresetOptions = [displayOnlyOption, ...standardPages, ...categoryOptions, ...productOptions];

  // Determine current mode: matching preset or custom
  const matchedPreset = allPresetOptions.find((opt) => opt.value === value);
  const isCustom = !matchedPreset && Boolean(value && value !== 'none');

  const [selectedDropdownValue, setSelectedDropdownValue] = useState<string>(
    value === 'none' ? 'none' : (matchedPreset ? matchedPreset.value : value ? '__custom__' : '/products')
  );
  const [customInputValue, setCustomInputValue] = useState<string>(isCustom ? value : '');

  // Keep state in sync with external value changes
  useEffect(() => {
    if (value === 'none') {
      setSelectedDropdownValue('none');
      setCustomInputValue('');
      return;
    }
    const match = allPresetOptions.find((opt) => opt.value === value);
    if (match) {
      setSelectedDropdownValue(match.value);
    } else if (value) {
      setSelectedDropdownValue('__custom__');
      setCustomInputValue(value);
    } else {
      setSelectedDropdownValue('/products');
    }
  }, [value, categories, products]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setSelectedDropdownValue(selected);

    if (selected === 'none') {
      onChange('none', '');
    } else if (selected === '__custom__') {
      const customVal = customInputValue || '/products';
      onChange(customVal, defaultSuggestedText || 'Explore');
    } else {
      const match = allPresetOptions.find((opt) => opt.value === selected);
      if (match) {
        onChange(match.value, match.suggestedButtonText);
      }
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setCustomInputValue(newVal);
    onChange(newVal);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-primary" />
          {label}
        </Label>
        <span className="text-[10px] text-muted-foreground font-mono">
          {selectedDropdownValue === 'none'
            ? '🚫 No Link (Display Only)'
            : selectedDropdownValue === '__custom__'
            ? 'Custom URL'
            : 'Dynamic Auto-Route'}
        </span>
      </div>

      <div className="relative">
        <select
          id={id}
          value={selectedDropdownValue}
          onChange={handleSelectChange}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium text-foreground cursor-pointer"
        >
          <optgroup label="🚫 Display Only / Clean Banner">
            <option value="none">
              🚫 No Link, No Buttons, No Text (Display Only)
            </option>
          </optgroup>

          <optgroup label="📌 Standard Store Pages">
            {standardPages.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.value})
              </option>
            ))}
          </optgroup>

          {categoryOptions.length > 0 && (
            <optgroup label={`🏷️ Store Categories (${categoryOptions.length})`}>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          )}

          {productOptions.length > 0 && (
            <optgroup label={`🌶️ Individual Products (${productOptions.length})`}>
              {productOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="🔗 Other / Custom Destination">
            <option value="__custom__">Custom URL / External Link...</option>
          </optgroup>
        </select>
      </div>

      {selectedDropdownValue === 'none' && (
        <p className="text-[10px] text-muted-foreground font-medium">
          💡 Banner will be shown as a clean display image with no buttons, text overlays, or click links.
        </p>
      )}

      {selectedDropdownValue === '__custom__' && (
        <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="e.g. /custom-page or https://instagram.com/singlaji"
              value={customInputValue}
              onChange={handleCustomInputChange}
              className="text-xs h-8"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
            Type any relative internal page (e.g. <code>/offers</code>) or full external link.
          </p>
        </div>
      )}
    </div>
  );
}
