class Message < ApplicationRecord
    include EncryptionHelper

    after_create :schedule_expiration_job

    MAX_ALLOWED_TIME = 1.year + 1.day

    validates :views_remaining, numericality: { only_integer: true, greater_than: 0, less_than: 51 }
    validate :expiration_time_within_limit
    validates :encrypted_content, presence: true, length: { minimum: 1, maximum: 65_535 }
    before_create :set_defaults

    def set_defaults
      self.id ||= generate_unique_id
    end

    def self.auto_delete_expired
      where("views_remaining <= 0 OR expiration_time <= ?", Time.current).destroy_all
    end

    def auto_delete_expired
      destroy if has_expired
    end

    def has_expired
      Time.current >= expiration_time
    end

    private

    def schedule_expiration_job
      ExpireMessageJob.set(wait_until: expiration_time).perform_later(id)
    end

    def expiration_time_within_limit
      if expiration_time.present? && expiration_time > Time.current + MAX_ALLOWED_TIME
        errors.add(:expiration_time, "must be within #{MAX_ALLOWED_TIME.inspect} from now")
      end
    end

    def generate_unique_id
      loop do
        random_id = generate_random_string(16)
        break random_id unless Message.exists?(id: random_id)
      end
    end
end
