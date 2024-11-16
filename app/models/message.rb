class Message < ApplicationRecord
    include EncryptionHelper
  
    before_create :set_defaults
  
    def set_defaults
      self.id ||= generate_random_string(10)
    end
  
    def self.auto_delete_expired
      where("views_remaining <= 0 OR expiration_time <= ?", Time.current).destroy_all
    end
  end
  