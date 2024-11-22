class MessagesController < ApplicationController
        include EncryptionHelper
  
    def new
        @message = Message.new
    end
  
    def created
        id = params[:id]
        if session[:password1].nil?
            redirect_to new_message_path
            return
        end
        password1 = session[:password1]
        # clear the password1 from the session
        session[:password1] = nil
        @message = Message.find_by(id: params[:id])
        if @message 
            @url = "#{request.base_url}/#{id}/#{password1}"
            render :created
        end
    end


    def create
        password1 = generate_random_string
        message = params[:content]
        views = params[:views_remaining].to_i
        expiration = params[:expiration_time]
        password2 = params[:password2]
        
        # Validation
        # password2 is not part of the model, and optional to be filled
        # however if password2 is present, it should be at least 10 characters long 
        # and max 64 characters long
        if password2.present? && (password2.length < 10 || password2.length > 64)
            render plain: "Password2 must be between 10 and 64 characters long", status: :unprocessable_entity
            return
        end
        
        encrypted_content = encryptor(message, password1, password2)
        expiration_time = case expiration
                        when "1_hour" then 1.hour.from_now
                        when "3_hours" then 3.hours.from_now
                        when "6_hours" then 6.hours.from_now
                        when "12_hours" then 12.hours.from_now     
                        when "1_day" then 1.day.from_now
                        when "3_days" then 3.days.from_now
                        when "7_days" then 7.days.from_now
                        when "1_month" then 1.month.from_now
                        when "1_year" then 1.year.from_now
                        when "never" then nil 
                        else 3.days.from_now
                        end

        @message = Message.new(
            encrypted_content: encrypted_content,
            expiration_time: expiration_time,
            views_remaining: views,
            password2_present: password2.present?
        )
  
        if @message.save
            session[:password1] = password1
            redirect_to created_path(@message.id)            
            return
        else
            #puts "Error saving message: #{@message.errors.full_messages.join(', ')}"
            render :new, status: :unprocessable_entity
        end
    end
  
    def get_password2
        @id = params[:id]
        @password1 = params[:password1]
        render :get_password2
    end

    def decrypted
        @message = Message.find_by(id: params[:id])
        password1 = params[:password1]
        if @message
            # ensure password2 is required
            if not @message.password2_present
                redirect_to decrypt_path(id: @message.id, password1: password1)
                return
            end 
            # ensure password2 has been previously stored in the session
            if not session[:password2].present?
                redirect_to get_password2_path(id: @message.id, password1: password1)
                return
            end
            password2 = session[:password2]
            # clear the password2 from the session
            session[:password2] = nil
            # now try to decrtpy
            begin
                @decrypted_content = decryptor(@message.encrypted_content, password1, password2)
                @message.update(views_remaining: @message.views_remaining - 1)
                @message.destroy if @message.views_remaining <= 0
                render :decrypt 
                return
            rescue StandardError => e
                flash[:error] = "Incorrect password"
                redirect_to get_password2_path(id: @message.id, password1: password1)
            end
        else
            render plain: "Message not found", status: :not_found
        end
    end

    def decrypt
        @message = Message.find_by(id: params[:id])
        password1 = params[:password1]
        password2 = params[:password2]
  
        if @message
            # display message to debug
            #puts @message.inspect
            #puts "Needs password2 & password2 present?", @message.password2_present, password2.present?
            
            # First check if password2 is required and not present
            if @message.password2_present && !password2.present?
                redirect_to get_password2_path(id: @message.id, password1: password1)
                return
            end
            
            # Now decrypt the message
            begin
                @decrypted_content = decryptor(@message.encrypted_content, password1, password2)
                #
                if password2.present?
                    session[:password2] = password2
                    redirect_to decrypted_path(id: @message.id, password1: password1)
                    return
                end
                @message.update(views_remaining: @message.views_remaining - 1)
                @message.destroy if @message.views_remaining <= 0
                #puts @message.created_at 
                render :decrypt
                return
            rescue StandardError => e
                flash[:error] = "Incorrect password"
                redirect_to get_password2_path(id: @message.id, password1: password1)
            end
        else
            render plain: "Message not found", status: :not_found
        end
    end
end