import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/UI';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/api/appointmentService';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  isCompleted: boolean;
  type: 'upcoming' | 'past';
}

export const PatientAppointmentHistory = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: async () => {
      try {
        return await appointmentService.getAppointments();
      } catch {
        return [];
      }
    },
  });

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0];
      return aptDate === dateStr;
    });
  };

  const hasAppointmentOnDate = (date: Date | null) => {
    if (!date) return false;
    return getAppointmentsForDate(date).length > 0;
  };

  const getAppointmentStatus = (date: Date | null) => {
    if (!date) return null;
    const apts = getAppointmentsForDate(date);
    if (apts.length === 0) return null;
    // Return 'attended' if any appointment is completed, 'missed' otherwise
    return apts.some(apt => apt.isCompleted) ? 'attended' : 'missed';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentDate);
  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Appointment History</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base mt-1">View all your past and upcoming appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="px-4 py-2 bg-white dark:bg-surface-dark rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            title={viewMode === 'calendar' ? 'Switch to list view' : 'Switch to calendar view'}
            aria-label={viewMode === 'calendar' ? 'Switch to list view' : 'Switch to calendar view'}
          >
            <Icon name={viewMode === 'calendar' ? 'list' : 'calendar_month'} className="text-base" />
            {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Previous month"
                aria-label="Previous month"
              >
                <Icon name="chevron_left" className="text-xl" />
              </button>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Next month"
                aria-label="Next month"
              >
                <Icon name="chevron_right" className="text-xl" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const hasApt = hasAppointmentOnDate(date);
                const status = getAppointmentStatus(date);
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : isToday
                        ? 'border-teal-300 bg-teal-50/50 dark:bg-teal-900/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    title={hasApt ? `Appointments on ${date.toLocaleDateString()}` : `No appointments on ${date.toLocaleDateString()}`}
                    aria-label={`${date.getDate()} ${monthNames[date.getMonth()]}`}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-900 dark:text-white'}`}>
                      {date.getDate()}
                    </span>
                    {hasApt && (
                      <div
                        className={`absolute bottom-1 left-1/2 -translate-x-1/2 size-2 rounded-full ${
                          status === 'attended' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        aria-label={status === 'attended' ? 'Attended appointment' : 'Missed appointment'}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500" />
                <span className="text-slate-600 dark:text-slate-400">Attended</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500" />
                <span className="text-slate-600 dark:text-slate-400">Missed</span>
              </div>
            </div>
          </div>

          {/* Selected Date Appointments */}
          <div className="lg:col-span-1 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {selectedDate ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                {selectedAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedAppointments.map(apt => (
                      <div
                        key={apt.id}
                        className={`p-4 rounded-xl border ${
                          apt.isCompleted
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{apt.doctorName}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{apt.specialty}</p>
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              apt.isCompleted
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {apt.isCompleted ? 'Attended' : 'Missed'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {apt.time} • {new Date(apt.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No appointments on this date</p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a date to view appointments</p>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map(apt => (
              <div
                key={apt.id}
                className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{apt.doctorName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{apt.specialty}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {new Date(apt.date).toLocaleDateString()} • {apt.time}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded ${
                      apt.isCompleted
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {apt.isCompleted ? 'Attended' : 'Missed'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800">
              <Icon name="event" className="text-6xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No appointments found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

