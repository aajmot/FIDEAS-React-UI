import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  name?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  className = "",
  name,
  disabled = false,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      return new Date(value);
    }
    return new Date();
  });
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDateSelect = (date: Date) => {
    const isoString = date.toISOString().split('T')[0];
    onChange(isoString);
    setIsOpen(false);
    setViewMode('days');
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setFullYear(prev.getFullYear() - 1);
      } else {
        newMonth.setFullYear(prev.getFullYear() + 1);
      }
      return newMonth;
    });
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(monthIndex);
      return newMonth;
    });
    setViewMode('days');
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(year);
      return newMonth;
    });
    setViewMode('months');
  };

  const isSelectedDate = (date: Date | null) => {
    if (!date || !value) return false;
    const selectedDate = new Date(value);
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const getYearRange = () => {
    const currentYear = currentMonth.getFullYear();
    const startYear = Math.floor(currentYear / 10) * 10;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const days = getDaysInMonth(currentMonth);
  const years = getYearRange();

  const renderHeader = () => {
    if (viewMode === 'days') {
      return (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setViewMode('months')}
              className="px-2 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors flex items-center"
            >
              {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('years')}
              className="px-2 py-1 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors flex items-center"
            >
              {currentMonth.getFullYear()}
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      );
    } else if (viewMode === 'months') {
      return (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigateYear('prev')}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-medium">{currentMonth.getFullYear()}</h3>
          <button
            type="button"
            onClick={() => navigateYear('next')}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      );
    } else {
      const startYear = years[0];
      const endYear = years[years.length - 1];
      return (
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              setCurrentMonth(prev => {
                const newMonth = new Date(prev);
                newMonth.setFullYear(prev.getFullYear() - 10);
                return newMonth;
              });
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-medium">{startYear} - {endYear}</h3>
          <button
            type="button"
            onClick={() => {
              setCurrentMonth(prev => {
                const newMonth = new Date(prev);
                newMonth.setFullYear(prev.getFullYear() + 10);
                return newMonth;
              });
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      );
    }
  };

  const renderContent = () => {
    if (viewMode === 'days') {
      return (
        <>
          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const isDisabled = date ? isDateDisabled(date) : true;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => date && !isDisabled && handleDateSelect(date)}
                  disabled={!date || isDisabled}
                  className={`
                    p-2 text-xs rounded-md transition-all duration-200 font-medium
                    ${!date ? 'invisible' : ''}
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                    ${isSelectedDate(date) ? 'bg-primary text-white hover:bg-primary shadow-md' : ''}
                    ${isToday(date) && !isSelectedDate(date) ? 'bg-blue-50 text-primary ring-1 ring-primary/20' : ''}
                  `}
                >
                  {date?.getDate()}
                </button>
              );
            })}
          </div>
        </>
      );
    } else if (viewMode === 'months') {
      return (
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <button
              key={month}
              type="button"
              onClick={() => handleMonthSelect(index)}
              className={`
                p-3 text-sm rounded-md transition-all duration-200 font-medium
                hover:bg-gray-100
                ${currentMonth.getMonth() === index ? 'bg-primary text-white' : ''}
              `}
            >
              {month}
            </button>
          ))}
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-3 gap-2">
          {years.map(year => (
            <button
              key={year}
              type="button"
              onClick={() => handleYearSelect(year)}
              className={`
                p-3 text-sm rounded-md transition-all duration-200 font-medium
                hover:bg-gray-100
                ${currentMonth.getFullYear() === year ? 'bg-primary text-white' : ''}
              `}
            >
              {year}
            </button>
          ))}
        </div>
      );
    }
  };

  return (
    <div ref={datePickerRef} className={`relative ${className}`}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          height: 'var(--erp-input-height)',
          padding: 'var(--erp-input-padding)',
          fontSize: 'var(--erp-font-size)'
        }}
        className={`
          w-full border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer flex items-center justify-between bg-white transition-all duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'ring-1 ring-primary border-primary' : ''}
        `}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar className={`h-4 w-4 transition-colors ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
      </div>

      {isOpen && !disabled && (
        <div className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] p-4 min-w-80 animate-fade-in-up" style={{ 
          top: datePickerRef.current ? `${datePickerRef.current.getBoundingClientRect().bottom + 4}px` : '0',
          left: datePickerRef.current ? `${datePickerRef.current.getBoundingClientRect().left}px` : '0'
        }}>
          {renderHeader()}
          {renderContent()}
          
          {/* Quick Actions */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                if (!isDateDisabled(today)) {
                  handleDateSelect(today);
                }
              }}
              className="text-xs text-primary hover:text-secondary font-medium transition-colors"
              disabled={isDateDisabled(new Date())}
            >
              Today
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setViewMode('days');
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setViewMode('days');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;