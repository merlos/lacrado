module MessagesHelper
    def format_expiration_time_in_server(expiration_time)
      return "Never" if expiration_time.nil?

      # Convert expiration time to local time
      local_time = expiration_time.localtime
      time_diff = local_time - Time.current

      # Helper methods for context
      formatted_time = local_time.strftime("%-I:%M %p")
      day_name = local_time.to_date == Date.current + 1 ? "tomorrow" : local_time.strftime("%A")
      year_format = local_time.year == Time.current.year ? "" : ", %Y"

      # Determine the human-readable string
      case time_diff
      when 0...1.hour
        minutes = (time_diff / 1.minute).to_i
        "in #{minutes} minute#{'s' if minutes > 1} at #{formatted_time}"
      when 1.hour...1.day
        hours = (time_diff / 1.hour).to_i
        "in #{hours} hour#{'s' if hours > 1} at #{formatted_time}"
      when 1.day...7.days
        days = (time_diff / 1.day).to_i
        "in #{days} day#{'s' if days > 1} (#{day_name} at #{formatted_time})"
      when 7.days...365.days
        weeks = (time_diff / 7.days).to_i
        "in #{weeks} week#{'s' if weeks > 1} (#{local_time.strftime('%B %-d at %-I:%M %p')})"
      else
        "on #{local_time.strftime("%A, %B %-d#{year_format} at %-I:%M %p")}"
      end
    end

    def format_expiration_time_in_client(expiration_time)
        return "Never" if expiration_time.nil?
        # Pass the ISO8601 string to be handled by JavaScript
        content_tag(:span, "", data: { time: expiration_time.iso8601 }, class: "user-time")
    end
end
