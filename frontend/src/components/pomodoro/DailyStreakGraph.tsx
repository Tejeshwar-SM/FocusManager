import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from '../../styles/pomodoro/PomodoroPage.module.css';
import { DailyStat } from '../../services/PomodoroService';

interface DailyStreakGraphProps {
  dailyData: DailyStat[];
}

interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

interface MonthLabel {
  label: string;
  startWeekIndex: number;
}

// Helper to get the date string in YYYY-MM-DD format
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format duration for tooltip
const formatDurationTooltip = (durationMinutes: number): string => {
  if (durationMinutes < 1) return "Less than a minute";
  const hours = Math.floor(durationMinutes / 60);
  const minutes = Math.round(durationMinutes % 60);
  let formatted = '';
  if (hours > 0) {
    formatted += `${hours} hr${hours > 1 ? 's' : ''} `;
  }
  if (minutes > 0 || hours === 0) {
    formatted += `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  return formatted.trim();
};

// Determine the GREEN color level based on duration (minutes)
const getColorLevel = (duration: number | undefined): number => {
  if (duration === undefined || duration <= 0) return 0;
  // Green scale thresholds (adjust as needed) - based on minutes
  if (duration < 15) return 1; // Lightest Green (1-14 min)
  if (duration < 45) return 2; // (15-44 min)
  if (duration < 90) return 3; // (45-89 min)
  if (duration < 180) return 4; // (90-179 min)
  return 5; // Darkest Green (180+ min)
};

const DailyStreakGraph: React.FC<DailyStreakGraphProps> = ({ dailyData }) => {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, content: '', x: 0, y: 0 });
  const graphRef = useRef<HTMLDivElement>(null);
  const graphWrapperRef = useRef<HTMLDivElement>(null);

  // Create a map for quick lookup of duration by date
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    if (Array.isArray(dailyData)) {
      dailyData.forEach(item => {
        if (item && typeof item.date === 'string' && typeof item.totalDuration === 'number') {
          map.set(item.date, item.totalDuration);
        }
      });
    }
    return map;
  }, [dailyData]);

  // Calculate weeks and month labels
  const { weeks, monthLabels } = useMemo(() => {
    // Step 1: Define date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364); // Go back 365 days (inclusive)
    startDate.setHours(0, 0, 0, 0); // Start at the beginning of the day

    // Step 2: Find the first Sunday that encompasses our date range
    // This ensures our grid columns always start with Sunday
    const firstSundayDate = new Date(startDate);
    while (firstSundayDate.getDay() !== 0) { // 0 = Sunday
      firstSundayDate.setDate(firstSundayDate.getDate() - 1);
    }

    // Step 3: Generate all dates from firstSunday to endDate
    const days: Date[] = [];
    let currentDate = new Date(firstSundayDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Step 4: Group days into full weeks (Sunday to Saturday)
    const weeksData: (Date | null)[][] = [];
    let currentWeek: Date[] = [];
    days.forEach(day => {
      // Add the day to the current week
      currentWeek.push(day);
      
      // If it's Saturday (day 6), complete the week and start a new one
      if (day.getDay() === 6) { // Saturday is the end of the week
        weeksData.push([...currentWeek]); // Add a copy of the week to weeks
        currentWeek = []; // Reset for the next week
      }
    });

    // Add the final partial week if it exists
    if (currentWeek.length > 0) {
      // Pad with null values to complete the week
      while (currentWeek.length < 7) {
        currentWeek.push(null as unknown as Date); // Add nulls for missing days
      }
      weeksData.push(currentWeek);
    }

    // Step 5: Mark dates before our start date as null (outside our range)
    weeksData.forEach(week => {
      for (let i = 0; i < week.length; i++) {
        const day = week[i];
        if (day && day < startDate) {
          week[i] = null as unknown as Date;
        }
      }
    });

    // Step 6: Calculate month labels
    const labels: MonthLabel[] = [];
    let lastMonth = -1;
    weeksData.forEach((week, weekIndex) => {
      // Find the first valid date in the week to determine the month
      const firstValidDayInWeek = week.find(day => day instanceof Date) as Date | undefined;
      if (firstValidDayInWeek) {
        const month = firstValidDayInWeek.getMonth();
        if (month !== lastMonth) {
          // Only show label if it's the first week or early in the month
          if (weekIndex === 0 || firstValidDayInWeek.getDate() <= 7) {
            labels.push({
              label: firstValidDayInWeek.toLocaleDateString('en-US', { month: 'short' }),
              startWeekIndex: weekIndex
            });
            lastMonth = month;
          }
        }
      }
    });

    return { weeks: weeksData, monthLabels: labels };
  }, []);

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>, date: Date, duration: number | undefined) => {
    const dateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const durationString = duration !== undefined && duration > 0
      ? `${formatDurationTooltip(duration)} focus`
      : 'No focus time';
    const rect = event.currentTarget.getBoundingClientRect();

    setTooltip({
      visible: true,
      content: `${durationString} on ${dateString}`,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Effect to scroll the graph to the end on initial load
  useEffect(() => {
    const graphWrapper = graphWrapperRef.current;
    if (graphWrapper) {
      graphWrapper.scrollLeft = graphWrapper.scrollWidth;
    }
  }, [weeks]);

  return (
    <div className={styles.streakGraphContainer}>
      <h2>Daily Focus Streak</h2>

      {/* Wrapper div that handles horizontal scrolling */}
      <div className={styles.graphWrapper} ref={graphWrapperRef}>
        {/* The actual graph grid structure */}
        <div className={styles.graph} ref={graphRef}>
          {/* Month Labels Row */}
          <div className={styles.monthsContainer} style={{ gridTemplateColumns: `repeat(${weeks.length}, calc(12px + 3px))` }}>
            {monthLabels.map(({ label, startWeekIndex }) => (
              <div
                key={`${label}-${startWeekIndex}`}
                className={styles.monthLabel}
                style={{ gridColumnStart: startWeekIndex + 1 }}
              >
                {label}
              </div>
            ))}
          </div>
          
          {/* Day Labels Column - correctly aligned with grid cells */}
          <div className={styles.dayLabels}>
            <div className={styles.dayLabel}>Sun</div> {/* Sunday - row 0 */}
            <div className={styles.dayLabel}>Mon</div> {/* Monday - row 1 */}
            <div className={styles.dayLabel}>Tue</div> {/* Tuesday - row 2 */}
            <div className={styles.dayLabel}>Wed</div> {/* Wednesday - row 3 */}
            <div className={styles.dayLabel}>Thu</div> {/* Thursday - row 4 */}
            <div className={styles.dayLabel}>Fri</div> {/* Friday - row 5 */}
            <div className={styles.dayLabel}>Sat</div> {/* Saturday - row 6 */}
          </div>
          
          {/* Weeks Grid */}
          <div className={styles.weeksContainer}>
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className={styles.week}>
                {week.map((day, dayIndex) => {
                  // If 'day' is null, render an empty placeholder square
                  if (!day) {
                    return <div 
                      key={`pad-${weekIndex}-${dayIndex}`} 
                      className={`${styles.day} ${styles.empty}`}
                      aria-hidden="true"
                    ></div>;
                  }

                  // If 'day' is a valid Date object
                  const dateString = formatDate(day);
                  const duration = dataMap.get(dateString);
                  const level = getColorLevel(duration);
                  const dayKey = `${dateString}-${dayIndex}`;

                  // ARIA labels for accessibility
                  const ariaDateString = day.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    weekday: 'long' // Include weekday for verification
                  });
                  const ariaDurationString = duration !== undefined && duration > 0
                    ? formatDurationTooltip(duration)
                    : 'No';

                  return (
                    <div
                      key={dayKey}
                      className={`${styles.day} ${styles[`level-${level}`]}`}
                      onMouseEnter={(e) => handleMouseEnter(e, day, duration)}
                      onMouseLeave={handleMouseLeave}
                      aria-label={`${ariaDurationString} focus time on ${ariaDateString}`}
                      role="gridcell"
                      tabIndex={0}
                      data-date={dateString}
                      data-day={day.getDay()} // Add day of week (0-6) for debugging
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className={styles.tooltip}
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
          role="tooltip"
        >
          {tooltip.content}
        </div>
      )}
      
      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={`${styles.day} ${styles['level-0']}`} aria-label="No focus time"></div>
        <div className={`${styles.day} ${styles['level-1']}`} aria-label="1-14 minutes focus time"></div>
        <div className={`${styles.day} ${styles['level-2']}`} aria-label="15-44 minutes focus time"></div>
        <div className={`${styles.day} ${styles['level-3']}`} aria-label="45-89 minutes focus time"></div>
        <div className={`${styles.day} ${styles['level-4']}`} aria-label="90-179 minutes focus time"></div>
        <div className={`${styles.day} ${styles['level-5']}`} aria-label="180+ minutes focus time"></div>
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  );
};

export default DailyStreakGraph;