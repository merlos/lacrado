class ExpireMessageJob < ApplicationJob
  queue_as :default

  def perform(message_id)
    message = Message.find_by(id: message_id)
    message.auto_delete_expired if message
  end
end
