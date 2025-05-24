"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Bell,
  Calendar as CalendarIcon,
  Clock,
  Moon,
  User,
  Shield,
  Mail,
  Globe,
  Palette,
  Check
} from "lucide-react";

// Settings Card component
const SettingsCard = ({ title, icon, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          {icon}
        </div>
        <h3 className="ml-3 text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Toggle Switch component
const ToggleSwitch = ({ id, label, description, checked, onChange }) => {
  return (
    <div className="flex items-start justify-between">
      <div>
        <label htmlFor={id} className="font-medium text-sm text-gray-700">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="relative inline-block w-12 h-6 flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <span
          className={`${
            checked ? "bg-indigo-600" : "bg-gray-200"
          } block w-12 h-6 rounded-full transition-colors duration-200`}
        ></span>
        <span
          className={`${
            checked ? "translate-x-6" : "translate-x-1"
          } absolute left-0 top-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 transform`}
        ></span>
      </div>
    </div>
  );
};

// Settings Select component
const SettingsSelect = ({ id, label, description, value, onChange, options }) => {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default function SettingsPage() {
  // General settings
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  
  // Calendar settings
  const [calendarSettings, setCalendarSettings] = useState({
    defaultView: "month",
    weekStartsOn: "sunday",
    showWeekNumbers: false,
    workWeek: true,
    workHoursStart: "09:00",
    workHoursEnd: "17:00",
    enableReminders: true,
    defaultReminderTime: "30"
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    desktopNotifications: true,
    upcomingEvents: true,
    teamUpdates: true,
    systemAnnouncements: false
  });
  
  // Handle calendar setting changes
  const handleCalendarSettingChange = (setting, value) => {
    setCalendarSettings((prev) => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Handle notification setting changes
  const handleNotificationSettingChange = (setting, value) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Save settings
  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast.success("Settings saved successfully");
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </button>
      </div>
      
      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar Settings */}
        <SettingsCard title="Calendar Preferences" icon={<CalendarIcon size={20} />}>
          <SettingsSelect
            id="defaultView"
            label="Default Calendar View"
            value={calendarSettings.defaultView}
            onChange={(e) => handleCalendarSettingChange("defaultView", e.target.value)}
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
              { value: "day", label: "Day" }
            ]}
          />
          
          <SettingsSelect
            id="weekStartsOn"
            label="Week Starts On"
            value={calendarSettings.weekStartsOn}
            onChange={(e) => handleCalendarSettingChange("weekStartsOn", e.target.value)}
            options={[
              { value: "sunday", label: "Sunday" },
              { value: "monday", label: "Monday" },
              { value: "saturday", label: "Saturday" }
            ]}
          />
          
          <ToggleSwitch
            id="showWeekNumbers"
            label="Show Week Numbers"
            checked={calendarSettings.showWeekNumbers}
            onChange={(e) => handleCalendarSettingChange("showWeekNumbers", e.target.checked)}
          />
          
          <ToggleSwitch
            id="workWeek"
            label="Show Work Week (Mon-Fri) Only"
            checked={calendarSettings.workWeek}
            onChange={(e) => handleCalendarSettingChange("workWeek", e.target.checked)}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="workHoursStart" className="block text-sm font-medium text-gray-700">
                Work Hours Start
              </label>
              <input
                type="time"
                id="workHoursStart"
                value={calendarSettings.workHoursStart}
                onChange={(e) => handleCalendarSettingChange("workHoursStart", e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="workHoursEnd" className="block text-sm font-medium text-gray-700">
                Work Hours End
              </label>
              <input
                type="time"
                id="workHoursEnd"
                value={calendarSettings.workHoursEnd}
                onChange={(e) => handleCalendarSettingChange("workHoursEnd", e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </SettingsCard>
        
        {/* Notification Settings */}
        <SettingsCard title="Notification Preferences" icon={<Bell size={20} />}>
          <ToggleSwitch
            id="emailNotifications"
            label="Email Notifications"
            description="Receive calendar event reminders via email"
            checked={notificationSettings.emailNotifications}
            onChange={(e) => handleNotificationSettingChange("emailNotifications", e.target.checked)}
          />
          
          <ToggleSwitch
            id="desktopNotifications"
            label="Desktop Notifications"
            description="Receive calendar event reminders as desktop notifications"
            checked={notificationSettings.desktopNotifications}
            onChange={(e) => handleNotificationSettingChange("desktopNotifications", e.target.checked)}
          />
          
          <ToggleSwitch
            id="upcomingEvents"
            label="Upcoming Events"
            description="Get notified about your upcoming events"
            checked={notificationSettings.upcomingEvents}
            onChange={(e) => handleNotificationSettingChange("upcomingEvents", e.target.checked)}
          />
          
          <ToggleSwitch
            id="teamUpdates"
            label="Team Updates"
            description="Get notified when team members update shared calendars"
            checked={notificationSettings.teamUpdates}
            onChange={(e) => handleNotificationSettingChange("teamUpdates", e.target.checked)}
          />
          
          <div className="pt-2">
            <SettingsSelect
              id="defaultReminderTime"
              label="Default Reminder Time"
              description="Set the default time for event reminders"
              value={calendarSettings.defaultReminderTime}
              onChange={(e) => handleCalendarSettingChange("defaultReminderTime", e.target.value)}
              options={[
                { value: "0", label: "At time of event" },
                { value: "5", label: "5 minutes before" },
                { value: "10", label: "10 minutes before" },
                { value: "15", label: "15 minutes before" },
                { value: "30", label: "30 minutes before" },
                { value: "60", label: "1 hour before" },
                { value: "120", label: "2 hours before" },
                { value: "1440", label: "1 day before" }
              ]}
            />
          </div>
        </SettingsCard>
        
        {/* Theme Settings */}
        <SettingsCard title="Theme Settings" icon={<Palette size={20} />}>
          <ToggleSwitch
            id="darkMode"
            label="Dark Mode"
            description="Toggle between light and dark themes"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
          />
          
          <div className="pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calendar Color Scheme
            </label>
            <div className="grid grid-cols-5 gap-2">
              {["indigo", "blue", "purple", "teal", "emerald"].map((color) => (
                <button
                  key={color}
                  className={`h-8 rounded-md border-2 ${
                    color === "indigo" ? "border-indigo-600" : "border-transparent"
                  }`}
                  style={{ 
                    backgroundColor: `var(--color-${color}-500)`,
                    boxShadow: color === "indigo" ? "0 0 0 2px rgba(79, 70, 229, 0.2)" : "none"
                  }}
                >
                  {color === "indigo" && (
                    <Check className="h-4 w-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </SettingsCard>
        
        {/* Account Settings */}
        <SettingsCard title="Account Preferences" icon={<User size={20} />}>
          <SettingsSelect
            id="language"
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: "en", label: "English" },
              { value: "es", label: "Español" },
              { value: "fr", label: "Français" },
              { value: "de", label: "Deutsch" },
              { value: "zh", label: "中文" },
              { value: "ja", label: "日本語" }
            ]}
          />
          
          <SettingsSelect
            id="timeFormat"
            label="Time Format"
            value={calendarSettings.timeFormat}
            onChange={(e) => handleCalendarSettingChange("timeFormat", e.target.value)}
            options={[
              { value: "12", label: "12 Hour (AM/PM)" },
              { value: "24", label: "24 Hour" }
            ]}
          />
          
          <SettingsSelect
            id="dateFormat"
            label="Date Format"
            value={calendarSettings.dateFormat}
            onChange={(e) => handleCalendarSettingChange("dateFormat", e.target.value)}
            options={[
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }
            ]}
          />
        </SettingsCard>
      </div>
    </div>
  );
} 