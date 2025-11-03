class MessagesController < ApplicationController
    def new
        @message = Message.new
    end

    def created
        # The URL will be constructed entirely client-side using sessionStorage
        # Server never sees password1
        @message = Message.find_by(id: params[:id])
        
        if @message.nil?
            redirect_to new_message_path
            return
        end
        
        render :created
    end


    def create
        encrypted_content = params[:encrypted_content]
        views = params[:views_remaining].to_i
        expiration = params[:expiration_time]
        # password2 itself should NEVER be submitted; only a boolean flag indicates presence
        password2_present = ActiveModel::Type::Boolean.new.cast(params[:password2_present])

        # Debug logging
        Rails.logger.info "=== CREATE MESSAGE DEBUG ==="
        Rails.logger.info "encrypted_content present: #{encrypted_content.present?}"
        Rails.logger.info "encrypted_content length: #{encrypted_content&.length}"
        Rails.logger.info "password2_present (raw param): #{params[:password2_present].inspect}"
        Rails.logger.info "password2_present (casted): #{password2_present.inspect}"

        # Validation
        if encrypted_content.blank?
            render plain: "Encrypted content is required", status: :unprocessable_entity
            return
        end

        expiration_time = case expiration
        when "1_hour" then 1.hour.from_now
        when "3_hours" then 3.hours.from_now
        when "6_hours" then 6.hours.from_now
        when "12_hours" then 12.hours.from_now
        when "1_day" then 1.day.from_now
        when "3_days" then 3.days.from_now
        when "7_days" then 7.days.from_now
        when "15_days" then 15.days.from_now
        when "1_month" then 1.month.from_now
        when "1_year" then 1.year.from_now
        when "never" then nil
        else 3.days.from_now
        end

        @message = Message.new(
            encrypted_content: encrypted_content,
            expiration_time: expiration_time,
            views_remaining: views,
            password2_present: password2_present
        )

        if @message.save
            # Return JSON with message ID so client can construct the URL with password1
            render json: { id: @message.id, base_url: request.base_url }
        else
            render json: { errors: @message.errors.full_messages }, status: :unprocessable_entity
        end
    end

        # Called by the client AFTER a successful client-side decryption to decrement views_remaining
        # The client must not send any plaintext or password2 here — only the message id.
        def mark_viewed
            @message = Message.find_by(id: params[:id])
            if @message
                @message.update(views_remaining: @message.views_remaining - 1)
                @message.destroy if @message.views_remaining <= 0
                head :ok
            else
                head :not_found
            end
        end

    def decrypt
        @message = Message.find_by(id: params[:id])

        if @message
            # Pass encrypted content to view for client-side decryption
            @encrypted_content = @message.encrypted_content
            # password1 will be read from URL hash (#) by JavaScript, server never sees it

            # Note: view count is NOT decremented here - it will be decremented
            # by mark_viewed action after successful client-side decryption

            render :decrypt
            nil
        else
            render plain: "Message not found", status: :not_found
        end
    end
end
