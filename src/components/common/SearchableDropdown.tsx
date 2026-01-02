import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Search } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value?: string | number | (string | number)[];
  onChange: (value: string | number | (string | number)[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  onSearch?: (searchTerm: string) => Promise<Option[]>;
  allowAdd?: boolean;
  onAdd?: (inputValue: string) => Promise<Option>;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  multiple = false,
  searchable = true,
  disabled = false,
  className = "",
  onSearch,
  allowAdd = false,
  onAdd
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const [searchResults, setSearchResults] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const updatePosition = () => {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 240;
        
        const shouldBeAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        setDropdownPosition(shouldBeAbove ? 'above' : 'below');
        
        setPortalPosition({
          top: shouldBeAbove ? rect.top - dropdownHeight : rect.bottom,
          left: rect.left,
          width: rect.width
        });
      };
      
      updatePosition();
      
      // Focus search input when dropdown opens
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleOptionClick(filteredOptions[focusedIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex]);

  const allOptions = React.useMemo(() => {
    const combined = [...options];
    if (searchResults.length > 0) {
      searchResults.forEach(result => {
        if (!combined.find(opt => opt.value === result.value)) {
          combined.push(result);
        }
      });
    }
    return combined;
  }, [options, searchResults]);

  const filteredOptions = (() => {
    if (searchTerm) {
      if (onSearch && searchResults.length > 0) {
        return searchResults;
      } else if (!onSearch) {
        return allOptions.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return searchResults;
    }
    return options.slice(0, 20);
  })();

  const selectedValues = multiple
    ? (Array.isArray(value) ? value : [])
    : (value !== undefined ? [value] : []) as (string | number)[];

  const selectedLabels = selectedValues
    .map(val => allOptions.find(opt => opt.value === val)?.label)
    .filter(Boolean);

  const handleOptionClick = (optionValue: string | number) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
      setFocusedIndex(-1);
    }
  };

  const removeValue = (valueToRemove: string | number) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(v => v !== valueToRemove));
    }
  };

  const displayText = () => {
    if (selectedLabels.length === 0) return placeholder;
    if (multiple) {
      return selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;
    }
    return selectedLabels[0];
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onChange([]);
    } else {
      onChange('');
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div
        ref={inputRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
        style={{ padding: 'var(--erp-input-padding)', fontSize: 'var(--erp-font-size)', height: 'var(--erp-input-height)' }}
      >
        <div className="flex-1 flex items-center flex-wrap gap-1">
          {multiple && selectedLabels.length > 1 ? (
            <span className="text-gray-700" style={{ fontSize: 'var(--erp-font-size)' }}>{displayText()}</span>
          ) : multiple && selectedLabels.length === 1 ? (
            <div className="flex items-center bg-blue-100 text-blue-800 rounded" style={{ padding: '1px 4px', fontSize: 'var(--erp-font-size-xs)' }}>
              {selectedLabels[0]}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const firstValue = selectedValues[0];
                  if (firstValue !== undefined) {
                    removeValue(firstValue);
                  }
                }}
                className="ml-1 hover:text-blue-600"
              >
                <X style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }} />
              </button>
            </div>
          ) : (
            <span className={selectedLabels.length === 0 ? 'text-gray-500' : 'text-gray-700'} style={{ fontSize: 'var(--erp-font-size)' }}>
              {displayText()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedLabels.length > 0 && (
            <button
              onClick={clearSelection}
              className="hover:text-gray-600 text-gray-400"
              title="Clear selection"
            >
              <X style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }} />
            </button>
          )}
          <ChevronDown style={{ height: 'var(--erp-datatable-icon-size)', width: 'var(--erp-datatable-icon-size)' }} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-hidden" 
          style={{ 
            zIndex: 9999,
            top: portalPosition.top + window.scrollY,
            left: portalPosition.left + window.scrollX,
            width: portalPosition.width
          }}
        >
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                {/* <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /> */}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={async (e) => {
                    const term = e.target.value;
                    setSearchTerm(term);
                    setFocusedIndex(-1);
                    
                    if (onSearch && term.length > 0) {
                      setIsSearching(true);
                      try {
                        const results = await onSearch(term);
                        setSearchResults(results);
                      } catch (error) {
                        console.error('Search error:', error);
                        setSearchResults([]);
                      } finally {
                        setIsSearching(false);
                      }
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  placeholder="Search..."
                  className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 && searchTerm && allowAdd && onAdd ? (
              <div
                onClick={async () => {
                  try {
                    const newOption = await onAdd(searchTerm);
                    onChange(newOption.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  } catch (error) {
                    console.error('Error adding new option:', error);
                  }
                }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-green-50 text-green-700 flex items-center"
              >
                <span className="font-medium">+ Add new: </span>
                <span className="ml-1 italic">{searchTerm}</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.value);
                const isFocused = index === focusedIndex;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center ${
                      isFocused ? 'bg-blue-100' : 'hover:bg-gray-100'
                    } ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mr-2 h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    )}
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchableDropdown;