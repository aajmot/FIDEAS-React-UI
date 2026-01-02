import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DateTimePickerProps {
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

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date and time",
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
  const [selectedTime, setSelectedTime] = useState(() => {
    if (value) {
      const date = new Date(value);
      return {
        hours: date.getHours(),
        minutes: date.getMinutes()
      };
    }
    return { hours: new Date().getHours(), minutes: new Date().getMinutes() };
  });
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

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDateTimeSelect = (date: Date, time?: { hours: number; minutes: number }) => {
    const timeToUse = time || selectedTime;
    const newDateTime = new Date(date);
    newDateTime.setHours(timeToUse.hours, timeToUse.minutes, 0, 0);
    
    const isoString = newDateTime.toISOString().slice(0, 16);
    onChange(isoString);
    setSelectedTime(timeToUse);
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: number) => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    
    if (value) {
      const currentDate = value ? new Date(value) : new Date();
      handleDateTimeSelect(currentDate, newTime);
    }
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
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
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
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center p-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((date, index) => {
              const isDisabled = date ? isDateDisabled(date) : true;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => date && !isDisabled && handleDateTimeSelect(date)}
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

          {/* Time Selection */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Time</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <select
                value={selectedTime.hours}
                onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="text-sm font-medium">:</span>
              <select
                value={selectedTime.minutes}
                onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
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
          {value ? formatDateTime(value) : placeholder}
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
          
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                if (!isDateDisabled(now)) {
                  const nowTime = { hours: now.getHours(), minutes: now.getMinutes() };
                  handleDateTimeSelect(now, nowTime);
                  setIsOpen(false);
                  setViewMode('days');
                }
              }}
              className="text-xs text-primary hover:text-secondary font-medium transition-colors"
              disabled={isDateDisabled(new Date())}
            >
              Now
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

export default DateTimePicker;